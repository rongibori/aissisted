import Anthropic from "@anthropic-ai/sdk";
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

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const JEFFREY_SYSTEM = `You are Jeffrey, the AI health concierge for Aissisted. You are warm, clear, and evidence-based.

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

export async function chat(
  userId: string,
  message: string,
  conversationId?: string
): Promise<{
  reply: string;
  conversationId: string;
  intent: string;
  protocolTriggered: boolean;
}> {
  // 1. Get or create conversation
  const conversation = await getOrCreateConversation(userId, conversationId);

  // 2. Parse intent
  const intent = await parseIntent(message);

  // 3. Save user message
  await addMessage(conversation.id, "user", message, intent.type);

  // 4. Handle intent-specific actions
  let protocolTriggered = false;
  let contextInjection = "";

  if (intent.type === "generate_protocol") {
    try {
      const protocol = await generateProtocol(userId);
      protocolTriggered = true;
      contextInjection = `\n\n[PROTOCOL GENERATED]\n${JSON.stringify(protocol?.recommendations?.map((r) => ({ name: r.name, dosage: r.dosage, timing: r.timing, timeSlot: r.timeSlot })), null, 2)}\n\nSummary: ${protocol?.summary}`;
    } catch {
      contextInjection =
        "\n\n[Note: Protocol generation failed — user may need to add biomarker data first]";
    }
  }

  if (intent.type === "log_supplement") {
    // Extract supplement name from entities or raw message
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

  // 5. Gather user context for Jeffrey
  const [profile, biomarkers, latestProtocol, healthState] = await Promise.all([
    getProfile(userId),
    getLatestBiomarkers(userId),
    intent.type !== "generate_protocol"
      ? getLatestProtocol(userId)
      : Promise.resolve(null),
    intent.type === "health_state_check" || intent.type === "generate_protocol"
      ? getLatestHealthState(userId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const userContext = buildUserContext(profile, biomarkers, latestProtocol, healthState);

  // 6. Get conversation history for multi-turn context
  const history = await getConversationHistory(conversation.id, 12);

  // 7. Build message array for Claude
  const claudeMessages: Anthropic.MessageParam[] = history
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Inject protocol results into the last user message if triggered
  if (protocolTriggered && claudeMessages.length > 0) {
    const last = claudeMessages[claudeMessages.length - 1];
    if (last.role === "user") {
      claudeMessages[claudeMessages.length - 1] = {
        role: "user",
        content: last.content + contextInjection,
      };
    }
  }

  // 8. Call Claude
  let reply = "";

  if (config.anthropicApiKey) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: [
          {
            type: "text",
            text: JEFFREY_SYSTEM,
            cache_control: { type: "ephemeral" },
          },
          {
            type: "text",
            text: "\n\nUser context:\n" + userContext,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: claudeMessages,
      });
      reply =
        response.content[0].type === "text"
          ? response.content[0].text
          : "I couldn't process that — please try again.";
    } catch (err) {
      reply = buildFallbackReply(intent.type, message);
    }
  } else {
    reply = buildFallbackReply(intent.type, message);
  }

  // 9. Save assistant reply
  await addMessage(conversation.id, "assistant", reply, undefined, {
    protocolTriggered,
    intentType: intent.type,
  });

  return {
    reply,
    conversationId: conversation.id,
    intent: intent.type,
    protocolTriggered,
  };
}

function extractSupplementFromMessage(message: string): string | undefined {
  // Crude extraction: grab the noun after "took", "taking", "skipped" etc.
  const match = message.match(
    /(?:took|taking|skipped|missed|my)\s+([\w\s-]+?)(?:\s+today|\s+this|\s+just|\.|\,|$)/i
  );
  return match?.[1]?.trim();
}

function buildUserContext(
  profile: Awaited<ReturnType<typeof getProfile>>,
  biomarkers: Awaited<ReturnType<typeof getLatestBiomarkers>>,
  protocol: Awaited<ReturnType<typeof getLatestProtocol>>,
  healthState: Awaited<ReturnType<typeof getLatestHealthState>> | null
): string {
  const parts: string[] = [];

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
      .slice(0, 12)
      .map((b) => {
        const { status } = getRangeStatus(b.name, b.value);
        const statusNote =
          status !== "unknown" && status !== "normal"
            ? ` [${status.toUpperCase()}]`
            : "";
        const trendNote =
          b.trend && b.trend !== "new" && b.trend !== "stable"
            ? ` ${b.trend === "up" ? "↑" : "↓"}`
            : "";
        return `${b.name}: ${b.value} ${b.unit}${statusNote}${trendNote}`;
      })
      .join("\n  ");
    parts.push(`Recent biomarkers:\n  ${bList}`);
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
      `Health state: mode=${healthState.mode}, confidence=${Math.round(healthState.confidenceScore * 100)}%${domainHighlights ? `, elevated domains: ${domainHighlights}` : ""}`
    );
    const criticalSignals = healthState.activeSignals
      .filter((s) => s.severity === "critical" || s.severity === "warn")
      .slice(0, 3)
      .map((s) => s.explanation);
    if (criticalSignals.length > 0) {
      parts.push(`Active health signals: ${criticalSignals.join("; ")}`);
    }
    if (healthState.warnings.length > 0) {
      parts.push(`Clinical warnings: ${healthState.warnings.slice(0, 2).join("; ")}`);
    }
  }

  return parts.join("\n") || "No health data available yet.";
}

function buildFallbackReply(intentType: string, message: string): string {
  const responses: Record<string, string> = {
    greeting:
      "Hi! I'm Jeffrey, your Aissisted health concierge. I can help you understand your biomarkers, build a personalized supplement protocol, and answer health questions. What would you like to explore today?",
    generate_protocol:
      "I've run your protocol analysis. Head to your Dashboard to see the full stack with dosing and timing. Want me to explain any of the recommendations?",
    update_goal:
      "Got it. To update your goals, head to your Profile and add them there. Once saved, I can generate a new protocol tailored to your updated objectives.",
    explain_supplement:
      "I'd be happy to explain that supplement. Please add your ANTHROPIC_API_KEY to enable full AI responses, and I'll give you the complete breakdown.",
    general_health_question:
      "That's a great question. To get full AI-powered responses from Jeffrey, please configure your ANTHROPIC_API_KEY in the environment.",
    log_supplement:
      "Got it — I've recorded that supplement log. Keep it up! Your adherence score updates as you log.",
    check_adherence:
      "I've pulled your recent adherence data. Log each supplement as you take it and I'll track your consistency over time.",
    health_state_check:
      "I've summarized your current health state based on your latest lab data. Add more biomarkers for a higher confidence score.",
  };

  return (
    responses[intentType] ??
    "I'm here to help. Please configure your ANTHROPIC_API_KEY for full AI-powered responses."
  );
}
