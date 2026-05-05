/**
 * Public classifier surface.
 *
 * Two layers:
 *
 *  1. Embedding classifier: cosine similarity against cached module concept
 *     anchors. Browser-side, fast, debounced ~150ms during streaming text.
 *
 *  2. LLM classifier: structured intent extraction via apps/api proxy →
 *     gpt-4o-mini. Server-side, accurate, runs ONCE on each finalized user
 *     utterance.
 *
 * Both produce the same `Classification` shape. The reducer merges via
 * max-per-module so neither tier's noise can suppress the other's signal.
 */

// Concepts + anchors
export { MODULE_CONCEPTS, flattenAnchors, TOTAL_ANCHORS } from "./module-concepts.js";
export type { ModuleConcept, FlatAnchor } from "./module-concepts.js";

// Topic + intent enums
export { INTENTS, URGENCY_LEVELS, type Urgency } from "./topics.js";
export { type Intent, type ModuleId, MODULE_IDS } from "./topics.js";

// Embedding classifier
export {
  initAnchorCache,
  clearAnchorCache,
  cosine,
  classifyEmbedding,
  type Embedding,
  type CachedAnchor,
  type EmbedRequest,
  type EmbedResponse,
  type EmbedFn,
  type ClassifyOptions,
} from "./embedding-classifier.js";

// LLM classifier
export {
  classifyResponseToClassification,
  type ClassifyRequest,
  type ClassifyResponse,
  type ClassifyFn,
} from "./llm-classifier.js";
