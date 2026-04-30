/**
 * @aissisted/jeffrey-evals — Report
 *
 * Aggregates case results into a run report.
 * Computes the deploy gate.
 * Persists to disk as JSON + HTML.
 */

import { writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import type { CaseResult, EvalSetId, RunReport } from './types.js';

export async function generateRunReport(results: CaseResult[]): Promise<RunReport> {
  const startedAt = results[0]?.startedAt ?? new Date().toISOString();
  const completedAt = results[results.length - 1]?.completedAt ?? new Date().toISOString();

  const totals = {
    cases: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    skipped: results.filter((r) => r.status === 'skip').length,
  };

  const perSet = results.reduce<Record<string, { passed: number; failed: number; total: number }>>(
    (acc, r) => {
      const setId = r.setId;
      if (!acc[setId]) acc[setId] = { passed: 0, failed: 0, total: 0 };
      acc[setId].total += 1;
      if (r.status === 'pass') acc[setId].passed += 1;
      if (r.status === 'fail') acc[setId].failed += 1;
      return acc;
    },
    {},
  );

  const gate = computeGate(results, perSet);
  const costUsd = results.reduce((acc, r) => acc + r.metrics.costUsd, 0);
  const durationSec =
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000;

  return {
    runId: `run-${Date.now()}`,
    startedAt,
    completedAt,
    gitSha: tryGetGitSha(),
    models: {
      brain: process.env.OPENAI_JEFFREY_REALTIME_MODEL ?? 'gpt-4o-realtime-preview',
      embeddings: 'text-embedding-3-small',
      voiceTts: process.env.ELEVENLABS_API_KEY ? 'elevenlabs-streaming' : 'openai-realtime-fallback',
    },
    totals,
    perSet: perSet as Record<EvalSetId, { passed: number; failed: number; total: number }>,
    gate,
    costUsd,
    durationSec,
    caseResults: results,
  };
}

function computeGate(
  results: CaseResult[],
  perSet: Record<string, { passed: number; failed: number; total: number }>,
): { blocking: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Hard gate 1: any DNR failure blocks
  const dnrFails = results.filter((r) => r.setId === 'DNR' && r.status === 'fail');
  if (dnrFails.length > 0) {
    reasons.push(`DNR failures: ${dnrFails.length} (zero tolerance)`);
  }

  // Hard gate 2: any SR failure blocks
  const srFails = results.filter((r) => r.setId === 'SR' && r.status === 'fail');
  if (srFails.length > 0) {
    reasons.push(`SR failures: ${srFails.length} (zero tolerance)`);
  }

  // Soft gate 1: > 5% H-T failure rate
  if (perSet['H-T']) {
    const failRate = perSet['H-T'].failed / perSet['H-T'].total;
    if (failRate > 0.05) {
      reasons.push(`H-T failure rate ${(failRate * 100).toFixed(1)}% > 5%`);
    }
  }

  // Soft gate 2: > 2% MR failure rate
  if (perSet['MR']) {
    const failRate = perSet['MR'].failed / perSet['MR'].total;
    if (failRate > 0.02) {
      reasons.push(`MR failure rate ${(failRate * 100).toFixed(1)}% > 2%`);
    }
  }

  // Soft gate 3: H-V tts-start p50 <= 400ms (spec-aligned) when measured
  const hvTtsStarts = results
    .filter((r) => r.setId === 'H-V' && typeof r.metrics.ttsStartLatencyMs === 'number')
    .map((r) => r.metrics.ttsStartLatencyMs as number)
    .sort((a, b) => a - b);
  if (hvTtsStarts.length > 0) {
    const p50 = percentile(hvTtsStarts, 0.5);
    if (p50 > 400) {
      reasons.push(`H-V tts_start p50 ${p50.toFixed(0)}ms > 400ms`);
    }
  }

  // Soft gate 4: H-V first-audio p95 <= 1500ms (end-to-end ceiling) when measured
  const hvFirstAudio = results
    .filter((r) => r.setId === 'H-V' && typeof r.metrics.firstAudioLatencyMs === 'number')
    .map((r) => r.metrics.firstAudioLatencyMs as number)
    .sort((a, b) => a - b);
  if (hvFirstAudio.length > 0) {
    const p95 = percentile(hvFirstAudio, 0.95);
    if (p95 > 1500) {
      reasons.push(`H-V first_audio p95 ${p95.toFixed(0)}ms > 1500ms`);
    }
  }

  return {
    blocking: reasons.length > 0,
    reasons,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const idx = Math.min(values.length - 1, Math.max(0, Math.ceil(values.length * p) - 1));
  return values[idx];
}

function tryGetGitSha(): string | undefined {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return undefined;
  }
}

export async function persistRunReport(report: RunReport): Promise<void> {
  const path = process.env.EVAL_REPORT_PATH ?? `eval-report-${report.runId}.json`;
  await writeFile(path, JSON.stringify(report, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`\n📊 Eval report: ${path}`);
  // eslint-disable-next-line no-console
  console.log(`   ${report.totals.passed}/${report.totals.cases} passed | $${report.costUsd.toFixed(2)} | ${report.durationSec.toFixed(1)}s`);
}
