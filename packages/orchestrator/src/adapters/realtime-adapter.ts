/**
 * Realtime adapter — bridges the existing useJeffreyRealtime hook into the
 * orchestrator's event stream.
 *
 * Responsibilities:
 *   1. Subscribe to the realtime hook's `state`, `transcript`, and
 *      `isAssistantSpeaking` outputs.
 *   2. Map them onto OrchestrationEvent dispatches:
 *        - state changes → voice.* events
 *        - new partial assistant text → assistant.text_delta + debounced
 *          embedding classify
 *        - new final user text → user.utterance_final + LLM classify
 *        - speech_started while speaking → user.speech_started (which
 *          triggers the barge-in path in reducers — note: audio cancellation
 *          already happens at the audio layer in useJeffreyRealtime)
 *   3. Run the embedding classifier on rolling assistant text + final user
 *      utterances.
 *   4. Schedule a periodic decay tick so module activations fade when not
 *      reinforced.
 *
 * This is an effectful module. It's the only place in @aissisted/orchestrator
 * where we touch React refs, schedule timers, or call fetch.
 */

import type { RealtimeState, TranscriptTurn } from "../web-types.js";
import {
  classifyEmbedding,
  classifyResponseToClassification,
  initAnchorCache,
  type ClassifyFn,
  type EmbedFn,
} from "../classifier/index.js";
import type { OrchestrationEvent } from "../state/types.js";

// ─── Public adapter interface ────────────────────────────────────────────

export interface RealtimeAdapterDeps {
  /** Function that POSTs to apps/api `/v1/jeffrey/embeddings`. */
  embed: EmbedFn;
  /** Function that POSTs to apps/api `/v1/jeffrey/classify`. */
  classifyLlm: ClassifyFn;
  /** Synchronous dispatch into the orchestrator store. */
  dispatch: (event: OrchestrationEvent) => void;
  /**
   * Get the current rolling assistant utterance for the embedding classifier.
   * Pulled from the store so we don't double-track it here.
   */
  getRollingAssistantText: () => string;
}

export interface RealtimeAdapterControls {
  /** Push a new realtime hook state into the adapter. Idempotent. */
  onStateChange: (state: RealtimeState) => void;
  /** Push a new transcript array (whole list, like the hook returns). */
  onTranscript: (turns: TranscriptTurn[]) => void;
  /** Push the assistant-speaking flag. */
  onAssistantSpeaking: (speaking: boolean) => void;
  /** Tear down timers, intervals, in-flight aborts. */
  destroy: () => void;
}

// ─── Tunables ────────────────────────────────────────────────────────────

const STREAMING_CLASSIFY_DEBOUNCE_MS = 150;
const TICK_INTERVAL_MS = 300;
/** Min characters before the embedding classifier bothers to fire. */
const MIN_TEXT_FOR_EMBEDDING = 24;

// ─── Adapter ─────────────────────────────────────────────────────────────

