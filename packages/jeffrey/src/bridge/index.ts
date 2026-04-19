/**
 * Bridge barrel.
 *
 * `prepareRealtimeSession` — for OpenAI Realtime (WS) surfaces.
 * `synthesizeStream`       — for ElevenLabs streaming TTS.
 * `takeVoiceTurn`          — for hybrid: OpenAI reasoning + ElevenLabs voice.
 */

export {
  prepareRealtimeSession,
  realtimeEvents,
  wrapRealtimeError,
  type RealtimeController,
  type RealtimeSessionDescriptor,
  type RealtimeSessionOptions,
} from "./openai-realtime.js";

export {
  synthesizeStream,
  type SynthesizeOptions,
} from "./elevenlabs-tts.js";

export {
  takeVoiceTurn,
  splitForStreaming,
  type VoiceTurnResult,
} from "./audio-pipeline.js";
