/**
 * Jeffrey health service — canonical brain.
 *
 * Surface: "health". Provider: OpenAI via @aissisted/jeffrey. Persona:
 * the canonical British Jeffrey (system prompt + voice guard shared with
 * investor / onboarding / brand surfaces). Data path and intent routing are
 * preserved from the production Anthropic implementation.
 *
 * Rollback posture: if OPENAI_API_KEY is unset OR JEFFREY_BRAIN=anthropic is
 * set, we fall back to the Anthropic path. The rollback route is used only
 * during transition — the default (one canonical brain) is OpenAI.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  createJeffreySession,
  type JeffreyMessage,
  type JeffreySurface,
} from "@aissisted/jeffrey";
import { config } from "../config.js";
import { parseIntent } from "./intent.js";
import {
  getOrCreateConversation,
  getConversationHistory,
  addMessage,
} from "./conversation.service.js";
import { generateProtocol, getLatestProtocol } from "./protocol.service.js";
import { getProfile } from "./profile.service.js";
import { getLatestBiomarkers } from "./biomarker.service.js";
import { getRangeStatus } from "../engine/biomarker-ranges.js";
import { getLatestHealthState } from "./analysis.service.js";
import { logSupplement, getAdherenceScore } from "./adherence.service.js";
import { getBiomarkerTrends, type BiomarkerTrendRecord } from "./trends.service.js";
import { dbMemoryAdapter } from "./jeffrey-memory.adapter.js";

// ─── Transition rollback flag ────────────────────────────────────────────
// Default brain is the canonical OpenAI Jeffrey. Flipping JEFFREY_BRAIN to
// "anthropic" reverts to the legacy Claude code path. Remove once the
// migration has soaked for a full release cycle.
const USE_CANONICAL =
  (process.env.JEFFREY_BRAIN ?? "openai").toLowerCase() !== "anthropic" &&
  config.openaiApiKey.length > 0;

// ─── Legacy Anthropic client (retained for rollback) ─────────────────────
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// Legacy system prompt — kept only for the Anthropic fallback path.
const LEGACY_JEFFREY_SYSTEM = `You are Jeffrey, the AI health concierge for Aissisted. You are warm, clear, and evidence-based.

Your role:
- Help users understand their health data and supplement protocols
- Answer questions about biomarkers, supplements, and wellness
- Generate or explain supplement stacks when asked
- Ask clarifying questions when more context would improve your recommendation
- Never diagnose medical conditions or replace a physician
- Always cite the physiological rationale for recommendations

Tone: Knowledgeable, encouraging, specific. Not preachy or generic.

If the user asks to generate a protocol, tell them you're running the analysis and that the results will appear in their dashboard.
If they ask about a specific supplement, explain the mechanism, evidence, and timing.
If they ask about a biomarker, explain the reference range, what it indicates, and what affects it.`;

export interface JeffreyChatResult {
  reply: string;
  conversationId: string;
  intent: string;
  protocolTriggered: boolean;
}

// ─── Public entrypoint ───────────────────────────────────────────────────
// Surface is optional and defaults to "health" — the only surface that
// carries the full health context. Non-health surfaces call askSurface()
// directly (see routes/jeffrey.ts) and bypass the health context gathering.
export async function chat(
  userId: string,
  message: string,
  conversationId?: string,
): Promise<JeffreyChatResult> {
  // 1. Get or create conversation
  const conversation = await getOrCreateConversation(userId, conversationId);

  // 2. Parse intent
  const intent = await parseIntent(message);

  // 3. Save user message
  await addMessage(conversation.id, "user", message, intent.type);

  // 4. Handle intent-specific actions (preserved verbatim from legacy)
  let protocolTriggered = false;
  let contextInjection = "";

  if (intent.type === "generate_protocol") {
    try {
      const protocol = await generateProtocol(userId);
      protocolTriggered = true;
      contextInjection = `\n\n[PROTOCOL GENERATED]\n${JSON.stringify(
        protocol?.recommendations?.map((r) => ({
          name: r.name,
          dosage: r.dosage,
          timing: r.timing,
          timeSlot: r.timeSlot,
        })),
        null,
        2,
      )}\n\nSummary: ${protocol?.summary}`;
    } catch {
      contextInjection =
        "\n\n[Note: Protocol generation failed — user may need to add biomarker data first]";
    }
  }

  if (intent.type === "log_supplement") {
    const supplementName =
      (intent.entities?.supplement_name as string) ??
      (intent.entities?.name as string) ??
      extractSupplementFromMessage(message);

    if (supplementName) {
      const skipped = /skip|skipped|miss|missed|forgot/i.test(message);
      try {
        await logSupplement(userId, {
          supplementName,
          skipped,
          takenAt: skipped ? undefined : new Date().toISOString(),
          note: message.slice(0, 200),
        });
        contextInjection = `\n\n[SUPPLEMENT LOGGED: ${supplementName} — ${skipped ? "skipped" : "taken"}]`;
      } catch {
        contextInjection = `\n\n[Note: Could not log supplement automatically]`;
      }
    }
  }

  if (intent.type === "check_adherence") {
    try {
      const score = await getAdherenceScore(userId, 7);
      contextInjection = `\n\n[ADHERENCE DATA (last 7 days): ${score.score}% — ${score.taken} taken, ${score.skipped} skipped out of ${score.total} total logged]`;
    } catch {
      contextInjection = `\n\n[Note: No adherence data recorded yet]`;
    }
  }

  if (intent.type === "health_state_check") {
    try {
      const healthState = await getLatestHealthState(userId);
      if (healthState) {
        const signalSummary = healthState.activeSignals
          .filter((s) => s.severity !== "info")
          .slice(0, 5)
          .map((s) => `${s.key}: ${s.explanation}`)
          .join("; ");
        contextInjection = `\n\n[HEALTH STATE: mode=${healthState.mode}, confidence=${Math.round(healthState.confidenceScore * 100)}%\nActive signals: ${signalSummary || "none"}\nWarnings: ${healthState.warnings.join("; ") || "none"}\nMissing data: ${healthState.missingDataFlags.slice(0, 4).join(", ") || "none"}]`;
      } else {
        contextInjection = `\n\n[No health state computed yet — user may need to add lab data first]`;
      }
    } catch {
      contextInjection = `\n\n[Health state unavailable]`;
    }
  }

  // 5. Gather user context for Jeffrey (preserved verbatim)
  const [profile, biomarkers, latestProtocol, healthState, trendRecords] =
    await Promise.all([
      getProfile(userId),
      getLatestBiomarkers(userId),
      intent.type !== "generate_protocol"
        ? getLatestProtocol(userId)
        : Promise.resolve(null),
      intent.type === "health_state_check" || intent.type === "generate_protocol"
        ? getLatestHealthState(userId).catch(() => null)
        : Promise.resolve(null),
      getBiomarkerTrends(userId).catch(() => [] as BiomarkerTrendRecord[]),
    ]);

  const userContext = buildUserContext(
    profile,
    biomarkers,
    latestProtocol,
    healthState,
    trendRecords,
  );

  // 6. Conversation history (multi-turn)
  const history = await getConversationHistory(conversation.id, 12);

  // 7. Generate reply — canonical path, or Anthropic fallback for rollback.
  let reply: string;

  if (USE_CANONICAL) {
    reply = await askCanonicalHealth({
      userId,
      message,
      userContext,
      contextInjection: protocolTriggered ? contextInjection : "",
      history,
    });
  } else if (config.anthropicApiKey) {
    reply = await askLegacyAnthropic({
      message,
      userContext,
      contextInjection,
      protocolTriggered,
      history,
    });
  } else {
    reply = buildFallbackReply(intent.type);
  }

  // 8. Save assistant reply
  await addMessage(conversation.id, "assistant", reply, undefined, {
    protocolTriggered,
    intentType: intent.type,
    brain: USE_CANONICAL ? "openai" : config.anthropicApiKey ? "anthropic" : "fallback",
  });

  return {
    reply,
    conversationId: conversation.id,
    intent: intent.type,
    protocolTriggered,
  };
}

// ─── Canonical path: @aissisted/jeffrey session ──────────────────────────

interface CanonicalArgs {
  userId: string;
  message: string;
  userContext: string;
  contextInjection: string;
  history: Array<{ role: string; content: string }>;
}

async function askCanonicalHealth(args: CanonicalArgs): Promise<string> {
  const session = await createJeffreySession({
    surface: "health",
    userId: args.userId,
    memoryAdapter: dbMemoryAdapter,
    extraContext: [
      "### Current user context (live)\n" + args.userContext,
    ],
  });

  // Seed ephemeral session memory with prior turns so the one canonical
  // Jeffrey speaks with full continuity.
  for (const h of args.history) {
    if (h.role === "user" || h.role === "assistant") {
      session.memory.push({
        role: h.role,
        content: h.content,
      } satisfies JeffreyMessage);
    }
  }

  const finalMessage = args.contextInjection
    ? `${args.message}\n${args.contextInjection}`
    : args.message;

  try {
    const out = await session.ask(finalMessage);
    return out.text || "I couldn't compose a reply just now. Please try again.";
  } catch (err) {
    // Soft-fail: if OpenAI errors, fall back to the legacy path if available
    // rather than 500'ing the caller. Logged for observability.
    // eslint-disable-next-line no-console
    console.warn("[jeffrey] canonical path failed, attempting fallback", err);
    if (config.anthropicApiKey) {
      return askLegacyAnthropic({
        message: args.message,
        userContext: args.userContext,
        contextInjection: args.contextInjection,
        protocolTriggered: !!args.contextInjection,
        history: args.history,
      });
    }
    return buildFallbackReply("general_health_question");
  }
}

// ─── Legacy path: Anthropic (preserved for rollback) ─────────────────────

interface LegacyArgs {
  message: string;
  userContext: string;
  contextInjection: string;
  protocolTriggered: boolean;
  history: Array<{ role: string; content: string }>;
}

async function askLegacyAnthropic(args: LegacyArgs): Promise<string> {
  const claudeMessages: Anthropic.MessageParam[] = args.history
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (args.protocolTriggered && claudeMessages.length > 0) {
    const last = claudeMessages[claudeMessages.length - 1];
    if (last.role === "user") {
      claudeMessages[claudeMessages.length - 1] = {
        role: "user",
        content: (last.content as string) + args.contextInjection,
      };
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: LEGACY_JEFFREY_SYSTEM,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: "\n\nUser context:\n" + args.userContext,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: claudeMessages,
    });
    return response.content[0].type === "text"
      ? response.content[0].text
      : "I couldn't process that — please try again.";
  } catch {
    return buildFallbackReply("general_health_question");
  }
}

// ─── Helpers (preserved) ─────────────────────────────────────────────────

function extractSupplementFromMessage(message: string): string | undefined {
  const match = message.match(
    /(?:took|taking|skipped|missed|my)\s+([\w\s-]+?)(?:\s+today|\s+this|\s+just|\.|\,|$)/i,
  );
  return match?.[1]?.trim();
}

function buildUserContext(
  profile: Awaited<ReturnType<typeof getProfile>>,
  biomarkers: Awaited<ReturnType<typeof getLatestBiomarkers>>,
  protocol: Awaited<ReturnType<typeof getLatestProtocol>>,
  healthState: Awaited<ReturnType<typeof getLatestHealthState>> | null,
  trendRecords: BiomarkerTrendRecord[],
): string {
  const parts: string[] = [];

  const trendMap = new Map<string, BiomarkerTrendRecord>();
  for (const t of trendRecords) trendMap.set(t.biomarkerName, t);

  if (profile) {
    parts.push(`User: ${profile.firstName} ${profile.lastName}`);
    if (profile.goals.length) parts.push(`Goals: ${profile.goals.join(", ")}`);
    if (profile.conditions.length)
      parts.push(`Conditions: ${profile.conditions.join(", ")}`);
    if (profile.medications.length)
      parts.push(`Medications: ${profile.medications.join(", ")}`);
  }

  if (biomarkers.length) {
    const bList = biomarkers
      .slice(0, 15)
      .map((b) => {
        const { status } = getRangeStatus(b.name, b.value);
        const statusNote =
          status !== "unknown" && status !== "optimal"
            ? ` [${status.toUpperCase()}]`
            : "";

        const trend = trendMap.get(b.name);
        let trendNote = "";
        if (trend && trend.readingCount >= 3) {
          if (trend.trendDirection === "worsening") {
            const slopeDesc =
              trend.slope30d !== null
                ? ` (${trend.slope30d > 0 ? "+" : ""}${trend.slope30d.toFixed(1)} ${b.unit}/30d)`
                : "";
            trendNote = ` ↓WORSENING${slopeDesc}`;
          } else if (trend.trendDirection === "improving") {
            trendNote = ` ↑IMPROVING`;
          }
          if (trend.rollingAvg30d !== null) {
            trendNote += ` avg30d=${trend.rollingAvg30d.toFixed(1)}`;
          }
        } else if (trend && trend.readingCount === 1) {
          trendNote = ` [new reading]`;
        }

        return `${b.name}: ${b.value} ${b.unit}${statusNote}${trendNote}`;
      })
      .join("\n  ");
    parts.push(`Recent biomarkers:\n  ${bList}`);
  }

  const worseningTrends = trendRecords
    .filter((t) => t.trendDirection === "worsening" && t.readingCount >= 3)
    .slice(0, 4);
  if (worseningTrends.length > 0) {
    const summary = worseningTrends
      .map((t) => {
        const slope =
          t.slope30d !== null
            ? ` (rate: ${t.slope30d > 0 ? "+" : ""}${t.slope30d.toFixed(2)} ${t.latestUnit}/30d)`
            : "";
        return `${t.biomarkerName}${slope}`;
      })
      .join(", ");
    parts.push(`Worsening trends: ${summary}`);
  }

  if (protocol) {
    const recNames = protocol.recommendations.map((r) => r.name).join(", ");
    parts.push(`Current protocol: ${recNames}`);
    parts.push(`Protocol summary: ${protocol.summary}`);
  }

  if (healthState) {
    const domainHighlights = Object.entries(healthState.domainScores)
      .filter(([, score]) => score >= 0.35)
      .sort(([, a], [, b]) => b - a)
      .map(([domain, score]) => `${domain}=${Math.round(score * 100)}%`)
      .join(", ");
    parts.push(
      `Health state: mode=${healthState.mode}, confidence=${Math.round(healthState.confidenceScore * 100)}%${domainHighlights ? `, elevated domains: ${domainHighlights}` : ""}`,
    );
    const criticalSignals = healthState.activeSignals
      .filter((s) => s.severity === "critical" || s.severity === "warn")
      .slice(0, 3)
      .map((s) => s.explanation);
    if (criticalSignals.length > 0) {
      parts.push(`Active health signals: ${criticalSignals.join("; ")}`);
    }
    if (healthState.warnings.length > 0) {
      parts.push(
        `Clinical warnings: ${healthState.warnings.slice(0, 2).join("; ")}`,
      );
    }
  }

  return parts.join("\n") || "No health data available yet.";
}

function buildFallbackReply(intentType: string): string {
  const responses: Record<string, string> = {
    greeting:
      "Hello. I'm Jeffrey. Add your OPENAI_API_KEY and I'll speak with full context of your data.",
    generate_protocol:
      "Your protocol has been generated. Head to your Dashboard for the stack, dosing, and timing. Ask me to explain anything in it.",
    update_goal:
      "Update your goals in Profile. Once saved, I'll generate a fresh protocol tuned to them.",
    explain_supplement:
      "To speak to this properly I need the AI layer online. Please configure OPENAI_API_KEY.",
    general_health_question:
      "To answer in full I need the AI layer online. Please configure OPENAI_API_KEY.",
    log_supplement:
      "Logged. Your adherence score will update as you keep logging.",
    check_adherence:
      "Your adherence is tracked. Keep logging each dose as you take it.",
    health_state_check:
      "I've summarised your current state from the latest labs. Add more biomarkers for a higher confidence score.",
  };

  return (
    responses[intentType] ??
    "I'm here. Please configure OPENAI_API_KEY for full responses."
  );
}

// ─── Non-health surfaces (investor / onboarding / brand / concierge) ─────
// Exposed for routes/jeffrey.ts. These surfaces do NOT receive health
// context — they are the premium Jeffrey in strategy / product / brand mode.

export interface AskSurfaceArgs {
  surface: JeffreySurface;
  userId?: string;
  message: string;
  extraContext?: string[];
}

export async function askSurface(args: AskSurfaceArgs): Promise<string> {
  if (!config.openaiApiKey) {
    return "The AI layer is not configured. Please set OPENAI_API_KEY.";
  }

  const session = await createJeffreySession({
    surface: args.surface,
    userId: args.userId,
    memoryAdapter: dbMemoryAdapter,
    extraContext: args.extraContext,
  });

  const out = await session.ask(args.message);
  return out.text;
}
