/**
 * Health-signal emission service
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J4-1, Issue #35.
 *
 * Signals are typed events that capture changes in user state worth reasoning
 * about. They feed two consumers:
 *   1. Adaptive tuning service (apps/api/src/services/adaptive-tuning.ts)
 *      consumes them nightly to propose formula deltas.
 *   2. Proactive agent (packages/jeffrey/src/orchestrator.ts) consumes them
 *      in real-time to decide whether Jeffrey reaches out.
 *
 * Signals are persisted (audit log + signals table) and emitted to an
 * in-process event bus that the consumers subscribe to.
 *
 * Thin layer — heavy logic lives in the consumers, not here.
 */

import { EventEmitter } from "node:events";

export type SignalKind =
  | "biomarker_delta"        // single lab value moved beyond a threshold
  | "sleep_response"          // sleep arch / quality changed after stack adjustment
  | "adherence_streak"        // user logged N consecutive doses
  | "adherence_streak_break"  // missed dose after a streak
  | "hrv_drop"                // overnight HRV dropped vs 14-day baseline
  | "recovery_jump"           // WHOOP recovery jumped vs baseline
  | "mood_note"               // user added a journal entry with sentiment shift
  | "lab_critical"            // biomarker hit a critical-low or critical-high threshold
  | "data_freshness_stale"    // wearable data > 72h old
  | "intent_pause"            // user toggled "pause stack for travel"
  | "manual"                  // operator-emitted (debugging, replay)
  ;

export interface SignalEvent {
  signalId: string;
  kind: SignalKind;
  userId: string;
  emittedAt: string;          // ISO8601
  /** What produced the signal — `wearable.whoop`, `lab.import`, `cron.adherence`, etc. */
  source: string;
  /** The numeric/structured payload — kind-specific */
  payload: Record<string, unknown>;
  /** Human-readable summary for the audit log */
  summary: string;
}

const bus = new EventEmitter();
bus.setMaxListeners(50);

/** Emit a signal. Returns the persisted SignalEvent. */
export async function emitSignal(input: Omit<SignalEvent, "signalId" | "emittedAt">): Promise<SignalEvent> {
  const event: SignalEvent = {
    ...input,
    signalId: `sig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    emittedAt: new Date().toISOString(),
  };

  // TODO(persistence): write to signals table via @aissisted/db.
  // The Drizzle schema adds in `packages/db/src/schema.ts`:
  //   signals: pgTable("signals", { ... })
  // Once that lands, persist here before fanning out.

  bus.emit("signal", event);
  bus.emit(`signal:${event.kind}`, event);
  return event;
}

/** Subscribe to all signals. Returns an unsubscribe fn. */
export function onSignal(handler: (e: SignalEvent) => void): () => void {
  bus.on("signal", handler);
  return () => bus.off("signal", handler);
}

/** Subscribe to one signal kind. */
export function onSignalKind<K extends SignalKind>(
  kind: K,
  handler: (e: SignalEvent) => void,
): () => void {
  bus.on(`signal:${kind}`, handler);
  return () => bus.off(`signal:${kind}`, handler);
}

/** Inspector — synthetic for tests + admin tooling. Wipes listeners. */
export function _resetSignalBusForTests(): void {
  bus.removeAllListeners();
}
