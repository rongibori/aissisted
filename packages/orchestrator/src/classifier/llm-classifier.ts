/**
 * LLM classifier — accurate intent + topic extraction for FINAL utterances.
 *
 * Calls apps/api `/v1/jeffrey/classify` which proxies to gpt-4o-mini with a
 * structured-output JSON schema. API keys never reach the browser.
 *
 * Cadence:
 *   - Embedding classifier: every ~150ms during streaming partial transcript
 *     (drives fast visual reactivity)
 *   - LLM classifier: ONCE on each finalized user utterance (drives accurate
 *     routing — what data to pull, which narrative branch to take, what
 *     intent to respond to)
 *
 * The two classifiers' outputs both flow into the same `Classification` shape
 * and merge in the reducer via max-per-module — so a strong embedding signal
 * isn't erased by a weak LLM tag, and vice versa.
 */

import type {
  Classification,
  Intent,
  ModuleId,
} from "../state/types.js";
import type { Urgency } from "./topics.js";

// ─── Wire types ──────────────────────────────────────────────────────────

export interface ClassifyRequest {
  /** The finalized user utterance to classify. */
  text: string;
  /** Optional context window: last N exchanges for disambiguation. */
  context?: { role: "user" | "assistant"; text: string }[];
  /**
   * Optional narrative hint — current node's topic. Helps the model
   * disambiguate ("how about that?" → which "that").
   */
  narrativeHint?: string;
}

export interface ClassifyResponse {
  intent: Intent;
  /** Module IDs the utterance is about, in confidence order. */
  topics: ModuleId[];
  /** 0..1 confidence per topic. */
  topicConfidence: Partial<Record<ModuleId, number>>;
  urgency: Urgency;
  /**
   * True if the response will need a data lookup (e.g. "what's my recovery
   * this week?"). Caller can pre-warm the data fetch in parallel with the
   * classification.
   */
  requiresDataLookup: boolean;
  /** Echo for debugging. */
  model: string;
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface ClassifyFn {
  (req: ClassifyRequest): Promise<ClassifyResponse>;
}

/**
 * Wrap a raw `ClassifyResponse` from apps/api into a `Classification` event
 * payload that the reducer accepts. Pure transform.
 */
export function classifyResponseToClassification(
  resp: ClassifyResponse,
  rawText: string,
): Classification {
  return {
    intent: resp.intent,
    topics: resp.topics,
    topicConfidence: resp.topicConfidence,
    urgency: resp.urgency,
    requiresDataLookup: resp.requiresDataLookup,
    rawText,
    source: "llm",
    classifiedAt: Date.now(),
  };
}
