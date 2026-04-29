/**
 * Jeffrey health service — canonical brain.
 *
 * Surface: "health". Provider: OpenAI via @aissisted/jeffrey. Persona:
 * the canonical British Jeffrey (system prompt + voice guard shared with
 * investor / onboarding / brand surfaces). Data path and intent routing
 * preserved from the original Anthropic implementation.
 *
 * Degradation: if OPENAI_API_KEY is unset OR the canonical session throws,
 * the chat falls back to buildFallbackReply (provider-agnostic copy). The
 * legacy Anthropic rollback was retired once the OpenAI brain soaked on
 * canonical — there is no second provider in this code path anymore.
 */

import {
  createJeffreySession,
  noopMemoryAdapter,
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

  // 6. Conversation history (multi-turn). The current user turn was already
  //    persisted in step 3, so it will be present as the last entry here —
  //    downstream paths must drop it to avoid double-counting.
  const history = await getConversationHistory(conversation.id, 12);
  const priorHistory = dropTrailingUserEcho(history, message);

  // 7. Generate reply — canonical OpenAI path, with a graceful fallback if
  //    the key is unset (dev, degraded boot). contextInjection feeds ALL
  //    intents that produced one (protocol, supplement logging, adherence,
  //    health state) — not just protocol.
  const hasContextInjection = contextInjection.trim().length > 0;
  let reply: string;

  if (config.openaiApiKey) {
    reply = await askCanonicalHealth({
      userId,
      message,
      userContext,
      contextInjection: hasContextInjection ? contextInjection : "",
      history: priorHistory,
      intentType: intent.type,
    });
  } else {
    reply = buildFallbackReply(intent.type);
  }

  // 8. Save assistant reply
  await addMessage(conversation.id, "assistant", reply, undefined, {
    protocolTriggered,
    intentType: intent.type,
    brain: config.openaiApiKey ? "openai" : "fallback",
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
  intentType: string;
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
  // Jeffrey speaks with full continuity. `history` has already had the
  // current user turn dropped upstream to avoid duplication.
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
    return out.reply.text || "I couldn't compose a reply just now. Please try again.";
  } catch (err) {
    // Soft-fail: surface the provider-agnostic fallback so the caller never
    // gets a 500 for a transient OpenAI hiccup. Logged for observability.
    // eslint-disable-next-line no-console
    console.warn("[jeffrey] canonical path failed, using fallback", err);
    return buildFallbackReply(args.intentType);
  }
}

// ─── Helpers (preserved) ─────────────────────────────────────────────────

// The current user message is persisted *before* getConversationHistory is
// called, so history[history.length - 1] is typically the same turn the
// caller is about to ask. Drop it to avoid double-counting in the prompt.
function dropTrailingUserEcho(
  history: Array<{ role: string; content: string }>,
  currentMessage: string,
): Array<{ role: string; content: string }> {
  if (history.length === 0) return history;
  const last = history[history.length - 1];
  if (last.role === "user" && last.content === currentMessage) {
    return history.slice(0, -1);
  }
  return history;
}

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
  // Provider-agnostic copy — used whenever the canonical OpenAI brain is
  // unavailable (key unset OR a transient session error). Naming a specific
  // env var here would invert the abstraction; observability surfaces the
  // real cause for operators.
  const responses: Record<string, string> = {
    greeting:
      "Hello. I'm Jeffrey. The AI layer is briefly unavailable — please try again in a moment.",
    generate_protocol:
      "Your protocol has been generated. Head to your Dashboard for the stack, dosing, and timing. Ask me to explain anything in it.",
    update_goal:
      "Update your goals in Profile. Once saved, I'll generate a fresh protocol tuned to them.",
    explain_supplement:
      "The AI layer is temporarily unavailable. Please try again in a moment.",
    general_health_question:
      "The AI layer is temporarily unavailable. Please try again in a moment.",
    log_supplement:
      "Logged. Your adherence score will update as you keep logging.",
    check_adherence:
      "Your adherence is tracked. Keep logging each dose as you take it.",
    health_state_check:
      "I've summarised your current state from the latest labs. Add more biomarkers for a higher confidence score.",
  };

  return (
    responses[intentType] ??
    "The AI layer is temporarily unavailable. Please try again in a moment."
  );
}

// ─── Non-health surfaces (investor / onboarding / brand / concierge) ─────
// Exposed for routes/jeffrey.ts. These surfaces do NOT receive health
// context by default — they are the premium Jeffrey in strategy / product /
// brand mode.
//
// Data-isolation rule (see Ron's brand directive):
//   Investor and brand surfaces carry ZERO personal health context, period.
//   Onboarding / concierge / product-walkthrough may opt in to self-context
//   only when the caller has verified the user is authenticated AND is
//   asking about themselves — by passing `selfContext: true`. Default is
//   off. When off, we swap in `noopMemoryAdapter` and drop userId so the
//   session has no path to the healthProfiles table at all.

export interface AskSurfaceArgs {
  surface: JeffreySurface;
  userId?: string;
  message: string;
  extraContext?: string[];
  /**
   * If true AND the surface supports it, the session will be seeded with
   * the user's health profile / long-term memory. Ignored for investor and
   * brand surfaces, which always run clean.
   */
  selfContext?: boolean;
}

const SURFACES_SUPPORTING_SELF_CONTEXT: ReadonlyArray<JeffreySurface> = [
  "onboarding",
  "concierge",
  "product-walkthrough",
];

export async function askSurface(args: AskSurfaceArgs): Promise<string> {
  if (!config.openaiApiKey) {
    return "The AI layer is temporarily unavailable. Please try again in a moment.";
  }

  const allowSelfContext =
    args.selfContext === true &&
    SURFACES_SUPPORTING_SELF_CONTEXT.includes(args.surface);

  const session = await createJeffreySession({
    surface: args.surface,
    userId: allowSelfContext ? args.userId : undefined,
    memoryAdapter: allowSelfContext ? dbMemoryAdapter : noopMemoryAdapter,
    extraContext: args.extraContext,
  });

  const out = await session.ask(args.message);
  return out.reply.text;
}
