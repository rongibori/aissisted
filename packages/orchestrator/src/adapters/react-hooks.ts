/**
 * React hooks — UI components subscribe to scoped slices of orchestrator
 * state. Re-renders are scoped per slice so a `mode` change doesn't re-render
 * a component that only cares about `activeModules`.
 */

import { useShallow } from "zustand/react/shallow";
import { useOrchestratorStore } from "../state/store.js";
import type {
  ModuleId,
  SystemMode,
  VoiceConnectionState,
  Classification,
  NarrativeNode,
} from "../state/types.js";

// ─── Atomic slices (most components want these) ──────────────────────────

export function useOrchestratorMode(): SystemMode {
  return useOrchestratorStore((s) => s.mode);
}

export function useVoiceConnection(): VoiceConnectionState {
  return useOrchestratorStore((s) => s.voiceConnection);
}

export function useIsAssistantSpeaking(): boolean {
  return useOrchestratorStore((s) => s.isAssistantSpeaking);
}

export function usePrimaryFocus(): ModuleId | null {
  return useOrchestratorStore((s) => s.primaryFocus);
}

// ─── Set / map slices (use shallow so re-renders are content-aware) ──────

/**
 * Returns the set of currently active modules. Wrapped in shallow equality
 * so consumers don't re-render on every Set identity change.
 */
export function useActiveModules(): ModuleId[] {
  return useOrchestratorStore(
    useShallow((s) => Array.from(s.activeModules).sort()),
  );
}

/**
 * 0..1 confidence per module. Use sparingly — re-renders on every classify
 * tick. Prefer useActiveModules + useTopicConfidence(moduleId) selectors.
 */
export function useAllTopicConfidence(): Record<ModuleId, number> {
  return useOrchestratorStore(useShallow((s) => s.topicConfidence));
}

/**
 * 0..1 confidence for a single module. Re-renders only when this module's
 * confidence crosses a render-relevant threshold (we round to 2 decimals).
 */
export function useTopicConfidence(moduleId: ModuleId): number {
  return useOrchestratorStore(
    (s) => Math.round((s.topicConfidence[moduleId] ?? 0) * 100) / 100,
  );
}

// ─── Narrative ───────────────────────────────────────────────────────────

export function useCurrentNarrativeNode(): NarrativeNode | null {
  return useOrchestratorStore((s) => s.narrative.current);
}

export function useInterruptionStackDepth(): number {
  return useOrchestratorStore((s) => s.narrative.interruptionStack.length);
}

/**
 * True when there's an interruption that could be resumed. Useful for
 * surfacing a "Coming back to where we were —" indicator.
 */
export function useIsInterrupted(): boolean {
  return useOrchestratorStore(
    (s) => s.narrative.interruptionStack.length > 0,
  );
}

// ─── Debug observability ─────────────────────────────────────────────────

export function useLastClassification(): Classification | null {
  return useOrchestratorStore((s) => s.lastClassification);
}

export function useLastUserUtterance(): string {
  return useOrchestratorStore((s) => s.lastUserUtterance);
}

export function useLastAssistantUtterance(): string {
  return useOrchestratorStore((s) => s.lastAssistantUtterance);
}

// ─── Composite (when a component genuinely wants the full picture) ───────

/**
 * Full snapshot. Re-renders on EVERY state change. Use only in debug
 * surfaces and the orchestrator-test page; avoid in production UI.
 */
export function useOrchestrationDebugSnapshot() {
  return useOrchestratorStore(
    useShallow((s) => ({
      mode: s.mode,
      voiceConnection: s.voiceConnection,
      isAssistantSpeaking: s.isAssistantSpeaking,
      activeModules: Array.from(s.activeModules).sort(),
      primaryFocus: s.primaryFocus,
      topicConfidence: s.topicConfidence,
      narrativeNode: s.narrative.current?.id ?? null,
      interruptionDepth: s.narrative.interruptionStack.length,
      lastUserUtterance: s.lastUserUtterance,
      lastAssistantUtterance: s.lastAssistantUtterance,
      lastClassification: s.lastClassification,
    })),
  );
}
