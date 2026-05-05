/**
 * Pure reducers — (state, event) → newState.
 *
 * No I/O, no side effects, no async. Every transition is deterministic and
 * testable in isolation. The store wires these to events from adapters; the
 * adapters do all the impure work (subscribing, fetching, scheduling).
 */

import {
  MODULE_IDS,
  type ModuleId,
  type OrchestrationEvent,
  type OrchestrationState,
  type SystemMode,
} from "./types";

// ─── Decay parameters ────────────────────────────────────────────────────

/** Topic confidence decays toward zero when a module is not reinforced. */
const DECAY_PER_SECOND = 0.18; // ~5s half-life
const ACTIVATION_THRESHOLD = 0.42; // module is "active" above this confidence

// ─── Initial state ───────────────────────────────────────────────────────

export const INITIAL_STATE: OrchestrationState = {
  mode: "idle",
  voiceConnection: "disconnected",
  isAssistantSpeaking: false,

  activeModules: new Set(),
  primaryFocus: null,
  topicConfidence: emptyConfidenceMap(),

  narrative: {
    current: null,
    interruptionStack: [],
    enteredAt: 0,
  },

  userData: null,
  moduleData: {},

  lastClassification: null,
  lastUserUtterance: "",
  lastAssistantUtterance: "",
};

function emptyConfidenceMap(): Record<ModuleId, number> {
  // Start every module at zero. Strict typing: every key present.
  const out = {} as Record<ModuleId, number>;
  for (const m of MODULE_IDS) out[m] = 0;
  return out;
}

// ─── Reducer ─────────────────────────────────────────────────────────────

