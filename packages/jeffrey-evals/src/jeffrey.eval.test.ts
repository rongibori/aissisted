/**
 * @aissisted/jeffrey-evals — Vitest entry point
 *
 * Drops into the existing api workspace's vitest config or runs as its own package.
 * Each eval set is exposed as a describe block with one test per case.
 *
 * Implementation notes:
 * - The actual driving of Jeffrey is left as TODOs because it needs to import from
 *   @aissisted/jeffrey directly. Wire those in once this package is added to the
 *   workspace and the import paths resolve.
 * - The test DB setup uses an in-memory SQLite by default (matching .env.example).
 *   Switch to a Postgres test container when pgvector is added.
 */

import { describe, test, beforeAll, afterAll, expect } from 'vitest';
import type {
  CaseResult,
  EvalCase,
  EvalRunnerOptions,
  EvalSetId,
  RunReport,
  SyntheticPersona,
} from './types.js';
import { setupTestEnv, teardownTestEnv } from './setup.js';
import { executeCase } from './execute.js';
import { scoreCase } from './score.js';
import { generateRunReport, persistRunReport } from './report.js';
import { loadCohort, loadEvalSet } from './fixtures.js';

const SETS_TO_RUN: EvalSetId[] = (
  process.env.EVAL_SETS?.split(',') as EvalSetId[]
) ?? ['H-T', 'DNR', 'MR', 'TI', 'PT', 'SR'];

const FAST = process.env.EVAL_FAST === '1';

let cohort: SyntheticPersona[] = [];
const allResults: CaseResult[] = [];

beforeAll(async () => {
  await setupTestEnv();
  cohort = await loadCohort();
}, 60_000);

afterAll(async () => {
  // Aggregate report — failures here don't fail the suite, but the gate logic does.
  const report = await generateRunReport(allResults);
  await persistRunReport(report);
  if (report.gate.blocking) {
    // eslint-disable-next-line no-console
    console.error('\n❌ EVAL GATE: BLOCKED');
    for (const reason of report.gate.reasons) {
      // eslint-disable-next-line no-console
      console.error(`   • ${reason}`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('\n✅ EVAL GATE: PASSED');
  }
  await teardownTestEnv();
}, 60_000);

for (const setId of SETS_TO_RUN) {
  describe(`Eval Set: ${setId}`, async () => {
    const cases = await loadEvalSet(setId);
    const filtered = FAST ? cases.filter((_, i) => i % 5 === 0) : cases;

    for (const evalCase of filtered) {
      // Skip stubs — they're placeholders awaiting input authoring
      if (evalCase.stub) continue;

      test(`${evalCase.id} — ${evalCase.input.slice(0, 60)}…`, async () => {
        const persona = cohort.find((p) => p.id === evalCase.personaId);
        if (!persona) {
          throw new Error(`Persona ${evalCase.personaId} not found in cohort`);
        }

        // 1. Execute Jeffrey against the case (TODO in execute.ts)
        const captured = await executeCase(evalCase, persona);

        // 2. Score the response
        const result = await scoreCase(evalCase, persona, captured);
        allResults.push(result);

        // 3. Hard pass/fail assertion
        if (result.hardFails.length > 0) {
          throw new Error(
            `Hard fails for ${evalCase.id}:\n  - ${result.hardFails.join('\n  - ')}`,
          );
        }

        // 4. Quality gate (3+ to pass)
        expect(result.qualityScore).toBeGreaterThanOrEqual(3);

        // 5. Brand voice gate (3+ to pass)
        expect(result.brandVoiceScore).toBeGreaterThanOrEqual(3);
      }, 30_000);
    }
  });
}
