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

  return {
    blocking: reasons.length > 0,
    reasons,
  };
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