export function createRealtimeAdapter(
  deps: RealtimeAdapterDeps,
): RealtimeAdapterControls {
  let lastState: RealtimeState = "idle";
  let lastTranscript: TranscriptTurn[] = [];
  let lastSpeaking = false;

  // Debounce timer for embedding classifier on rolling assistant text.
  let embedDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Tick interval for confidence decay.
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  // Anchor cache promise — single-flight init.
  let anchorCachePromise: ReturnType<typeof initAnchorCache> | null = null;
  function ensureAnchorCache() {
    if (!anchorCachePromise) {
      anchorCachePromise = initAnchorCache(deps.embed).catch((err) => {
        // If init fails we want to allow retry — null out the promise.
        anchorCachePromise = null;
        throw err;
      });
    }
    return anchorCachePromise;
  }

  /**
   * Run the embedding classifier on the current rolling assistant utterance.
   * Debounced + bounded by min length. Fire-and-forget; failures are silently
   * dropped (the LLM classifier on user-final still gives us accurate signal).
   */
  function scheduleEmbeddingClassify(): void {
    if (embedDebounceTimer) clearTimeout(embedDebounceTimer);
    embedDebounceTimer = setTimeout(async () => {
      embedDebounceTimer = null;
      const text = deps.getRollingAssistantText().trim();
      if (text.length < MIN_TEXT_FOR_EMBEDDING) return;

      try {
        const cache = await ensureAnchorCache();
        const resp = await deps.embed([text]);
        const utteranceEmb = resp.embeddings[0];
        if (!utteranceEmb) return;
        const classification = classifyEmbedding(text, utteranceEmb, cache);
        deps.dispatch({ type: "classification.partial", classification });
      } catch {
        // Network or model error — non-fatal. The decay tick will phase out
        // any stale activations and the next chunk will retry.
      }
    }, STREAMING_CLASSIFY_DEBOUNCE_MS);
  }

  /**
   * Run the LLM classifier on a finalized user utterance. Accurate intent +
   * topic + urgency + requiresDataLookup. Awaited inline because downstream
   * routing wants the result.
   */
  async function classifyUserFinal(text: string): Promise<void> {
    try {
      const resp = await deps.classifyLlm({ text });
      const classification = classifyResponseToClassification(resp, text);
      deps.dispatch({ type: "classification.final", classification });
    } catch {
      // Drop silently — embedding classifier results from streaming user
      // partials (if we add them later) still cover the visualization.
    }
  }

  // ── Hook event handlers ────────────────────────────────────────────────

  function onStateChange(state: RealtimeState): void {
    if (state === lastState) return;
    const prev = lastState;
    lastState = state;

    // Map RealtimeState → OrchestrationEvent.
    switch (state) {
      case "idle":
      case "closed":
        deps.dispatch({ type: "voice.disconnected" });
        return;
      case "requesting-ticket":
      case "connecting":
        deps.dispatch({ type: "voice.connecting" });
        return;
      case "ready":
        // Fresh ready: only emit if we weren't already ready.
        if (prev !== "ready") deps.dispatch({ type: "voice.ready" });
        return;
      case "listening":
        // Distinguish: was assistant speaking? That's a barge-in.
        if (lastSpeaking || prev === "speaking") {
          deps.dispatch({ type: "user.speech_started" });
        } else {
          deps.dispatch({ type: "user.speech_started" });
        }
        return;
      case "speaking":
        deps.dispatch({ type: "assistant.audio_started" });
        return;
      case "closing":
        // No-op — wait for closed.
        return;
      case "error":
        deps.dispatch({ type: "voice.error", error: "realtime error" });
        return;
      default: {
        // Exhaustiveness — TS will flag any new RealtimeState we forget.
        return;
      }
    }
  }

  function onTranscript(turns: TranscriptTurn[]): void {
    // Diff against last snapshot to detect new turns + delta growth.
    const prev = lastTranscript;
    lastTranscript = turns;

    for (const turn of turns) {
      const prevTurn = prev.find((t) => t.id === turn.id);
      if (!prevTurn) {
        // New turn appearing.
        if (turn.role === "assistant") {
          // Streaming assistant text starts.
          deps.dispatch({
            type: "assistant.text_delta",
            text: turn.text,
            turnId: turn.id,
            partial: turn.partial,
          });
          if (turn.text.length >= MIN_TEXT_FOR_EMBEDDING) {
            scheduleEmbeddingClassify();
          }
        } else {
          // User final transcription (we don't get user partials from the
          // OpenAI Realtime input transcription path).
          if (!turn.partial) {
            deps.dispatch({
              type: "user.utterance_final",
              text: turn.text,
              turnId: turn.id,
            });
            void classifyUserFinal(turn.text);
          }
        }
        continue;
      }

      // Existing turn — check for text growth or partial→final flip.
      const grew = turn.text.length > prevTurn.text.length;
      if (grew) {
        const delta = turn.text.slice(prevTurn.text.length);
        if (turn.role === "assistant") {
          deps.dispatch({
            type: "assistant.text_delta",
            text: delta,
            turnId: turn.id,
            partial: turn.partial,
          });
          scheduleEmbeddingClassify();
        }
      }
      if (prevTurn.partial && !turn.partial) {
        // Just finalized.
        if (turn.role === "user") {
          deps.dispatch({
            type: "user.utterance_final",
            text: turn.text,
            turnId: turn.id,
          });
          void classifyUserFinal(turn.text);
        } else {
          deps.dispatch({ type: "assistant.response_done" });
        }
      }
    }
  }

  function onAssistantSpeaking(speaking: boolean): void {
    if (speaking === lastSpeaking) return;
    lastSpeaking = speaking;
    if (speaking) {
      // already covered by state transition to "speaking" — this is a
      // secondary signal in case state transitions lag the audio.
    } else {
      deps.dispatch({ type: "assistant.audio_done" });
    }
  }

  function destroy(): void {
    if (embedDebounceTimer) {
      clearTimeout(embedDebounceTimer);
      embedDebounceTimer = null;
    }
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    anchorCachePromise = null;
    lastTranscript = [];
  }

  // ── Tick scheduler — confidence decay ──────────────────────────────────
  tickInterval = setInterval(() => {
    deps.dispatch({ type: "tick", nowMs: Date.now() });
  }, TICK_INTERVAL_MS);

  return {
    onStateChange,
    onTranscript,
    onAssistantSpeaking,
    destroy,
  };
}
