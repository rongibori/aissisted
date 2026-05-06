# Working in this repo (for Claude sessions)

## Canonical path — read before any work

**Canonical:** `/Users/rongibori/aissisted` — all builds, deploys, PRs, and edits happen here.
**Retired:** `/Users/rongibori/Documents/GitHub/aissisted` — iCloud-synced, awaiting archive. Do not work from this path.

This reverses the protocol that was in place before 2026-05-05. The retired clone lives under `~/Documents/`, which is iCloud Drive's domain on this machine — Git objects intermittently materialize as `.icloud` placeholders, breaking commits, fsck, and worktree operations. The salvage operation on 2026-05-05 moved canonical status to `~/aissisted` (not iCloud-synced) and preserved 16 salvage branches on `origin` covering all unpushed work from the retired clone.

**Authoritative markers:**
- `/Users/rongibori/aissisted/.canonical` — declares this path canonical.
- `/Users/rongibori/Documents/GitHub/aissisted/.canonical` — self-identifies as RETIRED, points here.
- `/Users/rongibori/SALVAGE_REPORT_2026-05-05.md` — full audit trail of the reversal.

If you're a Claude session spawned at `/Users/rongibori/Documents/GitHub/aissisted`: **stop.** Re-spawn at `/Users/rongibori/aissisted`. Don't push from the retired clone.

## Quick orientation

- Monorepo: `apps/api` (Fastify), `apps/web` (authenticated product), `apps/site` (**soft-retired 2026-05-05** — see `apps/site/RETIRED.md`), `apps/landing` (canonical consumer site, live at aissisted.me), `packages/brand` (design tokens + primitives, still active).
- Brand Bible v1.1 is canon. Rally cry: "Your Body. Understood." Palette 70/20/8/2 white / black `#1C1C1E` / red `#EE2B37` / navy `#0B1D3A`. Butler-cadence tone. Forbidden-words list in `lib/brand-rules.ts` — keep at 0 hits.
- Jeffrey persona: in-product conversational layer. Voice modal prompts at `jeffrey/CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md`. Separate from the `jeffrey-investor-site` slide deck repo.
- v2 canon: Morning / Day / Night Formulas, Architecture A, $69 / $99 / $149 pricing, freemium platform.

## Before you push

1. Confirm you're in `/Users/rongibori/aissisted` (`pwd`) — the canonical clone since 2026-05-05
2. `git fetch origin && git status` — confirm your branch is current
3. Forbidden-words scan if you touched copy
4. If your branch is downstream of M1/M2/PR #60 work, rebase don't merge — keep history linear
