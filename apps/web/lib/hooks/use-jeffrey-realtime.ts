"use client";

/**
 * useJeffreyRealtime — React hook for live voice sessions with Jeffrey.
 *
 * Wiring (browser side):
 *
 *   1. POST /v1/jeffrey/realtime/ticket                → short-lived JWT
 *   2. WS   /v1/jeffrey/realtime?ticket=…&surface=…    → Fastify proxy
 *   3. AudioContext({ sampleRate: 24000 }) + worklet   → int16 PCM @ 24 kHz
 *   4. worklet.port.onmessage → base64 → input_audio_buffer.append
 *   5. ws.onmessage → response.audio.delta → AudioBufferSource queue
 *
 * Server VAD is configured upstream, so we do not commit turns manually. The
 * hook exposes a tiny state machine, a running transcript, and start/stop
 * controls. Everything mutable that shouldn't re-render lives in refs.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  base64ToBytes,
  bytesToBase64,
  getApiWsUrl,
  int16LEToFloat32,
  requestRealtimeTicket,
} from "../jeffrey-realtime";

export type RealtimeSurface = "concierge" | "onboarding";

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

export interface UseJeffreyRealtimeOptions {
  surface: RealtimeSurface;
  /** Override the API origin (defaults to NEXT_PUBLIC_API_URL). */
  apiUrl?: string;
  /** Provide an override token; defaults to localStorage aissisted_token. */
  token?: string | null;
  /**
   * Path to the AudioWorklet module on the site. Defaults to the file we ship
   * at /public/jeffrey-mic-worklet.js.
   */
  workletPath?: string;
}

export interface UseJeffreyRealtimeReturn {
  state: RealtimeState;
  error: string | null;
  /** Full turn log, newest last. Partial turns mutate in place. */
  transcript: TranscriptTurn[];
  /** Whether Jeffrey is currently speaking audio to the user. */
  isAssistantSpeaking: boolean;
  start: () => Promise<void>;
  stop: () => void;
  sendText: (text: string) => void;
}

/* --------------------------------------------------------------------------
 * OpenAI Realtime event shapes (narrow — we only read what we use).
 * ------------------------------------------------------------------------ */
interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface AudioDeltaEvent extends RealtimeEvent {
  type: "response.audio.delta";
  delta: string;
}

interface TextDeltaEvent extends RealtimeEvent {
  type: "response.audio_transcript.delta" | "response.text.delta";
  delta: string;
  response_id?: string;
  item_id?: string;
}

interface TranscriptionCompletedEvent extends RealtimeEvent {
  type: "conversation.item.input_audio_transcription.completed";
  transcript: string;
  item_id: string;
}

interface ErrorEvent extends RealtimeEvent {
  type: "error";
  error?: { message?: string; code?: string };
}

/* --------------------------------------------------------------------------
 * Hook
 * ------------------------------------------------------------------------ */
