# Working in this repo (for Claude sessions)

## Two-clone protocol — read before any push

Ron keeps two local clones of `rongibori/aissisted` on this machine:

| Path | Role |
|---|---|
| `/Users/rongibori/Documents/GitHub/aissisted` | **Canonical / push environment.** Mirrors `origin/main`. All PRs ship from here. Treat as source of truth. |
| `/Users/rongibori/aissisted` | Local dev / scratch. In-progress work, experiments. Sync to canonical via PR before discarding. |

**Git does not enforce this** — both clones share `origin` and both can push. The protocol exists by convention only. If you're a Claude session spawned at `/Users/rongibori/aissisted` and you're about to open a PR, **stop and confirm with Ron first**. Migrate the work to the canonical clone before pushing.

If you're spawned at `/Users/rongibori/Documents/GitHub/aissisted`: you're in the right place. Proceed.

## Quick orientation

- Monorepo: `apps/api` (Fastify), `apps/web` (authenticated product), `apps/site` (**soft-retired 2026-05-05** — see `apps/site/RETIRED.md`), `apps/landing` (canonical consumer site, live at aissisted.me), `packages/brand` (design tokens + primitives, still active).
- Brand Bible v1.1 is canon. Rally cry: "Your Body. Understood." Palette 70/20/8/2 white / black `#1C1C1E` / red `#EE2B37` / navy `#0B1D3A`. Butler-cadence tone. Forbidden-words list in `lib/brand-rules.ts` — keep at 0 hits.
- Jeffrey persona: in-product conversational layer. Voice modal prompts at `jeffrey/CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md`. Separate from the `jeffrey-investor-site` slide deck repo.
- v2 canon: Morning / Day / Night Formulas, Architecture A, $69 / $99 / $149 pricing, freemium platform.

## Before you push

1. Confirm you're in `/Users/rongibori/Documents/GitHub/aissisted` (`pwd`)
2. `git fetch origin && git status` — confirm your branch is current
3. Forbidden-words scan if you touched copy
4. If your branch is downstream of M1/M2/PR #60 work, rebase don't merge — keep history linear
