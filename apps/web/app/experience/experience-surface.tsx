"use client";

/**
 * Client surface — wires the orchestrator into a single tap-to-engage screen.
 *
 * - No labels, no panels, no text indicators of system state
 * - Everything is spatial + motion + light
 * - One primary action: tap anywhere to start / interrupt the conversation
 * - The whole screen is the affordance
 */

import { useCallback, useEffect, useRef } from "react";
import { useJeffreyRealtime } from "../../lib/hooks/use-jeffrey-realtime";
import {
  createRealtimeAdapter,
  dispatch,
  getOrchestrationState,
  type ClassifyFn,
  type ClassifyResponse,
  type EmbedFn,
  type EmbedResponse,
} from "@aissisted/orchestrator";
import { NeuralSystem } from "./neural-system";

// ─── API client wrappers ──────────────────────────────────────────────────

function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    window.location.origin.replace(":3000", ":4000")
  );
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t = window.localStorage.getItem("aissisted_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const embedFn: EmbedFn = async (texts) => {
  const resp = await fetch(`${getApiBase()}/v1/jeffrey/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ texts }),
  });
  if (!resp.ok) throw new Error(`embeddings ${resp.status}`);
  return (await resp.json()) as EmbedResponse;
};

const classifyFn: ClassifyFn = async (req) => {
  const resp = await fetch(`${getApiBase()}/v1/jeffrey/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(req),
  });
  if (!resp.ok) throw new Error(`classify ${resp.status}`);
  return (await resp.json()) as ClassifyResponse;
};

// ─── Surface ──────────────────────────────────────────────────────────────

export function ExperienceSurface() {
  const realtime = useJeffreyRealtime({ surface: "concierge" });

  // One adapter for the lifetime of this screen.
  const adapterRef = useRef<ReturnType<typeof createRealtimeAdapter> | null>(
    null,
  );
  if (adapterRef.current === null) {
    adapterRef.current = createRealtimeAdapter({
      embed: embedFn,
      classifyLlm: classifyFn,
      dispatch,
      getRollingAssistantText: () =>
        getOrchestrationState().lastAssistantUtterance,
    });
  }

  // Push hook outputs into the adapter on every render.
  useEffect(() => {
    adapterRef.current?.onStateChange(realtime.state);
  }, [realtime.state]);
  useEffect(() => {
    adapterRef.current?.onTranscript(realtime.transcript);
  }, [realtime.transcript]);
  useEffect(() => {
    adapterRef.current?.onAssistantSpeaking(realtime.isAssistantSpeaking);
  }, [realtime.isAssistantSpeaking]);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  /**
   * Single tap target = the entire screen.
   *
   * - When idle / disconnected → start the session
   * - When ready / listening / thinking → no-op (let server VAD handle turn-taking)
   * - When speaking → simulated interrupt (push speech_started so the
   *   orchestrator + audio layer cancel; native VAD will pick up real speech)
   */
  const onTap = useCallback(() => {
    const s = realtime.state;
    if (s === "idle" || s === "closed" || s === "error") {
      void realtime.start();
      return;
    }
    if (s === "speaking") {
      // Mirror what the realtime hook would do on real VAD speech_started:
      // cancel current playback, mark the orchestrator as listening.
      dispatch({ type: "user.speech_started" });
    }
  }, [realtime]);

  return (
    <main
      onClick={onTap}
      style={{
        position: "fixed",
        inset: 0,
        background: "#FFFFFF",
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
      aria-label="Aissisted experience"
    >
      {/* Wordmark — bottom-aligned, faint, never demands attention. */}
      <Wordmark />

      {/* Core + orbiting modules — fills the viewport. */}
      <NeuralSystem
        connected={
          realtime.state === "ready" ||
          realtime.state === "listening" ||
          realtime.state === "speaking"
        }
      />
    </main>
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 32,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 4.5,
          textTransform: "uppercase",
          color: "rgba(28, 28, 30, 0.32)",
          fontWeight: 500,
        }}
      >
        aissisted
      </div>
    </div>
  );
}
