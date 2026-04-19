/**
 * OpenAI Realtime bridge.
 *
 * Connects to the OpenAI Realtime API (WebSocket, voice-to-voice) so Jeffrey
 * can carry a live conversation with server VAD, barge-in, and turn-taking.
 *
 * This bridge returns a high-level controller; the concrete WebSocket
 * transport lives in the Fastify server layer (apps/api), which can hand the
 * raw socket to this module or swap it for a test double.
 *
 * We intentionally do not depend on a browser WebSocket implementation here —
 * this is server-only. The caller in apps/api will proxy client audio in over
 * a secure channel and forward responses back.
 */

import { loadConfig } from "../config.js";
import {
  JeffreyProviderError,
  JeffreyVoiceError,
} from "../errors.js";
import { openAiRealtimeVoice } from "../voice.js";
import { systemPrompt } from "../prompts/index.js";
import type { JeffreySurface } from "../types.js";

export interface RealtimeSessionOptions {
  surface: JeffreySurface;
  /** Surface-specific instructions overlay. */
  instructionsOverlay?: string;
  /** Preload context (memory preamble, investor facts). */
  extraContext?: string[];
  /** Injected Realtime model. Defaults from env. */
  model?: string;
}

export interface RealtimeSessionDescriptor {
  /** URL for the Realtime WebSocket. */
  url: string;
  /** Headers the server must add when opening the socket. */
  headers: Record<string, string>;
  /** The session.update payload to send immediately after connect. */
  sessionUpdate: Record<string, unknown>;
}

/**
 * Build everything the Fastify server needs to open a Realtime WebSocket on
 * behalf of the browser. We keep the socket itself in apps/api — this
 * package stays transport-agnostic.
 */
export function prepareRealtimeSession(
  options: RealtimeSessionOptions,
): RealtimeSessionDescriptor {
  const cfg = loadConfig();
  const model = options.model ?? cfg.OPENAI_JEFFREY_REALTIME_MODEL;

  const instructionParts: string[] = [
    systemPrompt,
    openAiRealtimeVoice.instructionsOverlay,
    `### Current surface\n${options.surface}`,
  ];
  if (options.instructionsOverlay) instructionParts.push(options.instructionsOverlay);
  if (options.extraContext?.length) {
    instructionParts.push("### Additional context\n" + options.extraContext.join("\n\n"));
  }

  const sessionUpdate = {
    type: "session.update",
    session: {
      model,
      instructions: instructionParts.join("\n\n"),
      voice: openAiRealtimeVoice.voice,
      input_audio_format: openAiRealtimeVoice.inputFormat,
      output_audio_format: openAiRealtimeVoice.outputFormat,
      turn_detection: {
        type: openAiRealtimeVoice.turnDetection.type,
        threshold: openAiRealtimeVoice.turnDetection.threshold,
        prefix_padding_ms: openAiRealtimeVoice.turnDetection.prefixPaddingMs,
        silence_duration_ms: openAiRealtimeVoice.turnDetection.silenceDurationMs,
      },
      modalities: ["audio", "text"],
    },
  };

  return {
    url: `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
    headers: {
      Authorization: `Bearer ${cfg.OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
    sessionUpdate,
  };
}

/**
 * Controller surface exposed to apps/api. The server implements these
 * methods against whichever WebSocket it uses; this interface keeps the
 * package portable.
 */
export interface RealtimeController {
  sendUserText(text: string): Promise<void>;
  sendUserAudioChunk(bytes: Uint8Array): Promise<void>;
  commitUserTurn(): Promise<void>;
  requestAssistantResponse(): Promise<void>;
  close(reason?: string): Promise<void>;
}

/**
 * Thin helper to build the event payloads — useful for the server controller
 * and for tests without a live socket.
 */
export const realtimeEvents = {
  userAudioAppend(base64Pcm: string) {
    return { type: "input_audio_buffer.append", audio: base64Pcm };
  },
  userAudioCommit() {
    return { type: "input_audio_buffer.commit" };
  },
  userText(text: string) {
    return {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    };
  },
  responseCreate(options?: { modalities?: Array<"text" | "audio"> }) {
    return {
      type: "response.create",
      response: {
        modalities: options?.modalities ?? ["audio", "text"],
      },
    };
  },
  close() {
    return { type: "session.close" };
  },
};

/** Narrow helper so apps/api can classify transport failures consistently. */
export function wrapRealtimeError(err: unknown, context: string): JeffreyVoiceError {
  if (err instanceof JeffreyProviderError) {
    return new JeffreyVoiceError(`${context}: ${err.message}`, { cause: err });
  }
  return new JeffreyVoiceError(context, { cause: err });
}
