# @aissisted/jeffrey-evals

Synthetic test cohort + regression suite for Jeffrey. Drops into the existing monorepo as a workspace package.

---

## What this is

- **10-persona synthetic cohort** that exercises every code path in the protocol engine, safety pack, memory, and Jeffrey's reasoning.
- **8 eval sets** with ~250 cases total (full-case + stub) covering happy path, refusals, memory recall, trend interpretation, proactive triggers, brand voice, and safety rules.
- **Vitest-based runner** that drops into the existing test infrastructure with no new framework dependencies.
- **Deploy gate logic** — DNR + SR are zero-tolerance; H-T and MR have soft thresholds.

## Why this exists

Three reasons:
1. **Safety insurance.** Every Jeffrey-touching change must pass DNR + SR before shipping.
2. **Brand consistency.** Brand voice scored on every response, every set.
3. **Pre-beta confidence.** Roadmap §9 (private beta gate) requires evidence Jeffrey works across realistic users — not just whoever dogfooded that day.

## How to use it

### Add to the workspace

Drop this folder at `packages/jeffrey-evals/`. The `pnpm-workspace.yaml` already globs `packages/*` so it picks up automatically.

```bash
pnpm install
```

### Wire to the actual Jeffrey

The runner has TODOs marked `// TODO(integration):` in three files:
- `src/setup.ts` — DB seeding via `@aissisted/db`
- `src/execute.ts` — invoking Jeffrey via `@aissisted/jeffrey/bridge`
- `src/score.ts` — LLM-as-judge scoring via OpenAI

Implementation effort: ~1 day for an engineer who knows the codebase. The structure is in place; the integration is fill-in-the-blank.

### Run

```bash
# Full suite (CI default — ~$3-4 per run)
pnpm --filter @aissisted/jeffrey-evals test

# Fast subset (every 5th case in each set — ~$0.40 per run)
EVAL_FAST=1 pnpm --filter @aissisted/jeffrey-evals test

# Specific set
EVAL_SETS=DNR,SR pnpm --filter @aissisted/jeffrey-evals test

# Specific case (during debugging)
pnpm --filter @aissisted/jeffrey-evals test -- -t "DNR-009"
```

### CI integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Jeffrey Evals (fast subset)
  run: pnpm --filter @aissisted/jeffrey-evals test
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_EVALS }}
    EVAL_FAST: 1

# Full suite as a separate workflow on PR-to-main
```

Use a **separate** OpenAI API key for evals so cost is attributable.

## Cohort overview

| ID | Persona | Stress test |
|---|---|---|
| C-01 | Marcus Tan | Baseline happy path |
| C-02 | Priya Mehta | Multi-source data, complex requests |
| C-03 | Laura Chen | Lapsed engagement, churn signals |
| C-04 | David Reyes | Drug interactions, medication-advice bait |
| C-05 | Chloe Okafor | Empty-state, light data |
| C-06 | James Whitfield | Polypharmacy, multi-condition |
| C-07 | Sarah Kim | Lactation contraindications |
| C-08 | Anonymous-08 | Sensitive history, escalation |
| C-09 | Robert Park | Cancer history, immune contraindications |
| C-10 | Test-Adversary | Safety rail integrity |

All profiles are fictional. See `cohort/manifest.json` for full details.

## Eval sets

| ID | Set | Cases | Gate |
|---|---|---|---|
| H-T | Happy Path — Text | 30 (10 written + 20 stubs) | < 5% fail |
| H-V | Happy Path — Voice | 15 (subset of H-T) | < 10% latency regression |
| DNR | Do-Not-Respond | 40 (15 written + 25 stubs) | **0 fails (zero tolerance)** |
| MR | Memory Recall | 25 (10 written + 15 stubs) | < 2% fail |
| TI | Trend Interpretation | 20 (3 written + 17 stubs) | < 10% fail |
| PT | Proactive Triggers | 15 (5 written + 10 stubs) | < 10% fail |
| BV | Brand Voice | (rubric overlay on all sets) | scored on every response |
| SR | Safety Rule Coverage | ~80 (10 written + expansion) | **0 fails (zero tolerance)** |

The "stubs" are intentional — they reserve the case ID and topic so they can be authored without renumbering. Authoring effort: ~5 minutes per stub.

## What's not in v1

Per the spec doc:
- Multi-turn conversation evals
- Automated adversarial fuzz
- Cohort A/B comparison between Jeffrey versions
- Real-user replay (waits for production data + consent posture)

## Cost expectations

Per full run (when fully wired): ~$3.50–4.00.
Fast subset (every 5th case): ~$0.40.
LLM-judge cost: ~$0.50 of the full run.

## File structure

```
packages/jeffrey-evals/
├── package.json
├── README.md (this file)
├── docs/
│   └── JEFFREY_EVAL_SYSTEM_SPEC.md
├── cohort/
│   ├── manifest.json
│   └── profiles/
│       ├── C-01-marcus.json
│       ├── C-04-david.json
│       ├── C-10-adversary.json
│       └── ... (7 more)
├── eval-sets/
│   ├── happy-path-text.json
│   ├── do-not-respond.json
│   ├── memory-recall.json
│   ├── trend-interpretation.json
│   ├── proactive-triggers.json
│   ├── brand-voice-rubric.json
│   └── safety-rule-coverage.json
└── src/
    ├── jeffrey.eval.test.ts        # Vitest entry
    ├── types.ts
    ├── setup.ts                     # DB seed (TODO: integrate)
    ├── execute.ts                   # Drive Jeffrey (TODO: integrate)
    ├── score.ts                     # Scorer + LLM-as-judge (TODO: integrate)
    ├── fixtures.ts                  # Loader
    └── report.ts                    # Report + gate
```

## Next steps

1. Drop this package into `packages/jeffrey-evals/` and run `pnpm install`.
2. Wire the three `TODO(integration)` blocks (~1 day for someone who knows `@aissisted/jeffrey`).
3. Run the full suite once locally — fix any issues with the wiring.
4. Author the stubs (~5 min each — split across the team or a single afternoon).
5. Add the fast subset to CI on every PR.
6. Add the full suite as a workflow that runs on PR-to-main.

After that, the suite should be self-sustaining.
