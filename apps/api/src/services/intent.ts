/**
 * Intent parser — classifies the incoming chat message into a known intent
 * so the rest of jeffrey.service can route to the right data path.
 *
 * Canonical brain: OpenAI (matches @aissisted/jeffrey). We use a small,
 * cheap model here (gpt-4o-mini) because intent classification is a
 * high-frequency, low-reasoning call — the full gpt-4o brain is used
 * downstream for the actual reply.
 *
 * Degradation:
 *   - no OPENAI_API_KEY               → classifyLocally (regex heuristics)
 *   - OpenAI error / malformed JSON   → classifyLocally (same heuristics)
 *
 * The local classifier is intentionally generous so the product remains
 * useful even if the upstream provider is unhealthy.
 */

import { getOpenAIClient } from "@aissisted/jeffrey";
import { config } from "../config.js";

export type IntentType =
  | "generate_protocol"
  | "update_goal"
  | "explain_supplement"
  | "ask_biomarker"
  | "general_health_question"
  | "greeting"
  | "log_supplement"       // "I just took my vitamin D"
  | "check_adherence"      // "How am I doing with my supplements?"
  | "health_state_check"   // "What's my health status?" / "How am I doing overall?"
  | "unknown";

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
}

// Small/fast model — intent classification does not need the flagship brain.
// Kept in-file rather than env because swapping this is a code-review decision,
// not an operator decision.
const INTENT_MODEL = "gpt-4o-mini";

const INTENT_SYSTEM = `You are an intent parser for Aissisted, a personalized health platform.
Classify the user message into one of these intent types:
- generate_protocol: user wants to generate or update their supplement protocol
- update_goal: user wants to add or change a health goal
- explain_supplement: user is asking about a specific supplement
- ask_biomarker: user is asking about a specific biomarker or lab value
- general_health_question: general health or wellness question
- greeting: hi, hello, hey
- log_supplement: user is reporting they took (or skipped) a supplement (e.g. "I just took my D3", "took omega-3", "skipped my magnesium")
- check_adherence: user is asking about their supplement adherence or consistency (e.g. "how am I doing?", "am I being consistent?")
- health_state_check: user wants an overview of their current health status or risk profile (e.g. "what's my health state?", "how am I doing overall?", "any concerns?")
- unknown: cannot be classified

Extract relevant entities (supplement name, biomarker name, goal text, dosage, skipped: true/false, etc).

Respond ONLY with JSON: { "type": "...", "confidence": 0.0-1.0, "entities": {} }`;

const VALID_INTENTS: ReadonlySet<IntentType> = new Set<IntentType>([
  "generate_protocol",
  "update_goal",
  "explain_supplement",
  "ask_biomarker",
  "general_health_question",
  "greeting",
  "log_supplement",
  "check_adherence",
  "health_state_check",
  "unknown",
]);

export async function parseIntent(message: string): Promise<ParsedIntent> {
  if (!config.openaiApiKey) {
    return classifyLocally(message);
  }

  try {
    const openai = getOpenAIClient({
      OPENAI_API_KEY: config.openaiApiKey,
      // The rest are irrelevant to a chat.completions call; satisfy the type.
      OPENAI_JEFFREY_MODEL: "gpt-4o",
      OPENAI_JEFFREY_REALTIME_MODEL: "gpt-4o-realtime-preview",
      ELEVENLABS_MODEL: "eleven_flash_v2_5",
      JEFFREY_DEFAULT_TEMPERATURE: 0.4,
      JEFFREY_DEFAULT_MAX_TOKENS: 800,
    });

    const completion = await openai.chat.completions.create({
      model: INTENT_MODEL,
      max_tokens: 256,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INTENT_SYSTEM },
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<ParsedIntent>;

    const type = (parsed.type && VALID_INTENTS.has(parsed.type))
      ? parsed.type
      : "unknown";
    const confidence = typeof parsed.confidence === "number"
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;
    const entities = (parsed.entities && typeof parsed.entities === "object")
      ? parsed.entities
      : {};

    return { type, confidence, entities };
  } catch {
    return classifyLocally(message);
  }
}

function classifyLocally(message: string): ParsedIntent {
  const lower = message.toLowerCase();

  if (/^(hi|hello|hey|howdy|greetings)/i.test(lower)) {
    return { type: "greeting", confidence: 0.95, entities: {} };
  }
  if (/(generate|create|build|make|run|update).*(protocol|stack|supplement)/i.test(lower)) {
    return { type: "generate_protocol", confidence: 0.85, entities: {} };
  }
  if (/(add|change|update|set).*(goal|target|objective)/i.test(lower)) {
    return { type: "update_goal", confidence: 0.8, entities: {} };
  }
  if (/(what is|tell me about|explain|why|how does).*(mg|mcg|supplement|vitamin|mineral|herb)/i.test(lower)) {
    return { type: "explain_supplement", confidence: 0.75, entities: {} };
  }
  if (/(b12|crp|ferritin|testosterone|vitamin d|cortisol|hrv|hdl|ldl|glucose|a1c|tsh)/i.test(lower)) {
    return { type: "ask_biomarker", confidence: 0.8, entities: {} };
  }
  if (/(just took|i took|taking|took my|skipped|missed).*(supplement|vitamin|mineral|omega|mg|mcg|capsule|pill)/i.test(lower)) {
    return { type: "log_supplement", confidence: 0.8, entities: {} };
  }
  if (/(adherence|consistent|keeping up|how am i doing|on track).*(supplement|protocol|stack)/i.test(lower)) {
    return { type: "check_adherence", confidence: 0.8, entities: {} };
  }
  if (/(health state|overall health|how am i doing|my health|any concerns|health status|risk|health score)/i.test(lower)) {
    return { type: "health_state_check", confidence: 0.8, entities: {} };
  }

  return { type: "general_health_question", confidence: 0.5, entities: {} };
}
