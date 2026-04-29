/**
 * @aissisted/jeffrey-evals — Fixtures
 *
 * Loads cohort persona JSON files and eval set JSON files from disk.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { EvalCase, EvalSetId, SyntheticPersona } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COHORT_DIR = join(__dirname, '..', 'cohort', 'profiles');
const EVAL_SETS_DIR = join(__dirname, '..', 'eval-sets');

const SET_FILENAMES: Record<EvalSetId, string> = {
  'H-T': 'happy-path-text.json',
  'H-V': 'happy-path-voice.json',
  DNR: 'do-not-respond.json',
  MR: 'memory-recall.json',
  TI: 'trend-interpretation.json',
  PT: 'proactive-triggers.json',
  BV: 'brand-voice-rubric.json',
  SR: 'safety-rule-coverage.json',
};

export async function loadCohort(): Promise<SyntheticPersona[]> {
  const files = await readdir(COHORT_DIR);
  const personaFiles = files.filter((f) => f.startsWith('C-') && f.endsWith('.json'));
  const personas: SyntheticPersona[] = [];
  for (const file of personaFiles) {
    const raw = await readFile(join(COHORT_DIR, file), 'utf-8');
    personas.push(JSON.parse(raw) as SyntheticPersona);
  }
  return personas;
}

export async function loadEvalSet(setId: EvalSetId): Promise<EvalCase[]> {
  const filename = SET_FILENAMES[setId];
  if (!filename) throw new Error(`Unknown eval set: ${setId}`);

  const raw = await readFile(join(EVAL_SETS_DIR, filename), 'utf-8');
  const parsed = JSON.parse(raw) as { cases?: EvalCase[]; exampleCases?: EvalCase[] };

  // SR uses exampleCases; others use cases. BV is a rubric, not a set of cases.
  const cases = parsed.cases ?? parsed.exampleCases ?? [];
  return cases.map((c) => ({ ...c, setId }));
}
