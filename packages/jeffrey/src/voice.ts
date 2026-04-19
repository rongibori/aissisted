/**
 * Voice configuration for Jeffrey.
 *
 * Priority order:
 *   1. ElevenLabs streaming TTS — premium British voice, best fidelity.
 *   2. OpenAI Realtime — lower latency, voice-to-voice, used when we need
 *      barge-in and natural turn-taking but are willing to accept a less
 *      bespoke British sound.
 *
 * The Jeffrey session picks the transport based on surface and caller intent;
 * the values here are just the settings each transport needs.
 */

import type { JeffreySurface } from "./types.js";

export const elevenLabsVoice = {
  /** Env-overridable. Voice ID of the chosen British premium voice. */
  voiceIdEnvVar: "ELEVENLABS_JEFFREY_VOICE_ID",
  model: "eleven_flash_v2_5",
  /** 22kHz PCM for lowest latency. Use mp3 for playback durability. */
  outputFormat: "mp3_44100_128",
  voiceSettings: {
    /** Stability — higher is calmer, less expressive. Jeffrey runs high. */
    stability: 0.6,
    /** Similarity — how close to the reference voice. */
    similarityBoost: 0.85,
    /** Style — keep low; we want composure, not theatre. */
    style: 0.15,
    speakerBoost: true,
  },
  /** Optimize streaming latency at the cost of tiny quality drops. 2 = balanced. */
  optimizeStreamingLatency: 2,
} as const;

export const openAiRealtimeVoice = {
  /** The Realtime model family. Override via env. */
  modelEnvVar: "OPENAI_JEFFREY_REALTIME_MODEL",
  /** Closest available preset to Jeffrey's target register. */
  voice: "sage" as const,
  /** Audio format the Realtime socket negotiates. */
  inputFormat: "pcm16" as const,
  outputFormat: "pcm16" as const,
  turnDetection: {
    type: "server_vad" as const,
    threshold: 0.5,
    prefixPaddingMs: 300,
    silenceDurationMs: 500,
  },
  /** Jeffrey's Realtime-tuned instructions overlay the system prompt. */
  instructionsOverlay:
    "Speak in short, composed British sentences. Never begin with 'Certainly' or 'Absolutely'. Warmth without performance.",
} as const;

/** Default transport per surface. Investor live demos want the best voice. */
export const defaultTransportBySurface: Record<
  JeffreySurface,
  "elevenlabs" | "openai-realtime" | "hybrid" | "text-only"
> = {
  investor: "hybrid", // OpenAI Realtime for turn-taking, ElevenLabs for final delivery
  "product-walkthrough": "hybrid",
  onboarding: "hybrid",
  health: "elevenlabs", // premium calm delivery matters most here
  brand: "elevenlabs",
  concierge: "openai-realtime", // interactive; barge-in matters
};
