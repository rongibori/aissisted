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
      contextInjection = `\n\n[PROTOCOL GENERATED]\n${JSON.stringify(protocol?.recommendations?.map((r) => ({ name: r.name, dosage: r.dosage, timing: r.timing })), null, 2)}\n\nSummary: ${protocol?.summary}`;
    } catch {
      contextInjection =
        "\n\n[Note: Protocol generation failed — user may need to add biomarker data first]";
    }
  }

  // 5. Gather user context for Jeffrey
  const [profile, biomarkers, latestProtocol] = await Promise.all([
    getProfile(userId),
    getLatestBiomarkers(userId),
    intent.type !== "generate_protocol"
      ? getLatestProtocol(userId)
      : Promise.resolve(null),
  ]);

  const userContext = buildUserContext(profile, biomarkers, latestProtocol);

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

function buildUserContext(
  profile: Awaited<ReturnType<typeof getProfile>>,
  biomarkers: Awaited<ReturnType<typeof getLatestBiomarkers>>,
  protocol: Awaited<ReturnType<typeof getLatestProtocol>>
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
  };

  return (
    responses[intentType] ??
    "I'm here to help. Please configure your ANTHROPIC_API_KEY for full AI-powered responses."
  );
}
