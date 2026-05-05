/**
 * Local mirror of relevant types from `apps/web/lib/hooks/use-jeffrey-realtime.ts`.
 *
 * The orchestrator package can't `import` from `apps/web` (apps don't export
 * code to packages — that breaks the dependency graph). Instead we keep a
 * narrow structural copy here. Any change to the hook's public types must
 * update this file too.
 *
 * Source: `apps/web/lib/hooks/use-jeffrey-realtime.ts` (commit 3a8e123 +
 * post-PR-69 state).
 */

export type RealtimeState =
  | "idle"
  | "requesting-ticket"
  | "connecting"
  | "ready"
  | "listening"
  | "speaking"
  | "closing"
  | "closed"
  | "error";

export interface TranscriptTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  partial: boolean;
}

/**
 * Re-export name we use for the hook so the realtime adapter has a stable
 * type alias. We don't actually call the hook here — the adapter receives
 * its outputs via `onStateChange` / `onTranscript` / `onAssistantSpeaking`
 * imperatively, leaving the hook subscription in apps/web's React tree.
 */
export type useJeffreyRealtime = unknown;
