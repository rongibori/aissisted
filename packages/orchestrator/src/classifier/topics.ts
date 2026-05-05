/**
 * Intent + topic enums for the classifier layer.
 *
 * Topics are the 7 canonical modules from JeffreyAISystem/systemTypes.ts.
 * Intents are coarse-grained categories used by the LLM classifier on final
 * utterances to route Jeffrey's response strategy.
 *
 * Re-exported from state/types.ts so callers can import either path.
 */

export { type Intent } from "../state/types";
export { MODULE_IDS, type ModuleId } from "../state/types";

/**
 * The full set of intents the LLM classifier may emit. Kept as a const array
 * so we can ship it to the model as a JSON Schema enum + use it for Zod-style
 * validation client-side without pulling in Zod.
 */
export const INTENTS = [
  "question_about_data",
  "question_about_methodology",
  "question_about_trust",
  "objection",
  "request_for_change",
  "meta_navigation",
  "narrative_continue",
  "unknown",
] as const;

export const URGENCY_LEVELS = ["low", "normal", "high"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];
