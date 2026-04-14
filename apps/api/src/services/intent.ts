import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";

export type IntentType =
  | "generate_protocol"
  | "update_goal"
  | "explain_supplement"
  | "ask_biomarker"
  | "general_health_question"
  | "greeting"
  | "unknown";

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
}

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const INTENT_SYSTEM = `You are an intent parser for Aissisted, a personalized health platform.
Classify the user message into one of these intent types:
- generate_protocol: user wants to generate or update their supplement protocol
- update_goal: user wants to add or change a health goal
- explain_supplement: user is asking about a specific supplement
- ask_biomarker: user is asking about a specific biomarker or lab value
- general_health_question: general health or wellness question
- greeting: hi, hello, hey
- unknown: cannot be classified

Extract relevant entities (supplement name, biomarker name, goal text, etc).

Respond ONLY with JSON: { "type": "...", "confidence": 0.0-1.0, "entities": {} }`;

export async function parseIntent(message: string): Promise<ParsedIntent> {
  if (!config.anthropicApiKey) {
    return classifyLocally(message);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: INTENT_SYSTEM,
      messages: [{ role: "user", content: message }],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
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

  return { type: "general_health_question", confidence: 0.5, entities: {} };
}
