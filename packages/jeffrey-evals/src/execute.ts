/**
 * @aissisted/jeffrey-evals — Execute
 *
 * Drives Jeffrey through a single eval case and captures everything.
 *
 * Modes:
 * - text: import { chat } from '@aissisted/jeffrey' and invoke directly
 * - voice: connect to OpenAI Realtime via the WS proxy in apps/api, send synthesized
 *   audio (TTS the input first), capture the audio stream + transcript out
 *
 * Both modes return a CapturedResponse with everything the scorer needs.
 */

import type { CapturedResponse, EvalCase, SyntheticPersona } from './types.js';
import { seedPersona, clearPersona } from './setup.js';

export async function executeCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  // 1. Seed the persona's state into the test DB (idempotent per case)
  await seedPersona(persona);

  try {
    if (evalCase.channel === 'voice') {
      return await executeVoiceCase(evalCase, persona);
    }
    return await executeTextCase(evalCase, persona);
  } finally {
    // Don't clear between cases of the same persona — let the suite reuse seeded state.
    // Cleanup happens at suite teardown.
  }
}

async function executeTextCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  // TODO(integration): import the canonical Jeffrey entry point.
  // Likely: `import { handleChat } from '@aissisted/jeffrey/bridge'`
  //
  // Pseudocode:
  //
  // const response = await handleChat({
  //   userId: persona.user.userId,
  //   input: evalCase.input,
  //   channel: 'text',
  //   stateOverride: evalCase.personaStateOverride,
  // });
  //
  // The handleChat function should return:
  //   - response.text
  //   - response.toolCalls (full array, not just count)
  //   - response.metrics (latency, tokens, cost)
  //   - response.auditEntries (anything written to the audit log during this turn)
  //   - response.memoryWrites (anything attempted to be written to memory)
  //
  // If handleChat doesn't expose those today, that's a sign the agent layer needs
  // to expose them — they're required for any meaningful eval.

  void evalCase;
  void persona;

  return placeholderResponse();
}

async function executeVoiceCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  // TODO(integration): for voice cases, the runner has two options:
  //
  // Option A: end-to-end via Realtime
  //   - TTS the input via OpenAI tts-1 to synthesize audio
  //   - Open a WS to the apps/api Realtime proxy
  //   - Stream audio in, capture audio + transcript out
  //   - Measure first-audio latency
  //   - Cost is real (Realtime is the expensive path)
  //
  // Option B: simulate voice path
  //   - Skip the actual audio streaming
  //   - Send the input as text but mark channel='voice' so Jeffrey's voice prompt is used
  //   - Validate the prompt path is voice-tuned but skip latency measurement
  //   - Use this for fast PR-gate runs; reserve Option A for nightly/manual
  //
  // Recommend implementing Option B first; Option A as an opt-in flag.

  void evalCase;
  void persona;

  return placeholderResponse();
}

function placeholderResponse(): CapturedResponse {
  return {
    text: '[NOT YET IMPLEMENTED — wire to @aissisted/jeffrey]',
    toolCalls: [],
    auditEntriesWritten: [],
    memoryWritesAttempted: [],
  };
}
