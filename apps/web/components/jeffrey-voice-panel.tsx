"use client";

/**
 * JeffreyVoicePanel — modality overlay for voice sessions on /chat.
 *
 * Drops onto any authenticated surface as a modal. Uses useJeffreyRealtime
 * under the hood. Voice sessions are ephemeral by design — no history is
 * persisted to the HTTP chat backend. When the panel closes, the transcript
 * clears.
 *
 * Brand notes:
 *  - Calm. Clear. Certain. Minimal affordance.
 *  - Tokens only (bg-surface-2, text-ink, text-muted, text-signal, border-line).
 *  - No "AI" framing. Jeffrey listens. Jeffrey answers.
 */

import { useEffect, useRef } from "react";
import {
  useJeffreyRealtime,
  type RealtimeState,
  type TranscriptTurn,
} from "../lib/hooks/use-jeffrey-realtime";
import { Spinner } from "./ui";

export interface JeffreyVoicePanelProps {
  open: boolean;
  onClose: () => void;
}

export function JeffreyVoicePanel({ open, onClose }: JeffreyVoicePanelProps) {
  const {
    state,
    error,
    transcript,
    isAssistantSpeaking,
    start,
    stop,
  } = useJeffreyRealtime({ surface: "concierge" });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom on new delta.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript]);

  // Escape closes the panel (teardown is in the unmount effect below).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stop();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, stop]);

  // Guarantee teardown when the panel is removed from the tree.
  useEffect(() => {
    if (!open) stop();
  }, [open, stop]);

  if (!open) return null;

  const active = state === "ready" || state === "listening" || state === "speaking";
  const connecting = state === "requesting-ticket" || state === "connecting";
  const canStart = state === "idle" || state === "closed" || state === "error";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm"
      onClick={() => {
        stop();
        onClose();
      }}
    >
      <div
        className="w-full max-w-md mx-4 bg-surface-2 border border-line rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <VoiceOrb state={state} isAssistantSpeaking={isAssistantSpeaking} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink">Jeffrey · Voice</p>
            <p className="text-xs text-muted">{stateLabel(state, isAssistantSpeaking)}</p>
          </div>
          <button
            onClick={() => {
              stop();
              onClose();
            }}
            className="text-muted hover:text-ink text-sm"
            aria-label="Close voice panel"
          >
            ✕
          </button>
        </div>

        {/* Transcript */}
        <div
          ref={scrollRef}
          className="px-5 py-4 h-72 overflow-y-auto space-y-3 text-sm"
        >
          {transcript.length === 0 ? (
            <EmptyState state={state} />
          ) : (
            transcript.map((turn) => <TranscriptLine key={turn.id} turn={turn} />)
          )}
          {error && (
            <p className="text-xs text-danger border-l-2 border-danger pl-2">
              {error}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-line flex items-center gap-3">
          {canStart ? (
            <button
              onClick={() => {
                start().catch(() => {
                  /* error captured in hook state */
                });
              }}
              className="flex-1 bg-signal text-surface text-sm font-medium rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              Start talking
            </button>
          ) : connecting ? (
            <button
              disabled
              className="flex-1 bg-surface text-muted text-sm font-medium rounded-xl px-4 py-2.5 border border-line flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Spinner size="sm" />
              Connecting…
            </button>
          ) : active ? (
            <button
              onClick={() => {
                stop();
              }}
              className="flex-1 bg-surface text-ink text-sm font-medium rounded-xl px-4 py-2.5 border border-line hover:border-muted transition-colors"
            >
              End session
            </button>
          ) : null}
        </div>

        <p className="px-5 pb-4 text-[11px] text-soft text-center">
          Voice sessions are ephemeral. Not medical advice.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Sub-components
 * ----------------------------------------------------------------------- */

function VoiceOrb({
  state,
  isAssistantSpeaking,
}: {
  state: RealtimeState;
  isAssistantSpeaking: boolean;
}) {
  // Pulse intensity maps to conversational state.
  const mode =
    state === "listening"
      ? "listening"
      : isAssistantSpeaking || state === "speaking"
      ? "speaking"
      : state === "requesting-ticket" || state === "connecting"
      ? "connecting"
      : "idle";

  return (
    <div className="relative w-9 h-9 shrink-0">
      <div
        className={`absolute inset-0 rounded-full bg-signal transition-opacity ${
          mode === "speaking"
            ? "opacity-100 animate-pulse"
            : mode === "listening"
            ? "opacity-80"
            : mode === "connecting"
            ? "opacity-50 animate-pulse"
            : "opacity-40"
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-surface">
        J
      </div>
    </div>
  );
}

function TranscriptLine({ turn }: { turn: TranscriptTurn }) {
  const isUser = turn.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${
          isUser
            ? "bg-signal text-surface rounded-tr-sm"
            : "bg-surface text-ink rounded-tl-sm border border-line"
        } ${turn.partial ? "opacity-70" : ""}`}
      >
        {turn.text || (turn.partial ? "…" : "")}
      </div>
    </div>
  );
}

function EmptyState({ state }: { state: RealtimeState }) {
  if (state === "idle" || state === "closed") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-muted">
        <p className="text-sm text-ink">Press to start.</p>
        <p className="text-xs">Speak naturally. Jeffrey listens, answers, and adapts.</p>
      </div>
    );
  }
  if (state === "requesting-ticket" || state === "connecting") {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }
  if (state === "ready" || state === "listening") {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted">
        Listening…
      </div>
    );
  }
  return null;
}

function stateLabel(state: RealtimeState, speaking: boolean): string {
  if (speaking) return "Speaking";
  switch (state) {
    case "idle":
      return "Ready";
    case "requesting-ticket":
      return "Authorizing…";
    case "connecting":
      return "Connecting…";
    case "ready":
      return "Listening";
    case "listening":
      return "Listening";
    case "speaking":
      return "Speaking";
    case "closing":
      return "Closing…";
    case "closed":
      return "Ended";
    case "error":
      return "Error";
    default:
      return "";
  }
}
