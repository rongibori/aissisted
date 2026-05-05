/**
 * Public classifier surface.
 *
 * Two layers:
 *
 *  1. Embedding classifier (this turn): cosine similarity against cached
 *     module concept anchors. Browser-side, fast, debounced.
 *
 *  2. LLM classifier (next turn): structured intent extraction via apps/api
 *     proxy → gpt-4o-mini. Server-side, accurate, run on final utterances.
 */

export { MODULE_CONCEPTS, flattenAnchors, TOTAL_ANCHORS } from "./module-concepts.js";
export type { ModuleConcept, FlatAnchor } from "./module-concepts.js";

export { INTENTS, URGENCY_LEVELS, type Urgency } from "./topics.js";
export { type Intent, type ModuleId, MODULE_IDS } from "./topics.js";
