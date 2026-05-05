/**
 * Embedding classifier — fast semantic topic detection for streaming text.
 *
 * Architecture:
 *
 *   1. At session init, embed all module concept anchors via the apps/api
 *      proxy → text-embedding-3-small. Cache in memory (and optionally
 *      sessionStorage for cross-tab / reload reuse).
 *   2. On each streaming text chunk (debounced ~150ms), call /embeddings on
 *      apps/api with the current rolling utterance.
 *   3. Cosine similarity vs every anchor; group by module; take max per
 *      module → produce per-module confidence in [0..1].
 *   4. Emit Classification event for the store reducer to merge.
 *
 * Why max-per-module instead of mean: we want a single strong anchor match
 * to fire its module without being diluted by the other 4 anchors that may
 * be only loosely related to the current utterance. The reducer also
 * applies a max-merge so transient false positives can't suppress real
 * signal.
 *
 * Performance budget:
 *   - Anchor embeddings: 35 anchors × 1 batch → one ~200ms API call at init.
 *   - Per-utterance: 1 embedding call ~80-200ms + ~5ms cosine.
 *   - With 150ms debounce: max ~6 calls/sec during continuous Jeffrey speech.
 */

import {
  flattenAnchors,
  MODULE_CONCEPTS,
  type FlatAnchor,
} from "./module-concepts.js";
import {
  MODULE_IDS,
  type Classification,
  type ModuleId,
} from "../state/types.js";

// ─── Types ───────────────────────────────────────────────────────────────

/** Embedding vector. Always 1536 dims for text-embedding-3-small. */
export type Embedding = number[];

/** A single anchor + its embedding, ready for similarity comparison. */
export interface CachedAnchor extends FlatAnchor {
  embedding: Embedding;
}

/**
 * Wire-format request to the apps/api embedding proxy. Server takes care of
 * OPENAI_API_KEY + model selection + retry.
 */
export interface EmbedRequest {
  texts: string[];
}

export interface EmbedResponse {
  embeddings: Embedding[];
  /** Echoed back so we can sanity-check ordering. */
  count: number;
  model: string;
}

// ─── Anchor cache ────────────────────────────────────────────────────────

const SESSION_STORAGE_KEY = "aissisted.orchestrator.anchors.v1";

interface AnchorCache {
  /** All anchors with their embeddings, in flattenAnchors() order. */
  anchors: CachedAnchor[];
  /** Quick lookup: moduleId → indices into anchors[]. */
  byModule: Record<ModuleId, number[]>;
  /** Embedding model that produced these. Mismatched models invalidate cache. */
  model: string;
  /** Wall-clock ms when cache was populated. */
  builtAt: number;
}

let memoryCache: AnchorCache | null = null;

/**
 * Try to restore the anchor cache from sessionStorage. Cheap for hot reloads
 * and across-tab navigation within a single session.
 */
