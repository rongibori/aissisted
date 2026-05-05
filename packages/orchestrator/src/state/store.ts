/**
 * Zustand store — the single source of truth for orchestration state.
 *
 * The store accepts events via dispatch() and runs them through the pure
 * reducer. Adapters (realtime, classifier, narrative engine) call dispatch;
 * UI components subscribe via the React hooks in adapters/react-hooks.ts.
 *
 * Why Zustand: no boilerplate, scoped re-renders, plays well with React 19
 * Server Components, ~3KB. Confirmed in the alignment cycle.
 */

import { create } from "zustand";
import { reduce, INITIAL_STATE } from "./reducers";
import type {
  OrchestrationEvent,
  OrchestrationState,
} from "./types";

interface OrchestratorStore extends OrchestrationState {
  /** Dispatch an event through the reducer. Synchronous, pure. */
  dispatch: (event: OrchestrationEvent) => void;
  /** Reset to the initial state. Used in tests + reconnect flows. */
  reset: () => void;
  /**
   * Internal — exposes the current snapshot for non-React callers (e.g.
   * adapters that need to read state without subscribing).
   */
  getState: () => OrchestrationState;
}

export const useOrchestratorStore = create<OrchestratorStore>((set, get) => ({
  ...INITIAL_STATE,

  dispatch: (event) => {
    set((prev) => {
      const { dispatch: _d, reset: _r, getState: _g, ...currentState } = prev;
      const next = reduce(currentState as OrchestrationState, event);
      return next;
    });
  },

  reset: () => {
    set((prev) => ({
      ...prev,
      ...INITIAL_STATE,
    }));
  },

  getState: () => {
    const { dispatch: _d, reset: _r, getState: _g, ...state } = get();
    return state as OrchestrationState;
  },
}));

// ─── Direct (non-React) access ───────────────────────────────────────────

/**
 * Dispatch from outside React (e.g. inside a class, a worker, or a
 * non-hook adapter). Identical behavior to the React hook's dispatch.
 */
export function dispatch(event: OrchestrationEvent): void {
  useOrchestratorStore.getState().dispatch(event);
}

/**
 * Synchronous read of current state from outside React. Useful for adapter
 * tick schedulers and tests. UI should always use the hooks instead — this
 * does not subscribe.
 */
export function getOrchestrationState(): OrchestrationState {
  return useOrchestratorStore.getState().getState();
}

/**
 * Subscribe to state changes from outside React. Returns an unsubscribe fn.
 * Used by adapters that need to react to state without rendering.
 */
export function subscribe(
  listener: (state: OrchestrationState, prev: OrchestrationState) => void,
): () => void {
  return useOrchestratorStore.subscribe((next, prev) => {
    const { dispatch: _nd, reset: _nr, getState: _ng, ...nextState } = next;
    const { dispatch: _pd, reset: _pr, getState: _pg, ...prevState } = prev;
    listener(nextState as OrchestrationState, prevState as OrchestrationState);
  });
}
