/**
 * @aissisted/jeffrey-evals — Execute
 *
 * Drives Jeffrey through a single eval case and captures everything the
 * scorer needs. Returns a CapturedResponse with an embedded turnMetrics
 * field that score.ts uses to fill CaseResult.metrics.
 *
 * Text channel: calls createJeffreySession + session.ask() directly.
 * Voice channel B1 (Option B): runs the same text path. Real audio
 * streaming via OpenAI Realtime is deferred to B2.
 */

import { createJeffreySession } from '@aissisted/jeffrey';
import type { CapturedResponse, CaseMetrics, EvalCase, SyntheticPersona } from './types.js';
import { seedPersona, makeEvalMemoryAdapter } from './setup.js';

export async function executeCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  // Seed is idempotent — safe to call per case.
  await seedPersona(persona);

  try {
    if (evalCase.channel === 'voice') {
      return await executeVoiceCase(evalCase, persona);
    }
    return await executeTextCase(evalCase, persona);
  } finally {
    // Don't clear between cases of the same persona — let the suite reuse
    // seeded state across cases. Bulk cleanup happens at suite teardown.
  }
}

async function executeTextCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  const session = await createJeffreySession({
    surface: 'health',
    userId: persona.user.userId,
    memoryAdapter: makeEvalMemoryAdapter(persona),
  });

  const turn = await session.ask(evalCase.input);

  const turnMetrics: CaseMetrics = {
    firstTokenLatencyMs: turn.timing.llmMs,
    totalLatencyMs: turn.timing.totalMs,
    inputTokens: turn.cost.promptTokens,
    outputTokens: turn.cost.completionTokens,
    costUsd: turn.cost.usd ?? 0,
    toolCallCount: 0, // B1: no tool calls wired
  };

  return {
    text: turn.reply.text,
    toolCalls: [],            // B1: tool calling not yet wired
    auditEntriesWritten: [], // B1: audit instrumentation not yet wired
    memoryWritesAttempted: [], // B1: memory write capture not yet wired
    turnMetrics,
  };
}

async function executeVoiceCase(
  evalCase: EvalCase,
  persona: SyntheticPersona,
): Promise<CapturedResponse> {
  // B1 Option B: simulate voice by running the text path.
  // Real audio streaming (OpenAI Realtime) is deferred to B2.
  // firstAudioLatencyMs will be absent; firstTokenLatencyMs is the proxy.
  return executeTextCase(evalCase, persona);
}
