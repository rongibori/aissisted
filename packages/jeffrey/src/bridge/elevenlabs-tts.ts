/**
 * ElevenLabs streaming TTS bridge.
 *
 * Jeffrey's premium British voice is delivered via ElevenLabs. We call the
 * streaming TTS endpoint directly (fetch) to keep the dependency footprint
 * small and to avoid pulling a browser-only SDK into the server.
 *
 * Streaming endpoint reference:
 *   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream
 *   headers: xi-api-key, accept: audio/mpeg
 *   body: { text, model_id, voice_settings, optimize_streaming_latency }
 *
 * The returned stream is delivered chunk-by-chunk to the caller so the
 * browser can start playback as soon as the first bytes arrive.
 */

import { loadConfig, requireVoiceConfig } from "../config.js";
import { JeffreyProviderError, JeffreyVoiceError } from "../errors.js";
import { elevenLabsVoice } from "../voice.js";
import type { AudioChunk } from "../types.js";

export interface SynthesizeOptions {
  text: string;
  /** Override the voice ID if needed. Defaults to env. */
  voiceId?: string;
  /** Override the model. Defaults to eleven_flash_v2_5. */
  model?: string;
  signal?: AbortSignal;
}

/**
 * Yields audio chunks as they arrive from ElevenLabs. The caller is
 * responsible for forwarding them to the browser (typically over a WS or
 * SSE channel) and for ordering (we include seq numbers).
 */
export async function* synthesizeStream(
  options: SynthesizeOptions,
): AsyncGenerator<AudioChunk, void, unknown> {
  const cfg = loadConfig();
  requireVoiceConfig(cfg);

  const voiceId = options.voiceId ?? cfg.ELEVENLABS_JEFFREY_VOICE_ID!;
  const model = options.model ?? cfg.ELEVENLABS_MODEL;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    voiceId,
  )}/stream?optimize_streaming_latency=${elevenLabsVoice.optimizeStreamingLatency}&output_format=${elevenLabsVoice.outputFormat}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": cfg.ELEVENLABS_API_KEY!,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: options.text,
        model_id: model,
        voice_settings: {
          stability: elevenLabsVoice.voiceSettings.stability,
          similarity_boost: elevenLabsVoice.voiceSettings.similarityBoost,
          style: elevenLabsVoice.voiceSettings.style,
          use_speaker_boost: elevenLabsVoice.voiceSettings.speakerBoost,
        },
      }),
      signal: options.signal,
    });
  } catch (err) {
    throw new JeffreyProviderError(
      "elevenlabs",
      "ElevenLabs request failed to start",
      { cause: err },
    );
  }

  if (!res.ok || !res.body) {
    const body = await safeReadText(res);
    throw new JeffreyProviderError(
      "elevenlabs",
      `ElevenLabs returned ${res.status}: ${body.slice(0, 200)}`,
    );
  }

  const reader = res.body.getReader();
  let seq = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      yield {
        bytes: value,
        seq: seq++,
        final: false,
        mime: "audio/mpeg",
      };
    }
    // Emit a zero-byte final marker so downstream consumers can close cleanly.
    yield {
      bytes: new Uint8Array(0),
      seq: seq,
      final: true,
      mime: "audio/mpeg",
    };
  } catch (err) {
    throw new JeffreyVoiceError("ElevenLabs stream aborted", { cause: err });
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* noop */
    }
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}
