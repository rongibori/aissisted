/**
 * Audio pipeline — the OpenAI → ElevenLabs handoff.
 *
 * For surfaces where voice fidelity matters more than sub-500ms turn-taking
 * (investor demo, health interpretation, brand surfaces), we run a hybrid:
 *
 *   1. OpenAI chat-completions produces Jeffrey's text.
 *   2. The text is streamed into ElevenLabs TTS.
 *   3. Audio chunks are relayed to the browser as they arrive.
 *
 * This keeps the British premium voice at delivery-time while keeping all
 * the strategic reasoning in the OpenAI brain.
 */

import { createJeffreySession, type CreateSessionOptions } from "../session.js";
import { synthesizeStream } from "./elevenlabs-tts.js";
import { JeffreyVoiceError } from "../errors.js";
import type { AudioChunk, JeffreyReply } from "../types.js";

export interface VoiceTurnResult {
  reply: JeffreyReply;
  audio: AsyncGenerator<AudioChunk, void, unknown>;
}

/**
 * One voice turn: reasoning via OpenAI, voice via ElevenLabs.
 *
 * Returns the raw reply (text + usage + model) plus an async generator of
 * audio chunks. The caller typically sends `reply.text` to the browser
 * alongside the audio so the UI can render captions.
 */
export async function takeVoiceTurn(
  sessionOptions: CreateSessionOptions,
  question: string,
): Promise<VoiceTurnResult> {
  const session = await createJeffreySession(sessionOptions);
  const reply = await session.ask(question);
  if (!reply.text) {
    throw new JeffreyVoiceError("Jeffrey produced an empty reply — aborting voice turn");
  }
  const audio = synthesizeStream({ text: reply.text });
  return { reply, audio };
}

/**
 * Utility: split a reply into sentence-ish chunks so we can kick off TTS
 * earlier. ElevenLabs Flash is fast enough that this is usually unnecessary,
 * but we expose it for long health-interpretation answers.
 */
export function splitForStreaming(text: string): string[] {
  const parts = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Merge tiny trailing fragments into the previous sentence.
  const merged: string[] = [];
  for (const p of parts) {
    if (p.length < 12 && merged.length > 0) {
      merged[merged.length - 1] += " " + p;
    } else {
      merged.push(p);
    }
  }
  return merged;
}