export function useJeffreyRealtime(
  options: UseJeffreyRealtimeOptions,
): UseJeffreyRealtimeReturn {
  const { surface, apiUrl, token, workletPath = "/jeffrey-mic-worklet.js" } =
    options;

  const [state, setState] = useState<RealtimeState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  // Refs for non-render state.
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackClockRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentAssistantTurnRef = useRef<string | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  /* ----------------------------------------------------------------------
   * Transcript helpers — idempotent merge so partial deltas mutate a single
   * turn in the list rather than appending every chunk.
   * -------------------------------------------------------------------- */
  const upsertTurn = useCallback(
    (
      id: string,
      role: "user" | "assistant",
      chunk: string,
      partial: boolean,
    ) => {
      setTranscript((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) {
          return [...prev, { id, role, text: chunk, partial }];
        }
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          text: next[idx].text + chunk,
          partial,
        };
        return next;
      });
    },
    [],
  );

  const finalizeTurn = useCallback((id: string) => {
    setTranscript((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], partial: false };
      return next;
    });
  }, []);

  /* ----------------------------------------------------------------------
   * Playback: schedule each base64 pcm16 chunk onto a running clock so audio
   * plays back-to-back without gaps.
   * -------------------------------------------------------------------- */
  const enqueueAssistantAudio = useCallback((base64: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bytes = base64ToBytes(base64);
    const decoded = int16LEToFloat32(bytes);
    if (decoded.length === 0) return;

    // Re-home into a plain ArrayBuffer so copyToChannel's Float32Array<ArrayBuffer>
    // signature is satisfied under TS strict typed-array variance.
    const floats = new Float32Array(decoded.length);
    floats.set(decoded);

    const buffer = ctx.createBuffer(1, floats.length, ctx.sampleRate);
    buffer.copyToChannel(floats, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(playbackClockRef.current, now);
    source.start(startAt);
    playbackClockRef.current = startAt + buffer.duration;

    activeSourcesRef.current.add(source);
    setIsAssistantSpeaking(true);
    setState((prev) => (prev === "ready" || prev === "listening" ? "speaking" : prev));

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setIsAssistantSpeaking(false);
        setState((prev) => (prev === "speaking" ? "listening" : prev));
      }
    };
  }, []);

  const cancelAllPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        /* already stopped */
      }
    }
    activeSourcesRef.current.clear();
    playbackClockRef.current = 0;
    setIsAssistantSpeaking(false);
  }, []);

  /* ----------------------------------------------------------------------
   * Inbound event handling.
   * -------------------------------------------------------------------- */
  const handleRealtimeEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case "session.created":
        case "session.updated":
          // No-op — the server already sent session.update on our behalf.
          return;

        case "input_audio_buffer.speech_started":
          // User started speaking — barge-in: cut assistant audio.
          cancelAllPlayback();
          setState((prev) =>
            prev === "speaking" || prev === "ready" ? "listening" : prev,
          );
          return;

        case "input_audio_buffer.speech_stopped":
          // Server VAD will now commit and generate a response.
          return;

        case "conversation.item.input_audio_transcription.completed": {
          const e = event as TranscriptionCompletedEvent;
          if (e.transcript) {
            upsertTurn(`user:${e.item_id}`, "user", e.transcript, false);
          }
          return;
        }

        case "response.created": {
          const responseId = (event as { response?: { id?: string } }).response
            ?.id;
          if (responseId) currentAssistantTurnRef.current = `assistant:${responseId}`;
          return;
        }

        case "response.audio.delta": {
          const e = event as AudioDeltaEvent;
          if (e.delta) enqueueAssistantAudio(e.delta);
          return;
        }

        case "response.audio_transcript.delta":
        case "response.text.delta": {
          const e = event as TextDeltaEvent;
          const turnId =
            currentAssistantTurnRef.current ??
            `assistant:${e.response_id ?? e.item_id ?? "unknown"}`;
          upsertTurn(turnId, "assistant", e.delta, true);
          return;
        }

        case "response.audio_transcript.done":
        case "response.text.done": {
          const turnId = currentAssistantTurnRef.current;
          if (turnId) finalizeTurn(turnId);
          return;
        }

        case "response.done": {
          const turnId = currentAssistantTurnRef.current;
          if (turnId) finalizeTurn(turnId);
          currentAssistantTurnRef.current = null;
          return;
        }

        case "error": {
          const e = event as ErrorEvent;
          setError(e.error?.message ?? "Realtime error");
          setState("error");
          return;
        }

        default:
          // Silent drop — Realtime emits many diagnostic events we don't need.
          return;
      }
    },
    [cancelAllPlayback, enqueueAssistantAudio, finalizeTurn, upsertTurn],
  );

  /* ----------------------------------------------------------------------
   * stop — idempotent teardown.
   * -------------------------------------------------------------------- */
  const stop = useCallback(() => {
    // Run the captured teardown (set up during start) then clear state.
    teardownRef.current?.();
    teardownRef.current = null;
    currentAssistantTurnRef.current = null;
    setIsAssistantSpeaking(false);
    setState((prev) => (prev === "error" ? prev : "closed"));
  }, []);

  /* ----------------------------------------------------------------------
   * start — ticket mint → WS upgrade → mic graph wiring.
   * -------------------------------------------------------------------- */
  const start = useCallback(async () => {
    if (state !== "idle" && state !== "closed" && state !== "error") {
      return; // Already starting or live.
    }
    setError(null);
    setTranscript([]);
    setIsAssistantSpeaking(false);

    setState("requesting-ticket");

    let ticket: string;
    try {
      const result = await requestRealtimeTicket(surface, { apiUrl, token });
      ticket = result.ticket;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ticket request failed");
      setState("error");
      return;
    }

    setState("connecting");

    /* ---- Mic graph ---------------------------------------------------- */
    // Track partially-acquired resources so we can unwind cleanly on failure.
    let audioCtx: AudioContext | null = null;
    let micStream: MediaStream | null = null;
    let workletNode: AudioWorkletNode | null = null;
    let micSource: MediaStreamAudioSourceNode | null = null;
    try {
      audioCtx = new AudioContext({ sampleRate: 24000 });
      await audioCtx.audioWorklet.addModule(workletPath);
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micSource = audioCtx.createMediaStreamSource(micStream);
      workletNode = new AudioWorkletNode(audioCtx, "jeffrey-mic-processor");
      micSource.connect(workletNode);
      // Worklet must have a destination for the graph to pull; use a muted
      // gain so we don't create feedback.
      const silentSink = audioCtx.createGain();
      silentSink.gain.value = 0;
      workletNode.connect(silentSink).connect(audioCtx.destination);
    } catch (err) {
      // Partial setup — release any resources we did acquire before bailing.
      try { workletNode?.disconnect(); } catch { /* noop */ }
      try { micSource?.disconnect(); } catch { /* noop */ }
      if (micStream) {
        for (const track of micStream.getTracks()) {
          try { track.stop(); } catch { /* noop */ }
        }
      }
      if (audioCtx) {
        try { await audioCtx.close(); } catch { /* noop */ }
      }
      setError(err instanceof Error ? err.message : "Microphone setup failed");
      setState("error");
      return;
    }

    // After a successful try-block, these are all non-null. Narrow for TS.
    if (!audioCtx || !micStream || !workletNode || !micSource) {
      setError("Microphone setup failed");
      setState("error");
      return;
    }
    const audioCtxNN = audioCtx;
    const micStreamNN = micStream;
    const workletNodeNN = workletNode;
    const micSourceNN = micSource;

    audioCtxRef.current = audioCtxNN;
    micStreamRef.current = micStreamNN;
    workletNodeRef.current = workletNodeNN;
    micSourceRef.current = micSourceNN;
    playbackClockRef.current = 0;

    /* ---- WebSocket ---------------------------------------------------- */
    // Use the apiUrl override (if any) as the WS origin so the ticket and
    // socket land on the same host. Fall back to getApiWsUrl() otherwise.
    const wsBaseUrl = (() => {
      if (!apiUrl) return getApiWsUrl();
      try {
        const u = new URL(apiUrl);
        if (u.protocol === "http:") u.protocol = "ws:";
        else if (u.protocol === "https:") u.protocol = "wss:";
        return u.toString().replace(/\/$/, "");
      } catch {
        return getApiWsUrl();
      }
    })();
    const wsUrl = `${wsBaseUrl}/v1/jeffrey/realtime?ticket=${encodeURIComponent(
      ticket,
    )}&surface=${encodeURIComponent(surface)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    /* ---- Teardown closure (hoisted so socket handlers can call it) --- */
    // Idempotent: if the refs have already been cleared, this is a no-op.
    const teardown = () => {
      if (!audioCtxRef.current && !wsRef.current) return;
      setState((prev) => (prev === "closed" || prev === "error" ? prev : "closing"));
      try { workletNodeNN.port.onmessage = null; } catch { /* noop */ }
      try { workletNodeNN.disconnect(); } catch { /* noop */ }
      try { micSourceNN.disconnect(); } catch { /* noop */ }
      for (const track of micStreamNN.getTracks()) {
        try { track.stop(); } catch { /* noop */ }
      }
      cancelAllPlayback();
      try { audioCtxNN.close(); } catch { /* noop */ }
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try { ws.close(1000, "client stop"); } catch { /* noop */ }
      }
      wsRef.current = null;
      audioCtxRef.current = null;
      workletNodeRef.current = null;
      micStreamRef.current = null;
      micSourceRef.current = null;
    };
    teardownRef.current = teardown;

    ws.onopen = () => {
      setState("ready");
    };

    ws.onmessage = (msg) => {
      if (typeof msg.data !== "string") return;
      try {
        const event = JSON.parse(msg.data) as RealtimeEvent;
        handleRealtimeEvent(event);
      } catch {
        // Ignore non-JSON frames.
      }
    };

    ws.onerror = () => {
      // Socket failure — tear down mic graph so we don't leak an active
      // AudioContext / hot microphone after the connection dies.
      teardown();
      setError("Realtime socket error");
      setState("error");
    };

    ws.onclose = (ev) => {
      // 1000 = normal client-initiated close. Our own stop()/teardown calls
      // produce this code; in that case state is already closing/closed so
      // don't override it or double-teardown.
      if (ev.code === 1000) {
        setState((prev) => (prev === "error" ? prev : "closed"));
        return;
      }
      teardown();
      setError(ev.reason || `Socket closed (${ev.code})`);
      setState("error");
    };

    /* ---- Mic → WS bridge --------------------------------------------- */
    workletNodeNN.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const base64 = bytesToBase64(event.data);
      ws.send(
        JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }),
      );
      setState((prev) =>
        prev === "ready" || prev === "speaking" ? "listening" : prev,
      );
    };
  }, [
    apiUrl,
    cancelAllPlayback,
    handleRealtimeEvent,
    state,
    surface,
    token,
    workletPath,
  ]);

  /* ----------------------------------------------------------------------
   * sendText — let the caller inject a text turn (e.g. fallback input).
   * -------------------------------------------------------------------- */
  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      }),
    );
    ws.send(
      JSON.stringify({
        type: "response.create",
        response: { modalities: ["audio", "text"] },
      }),
    );
  }, []);

  /* ----------------------------------------------------------------------
   * Lifecycle — tear down on unmount.
   * -------------------------------------------------------------------- */
  useEffect(() => {
    return () => {
      teardownRef.current?.();
      teardownRef.current = null;
    };
  }, []);

  return {
    state,
    error,
    transcript,
    isAssistantSpeaking,
    start,
    stop,
    sendText,
  };
}
