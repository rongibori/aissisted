# apps/site — RETIRED

**Status:** Soft-retired 2026-05-05.

**Canonical site going forward:** `apps/landing/` (live at https://www.aissisted.me/).

## What this means

- This app is **not under active development**.
- Vercel auto-deploys for this project are **disabled**.
- The merged work (M1 scaffold, M2 design system, M3 content fill across `/`, `/morning`, `/day`, `/night`, `/pricing`, `/jeffrey`, `/how-it-works`, `/science`, `/faq`, `/about`, `/legal/*`) **stays in the repo for reference**.
- `packages/brand` is **not retired** — it remains the canonical design system, usable by `apps/landing` or any future surface.

## Why retired

`apps/landing/` was deployed first as the consumer waitlist landing and proved to be the right canonical surface. `apps/site/` ended up as parallel multi-page marketing infrastructure that duplicated intent without earning its keep against the simpler single-page direction.

## If you want to revive

- The full M1+M2+M3 commit history is on `origin/main`
- Last meaningful commit on this app: see `git log --oneline -- apps/site/`
- Re-enable Vercel auto-deploy in the dashboard if needed
- Decide first whether to revive in place or migrate the content into `apps/landing`

## Do NOT

- Do not delete `apps/site/` or its files. Keep for reference and potential revival.
- Do not assume anything in `apps/site/` is current — check `git log` before trusting code patterns.
- Do not ship new pages into `apps/site/`. Ship into `apps/landing/` instead.