export function reduce(
  state: OrchestrationState,
  event: OrchestrationEvent,
): OrchestrationState {
  switch (event.type) {
    // ── Voice connection ───────────────────────────────────────────────
    case "voice.connecting":
      return { ...state, voiceConnection: "connecting" };

    case "voice.ready":
      return { ...state, voiceConnection: "ready", mode: "idle" };

    case "voice.disconnected":
      return {
        ...state,
        voiceConnection: "disconnected",
        mode: "idle",
        isAssistantSpeaking: false,
      };

    case "voice.error":
      return { ...state, voiceConnection: "error" };

    // ── Turn-taking ────────────────────────────────────────────────────
    case "user.speech_started":
      // Barge-in: if assistant is speaking, this is an interruption. Push
      // the current narrative node so we can resume later.
      if (state.isAssistantSpeaking || state.mode === "speaking") {
        const next: OrchestrationState = {
          ...state,
          mode: "listening",
          isAssistantSpeaking: false,
          narrative: state.narrative.current
            ? {
                ...state.narrative,
                interruptionStack: [
                  ...state.narrative.interruptionStack,
                  state.narrative.current,
                ],
              }
            : state.narrative,
        };
        return next;
      }
      return { ...state, mode: "listening" };

    case "user.speech_stopped":
      // Server VAD will commit and a response will follow.
      return { ...state, mode: "thinking" };

    case "user.utterance_final":
      return { ...state, lastUserUtterance: event.text };

    case "assistant.audio_started":
      return { ...state, mode: "speaking", isAssistantSpeaking: true };

    case "assistant.text_delta":
      // Capture for downstream classifier; partial deltas don't change mode.
      return {
        ...state,
        lastAssistantUtterance: event.partial
          ? state.lastAssistantUtterance + event.text
          : event.text,
      };

    case "assistant.audio_done":
      return {
        ...state,
        isAssistantSpeaking: false,
        // Mode transitions to listening or idle on response_done.
      };

    case "assistant.response_done":
      // After response complete: if there's an interruption to recover from,
      // emit a separate narrative.resume event from the orchestrator policy
      // layer. The reducer just clears the assistant-speaking flag and
      // settles the mode.
      return {
        ...state,
        mode: state.voiceConnection === "ready" ? "idle" : state.mode,
        isAssistantSpeaking: false,
        // Reset the rolling assistant utterance buffer for the next turn.
        lastAssistantUtterance: "",
      };

    // ── Classification ─────────────────────────────────────────────────
    case "classification.partial":
    case "classification.final": {
      // Merge new topic confidences with existing (decay-aware) values.
      // Take the MAX between the existing confidence and the new one — so a
      // strong embedding signal can't be erased by a weak streaming chunk.
      const merged = { ...state.topicConfidence };
      for (const m of MODULE_IDS) {
        const incoming = event.classification.topicConfidence[m] ?? 0;
        if (incoming > merged[m]) merged[m] = incoming;
      }
      const { activeModules, primaryFocus } = deriveActivation(merged);

      return {
        ...state,
        topicConfidence: merged,
        activeModules,
        primaryFocus,
        lastClassification: event.classification,
      };
    }

    // ── Decay tick ─────────────────────────────────────────────────────
    case "tick": {
      // Decay every module's confidence by DECAY_PER_SECOND * dt. We don't
      // know dt from the event itself — caller is expected to call tick at
      // ~250-500ms cadence. Approximate: subtract a fixed slice per tick.
      const slice = DECAY_PER_SECOND * 0.3; // assume ~300ms per tick
      const decayed = { ...state.topicConfidence };
      let changed = false;
      for (const m of MODULE_IDS) {
        const v = decayed[m];
        if (v > 0) {
          decayed[m] = Math.max(0, v - slice);
          if (decayed[m] !== v) changed = true;
        }
      }
      if (!changed) return state;
      const { activeModules, primaryFocus } = deriveActivation(decayed);
      return {
        ...state,
        topicConfidence: decayed,
        activeModules,
        primaryFocus,
      };
    }

    // ── Narrative ──────────────────────────────────────────────────────
    case "narrative.set":
      return {
        ...state,
        narrative: {
          ...state.narrative,
          current: event.node,
          enteredAt: Date.now(),
        },
      };

    case "narrative.advance": {
      // We don't have the full tree here — caller should resolve toNodeId
      // and emit narrative.set instead. Keeping this case as a placeholder
      // so the union is exhaustive; reducer treats it as a no-op.
      return state;
    }

    case "narrative.interrupt":
      if (!state.narrative.current) return state;
      return {
        ...state,
        narrative: {
          ...state.narrative,
          interruptionStack: [
            ...state.narrative.interruptionStack,
            state.narrative.current,
          ],
        },
      };

    case "narrative.resume": {
      const stack = state.narrative.interruptionStack;
      if (stack.length === 0) return state;
      const restored = stack[stack.length - 1];
      if (!restored) return state;
      return {
        ...state,
        narrative: {
          current: restored,
          interruptionStack: stack.slice(0, -1),
          enteredAt: Date.now(),
        },
      };
    }

    case "narrative.discard_interruption":
      return {
        ...state,
        narrative: { ...state.narrative, interruptionStack: [] },
      };

    // ── User data binding ──────────────────────────────────────────────
    case "user.snapshot_loaded":
      return { ...state, userData: event.snapshot };

    case "module.data_updated":
      return {
        ...state,
        moduleData: { ...state.moduleData, [event.moduleId]: event.data },
      };

    default: {
      // Exhaustiveness: the never-cast forces TS to flag any unhandled event.
      const _exhaustive: never = event;
      return state;
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Given the current confidence map, derive which modules are "active" and
 * which is the primary focus. A module is active when confidence >= threshold.
 * Primary focus is the highest-confidence active module, or null.
 */
function deriveActivation(confidence: Record<ModuleId, number>): {
  activeModules: Set<ModuleId>;
  primaryFocus: ModuleId | null;
} {
  const active = new Set<ModuleId>();
  let topModule: ModuleId | null = null;
  let topConfidence = 0;
  for (const m of MODULE_IDS) {
    const v = confidence[m];
    if (v >= ACTIVATION_THRESHOLD) active.add(m);
    if (v > topConfidence) {
      topConfidence = v;
      topModule = m;
    }
  }
  return {
    activeModules: active,
    primaryFocus: topConfidence >= ACTIVATION_THRESHOLD ? topModule : null,
  };
}

// ─── Tunables (re-exported for tests + adapter scheduling) ───────────────

export const TUNABLES = {
  DECAY_PER_SECOND,
  ACTIVATION_THRESHOLD,
} as const;