function restoreFromSessionStorage(): AnchorCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnchorCache;
    if (
      parsed.model !== "text-embedding-3-small" ||
      !Array.isArray(parsed.anchors) ||
      parsed.anchors.length === 0
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistToSessionStorage(cache: AnchorCache): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage may be full or disabled; non-fatal.
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

export interface EmbedFn {
  (texts: string[]): Promise<EmbedResponse>;
}

/**
 * Build (or restore) the anchor cache. Call once at session init.
 *
 * Pass an `embed` function that calls your apps/api endpoint — keeping the
 * fetch detail outside this package lets us test in isolation and lets the
 * caller wire auth/headers/retry.
 */
export async function initAnchorCache(embed: EmbedFn): Promise<AnchorCache> {
  // 1. Try memory.
  if (memoryCache) return memoryCache;

  // 2. Try sessionStorage (survives reloads, not new tabs without bfcache).
  const restored = restoreFromSessionStorage();
  if (restored) {
    memoryCache = restored;
    return restored;
  }

  // 3. Build fresh from the canonical anchors.
  const flat = flattenAnchors();
  const texts = flat.map((a) => a.text);
  const resp = await embed(texts);

  if (resp.embeddings.length !== flat.length) {
    throw new Error(
      `Anchor embedding count mismatch: got ${resp.embeddings.length}, expected ${flat.length}`,
    );
  }

  const anchors: CachedAnchor[] = flat.map((a, i) => {
    const embedding = resp.embeddings[i];
    if (!embedding) {
      throw new Error(`Missing embedding at index ${i}`);
    }
    return { ...a, embedding };
  });

  const byModule = {} as Record<ModuleId, number[]>;
  for (const id of MODULE_IDS) byModule[id] = [];
  anchors.forEach((a, i) => {
    byModule[a.moduleId].push(i);
  });

  const cache: AnchorCache = {
    anchors,
    byModule,
    model: resp.model,
    builtAt: Date.now(),
  };

  memoryCache = cache;
  persistToSessionStorage(cache);
  return cache;
}

/** Drop the in-memory + persisted cache. Used by tests + on model upgrade. */
export function clearAnchorCache(): void {
  memoryCache = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}

// ─── Cosine similarity ───────────────────────────────────────────────────

/**
 * Cosine similarity between two equal-length vectors. Returns a value in
 * [-1, 1]; for normalized embeddings (which OpenAI returns), this collapses
 * to a dot product. We compute the full version anyway because non-OpenAI
 * embedders may not normalize.
 */
export function cosine(a: Embedding, b: Embedding): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

// ─── Streaming classifier ────────────────────────────────────────────────

export interface ClassifyOptions {
  /** Apply a per-module weight when reducing similarities. */
  applyConceptWeight?: boolean;
  /**
   * Floor — module similarities below this get zeroed before normalization.
   * Default 0.18. Lower = more sensitive (modules light up sooner). Higher
   * = stricter (only on-topic phrases trigger).
   */
  similarityFloor?: number;
  /**
   * Compress raw cosine into [0, 1] confidence. We map similarities from
   * [floor, ceil] linearly, then clip. Default ceil 0.62 — a tuned upper
   * bound where text-embedding-3-small semantics typically saturate.
   */
  similarityCeil?: number;
}

const DEFAULT_OPTS: Required<ClassifyOptions> = {
  applyConceptWeight: true,
  similarityFloor: 0.18,
  similarityCeil: 0.62,
};

/**
 * Compute per-module confidence for one utterance, given:
 *   - The utterance embedding (caller fetches via /embeddings).
 *   - The cached anchor cache.
 *
 * Returns a Classification ready to dispatch through the store. Mark the
 * source as "embedding" so reducers know it's a fast/partial signal.
 */
export function classifyEmbedding(
  utterance: string,
  utteranceEmbedding: Embedding,
  cache: AnchorCache,
  opts: ClassifyOptions = {},
): Classification {
  const { applyConceptWeight, similarityFloor, similarityCeil } = {
    ...DEFAULT_OPTS,
    ...opts,
  };

  // For each module, take the MAX cosine similarity across its anchors.
  const rawByModule = {} as Record<ModuleId, number>;
  for (const moduleId of MODULE_IDS) {
    const indices = cache.byModule[moduleId] ?? [];
    let best = 0;
    for (const idx of indices) {
      const anchor = cache.anchors[idx];
      if (!anchor) continue;
      const sim = cosine(utteranceEmbedding, anchor.embedding);
      if (sim > best) best = sim;
    }
    if (applyConceptWeight) {
      const weight = MODULE_CONCEPTS[moduleId].weight ?? 1.0;
      best *= weight;
    }
    rawByModule[moduleId] = best;
  }

  // Floor + linear remap to [0, 1] confidence.
  const range = Math.max(1e-6, similarityCeil - similarityFloor);
  const confidence = {} as Partial<Record<ModuleId, number>>;
  const topics: ModuleId[] = [];
  for (const moduleId of MODULE_IDS) {
    const raw = rawByModule[moduleId];
    if (raw < similarityFloor) {
      // Zero out weak matches; they won't contribute to the classification.
      continue;
    }
    const c = Math.max(0, Math.min(1, (raw - similarityFloor) / range));
    confidence[moduleId] = c;
    topics.push(moduleId);
  }

  // Sort topics by descending confidence so caller can take topK if desired.
  topics.sort(
    (a, b) => (confidence[b] ?? 0) - (confidence[a] ?? 0),
  );

  return {
    intent: "unknown", // Embedding tier doesn't infer intent — that's the LLM tier's job.
    topics,
    topicConfidence: confidence,
    urgency: "normal",
    requiresDataLookup: false,
    rawText: utterance,
    source: "embedding",
    classifiedAt: Date.now(),
  };
}
