# Slice `design-system-v0.1` into 4 PRs

**Date:** 2026-05-06
**Author:** planning session (ron + claude)
**Status:** Approved — pending slice execution in follow-up session
**Source branch:** `design-system-v0.1` (25 commits ahead of `main`)

---

## Context

`design-system-v0.1` is 25 commits ahead of `main`, +11,766/-6,282 across 70 files. The `STATE_OF_WORLD_2026-05-06.md` synthesis identifies it as the highest-value unmerged work in the repo (Phase α design system, Brand v2.1, JeffreyAvatar, onboarding Surfaces 1+2, jeffrey-evals B1 + 17-persona cohort, path-enforcement hook).

A single PR of this size won't get a quality review — slicing into 4 logically coherent PRs lets each one be reviewed and merged on its own merits. This doc groups commits, surfaces cross-cutting dependencies, and prescribes a merge order. It does **not** perform the actual slicing — that happens in a follow-up session.

---

## Branch state at planning time

- Source branch: `design-system-v0.1` @ HEAD `77f8afc`
- Total: **25 commits, 70 files, +11,766 / -6,282**

Full chronological commit list (`git log main..design-system-v0.1 --reverse`):

```
f237b8c feat(jeffrey-evals): add synthetic test cohort + eval suite                   (21 files, +3868)
19e6d8c refactor(jeffrey-evals): restructure to monorepo conventions                  (18 files, +48/-4)
0fdd135 feat(jeffrey): B1 bridge observability — CapturedTurnResult                   (6  files, +77/-11)    ← cross-cutting (apps/api, apps/site, packages/jeffrey)
4682a00 feat(jeffrey-evals): wire setup.ts — fixture-backed memory adapter (B1)       (1  file,  +84/-58)
46fdb49 feat(jeffrey-evals): wire execute.ts + score.ts (B1)                          (3  files, +42/-68)
ae78164 feat(jeffrey-evals): finish B1 — DNR/SR drafts, soft gates, fast subset       (6  files, +433/-132)
8c071c3 chore(jeffrey-evals): gitignore eval runner runtime artifacts                 (1  file,  +8)
05aba61 docs(jeffrey): resolve G-06 — British premium register into voice spec        (1  file,  +1/-5)
ca464d6 fix(jeffrey-evals): G-16 report.ts:47 uses text-channel model env var         (1  file,  +1/-1)
830e5c5 feat(jeffrey-evals): expand cohort to 17 personas + voice eval set + manifest (17 files, +1283/-10)
598241b fix(jeffrey-evals): add ttsStartLatencyMs to CaseMetrics + voice_jeffrey      (1  file,  +8/-1)
8126897 Phase α: design-system foundation — DTCG tokens, design spec, Figma+Cowork    (4  files, +1410)
9e321eb feat(web): onboarding cover surface — canon-aligned                           (6  files, +511/-381)
71bbe80 feat(web): onboarding cover surface — supporting files                        (5  files, +240/-6)
b8844a2 docs: Phase α deliverables — design system foundation, specs, infra skeleton  (6  files, +2561)
aa42fb1 brief: cowork brief for Surface 2 (Jeffrey introduction)                      (1  file,  +316)
4a0f29c feat(web): onboarding Surface 2 (Jeffrey intro) + Figma workspace handoff     (8  files, +622/-18)
ac94da4 feat(ui): JeffreyAvatar — voice-pattern indicator with state machine          (3  files, +221/-20)   ← cross-cutting (modifies files from 4a0f29c)
6fed8c4 brand(canon): v2.1 — Signal Red promoted from accent to identity color        (2  files, +18/-9)     ← cross-cutting (modifies file from 8126897)
b0bc3e6 docs: map existing codebase                                                   (7  files, +2184)
27c3bb0 chore: gitignore .claude/; import figma-foundation-builder + superpowers plan (5  files, +3799)
25b8b52 chore: rewrite .canonical — ~/aissisted is canonical, iCloud copy retired     (1  file,  +5/-4)
6b8df0d chore: restore voice-deploy + key-rotation scripts from salvage               (2  files)
da187c1 chore: ensure all .env file patterns are gitignored                           (1  file)
77f8afc chore: add path-enforcement pre-commit hook                                   (1  file,  +34)
```

---

## Cross-cutting concerns

| Commit | Issue | Resolution |
| --- | --- | --- |
| `6fed8c4` | Modifies `docs/design-system/aissisted-design-spec.md` first added in `8126897`. | Both ride together in **PR-A**. ✅ Clean. |
| `9e321eb`, `4a0f29c` | `apps/web/app/globals.css` and `apps/web/app/onboarding/animations.css` reference token classes seeded by `8126897`. | **PR-C** must merge after **PR-A**. ✅ Sequential merge order. |
| `ac94da4` | Modifies `apps/web/components/ui/JeffreyAvatar.tsx` and `apps/web/components/onboarding/JeffreyIntroSurface.tsx` — both **first created** in `4a0f29c`. | **PR-B (JeffreyAvatar refinement) must merge after PR-C, not before.** Inverts the bottom-up "components before flows" intuition. |
| `0fdd135` | Touches `apps/api`, `apps/site`, `packages/jeffrey` — outside the design-system area but is the bridge plumbing the eval runner depends on. | Travels in **PR-D** with the eval suite that consumes it. ✅ |
| `pnpm-lock.yaml` | Touched in `19e6d8c`, `9e321eb`, `ae78164`. | Re-resolve at slice time per PR; conflicts unlikely (separate package trees). |
| `b8844a2` | +2,561 lines of specs + AWS infra skeleton, only loosely related to design-system. | Folded into **PR-D** as "infrastructure & docs"; separable as PR-D2 if reviewers want. |

### Resolution for the JeffreyAvatar dependency

**Option 1 (chosen):** Reorder merge sequence to `A → C → B → D`. PR-B becomes a small follow-up polish PR. The state-machine refinement is the *interesting* visual work; the initial avatar drop in PR-C is mostly scaffolding. No commit splitting required.

**Option 2 (rejected):** Use `git rebase -i` to **split `4a0f29c`** so the new UI primitives (`JeffreyAvatar.tsx`, `CodeComment.tsx`, `PreLabel.tsx`, `TextLink.tsx`) move into PR-B and the surface page (`JeffreyIntroSurface.tsx`, `page.tsx`, `animations.css`, `figma-handoff.md`) stays in PR-C. Adds ~30 minutes of surgery and risks breaking the standalone build of either PR.

---

## Final 4-PR slice

### PR-A — Brand foundation: design tokens + Signal Red v2.1

**Risk:** Lowest. Pure additions to `packages/brand/` + spec docs.
**Commits (2):**
- `8126897` — Phase α design-system foundation (DTCG tokens, design spec canon, Figma+Cowork setup, first cowork brief)
- `6fed8c4` — Brand v2.1: Signal Red promoted to identity color

**Files (5):**
- `packages/brand/aissisted-tokens.json` (new)
- `packages/brand/tokens.css` (modified)
- `docs/design-system/aissisted-design-spec.md` (new in 8126897, edited in 6fed8c4)
- `docs/design-system/aissisted-figma-cowork-setup.md` (new)
- `cowork-briefs/onboarding-cover.md` (new)

**Reviewer focus:** token naming + DTCG schema, brand canon coherence.
**CI checks:** `pnpm -r build` should remain green; tokens are pure data.

---

### PR-C — Onboarding Surfaces 1 + 2 (with UI primitives & initial JeffreyAvatar drop)

**Risk:** Medium. Touches `apps/web` runtime + adds ~7 new components.
**Depends on:** PR-A (consumes tokens via `globals.css`).
**Commits (4):**
- `9e321eb` — Cover surface canon-aligned
- `71bbe80` — Cover surface supporting files (layout, PhoneFrame, StatusBar, PillCTA)
- `aa42fb1` — Cowork brief for Surface 2 (docs only)
- `4a0f29c` — Surface 2 (Jeffrey intro) + initial JeffreyAvatar/CodeComment/PreLabel/TextLink

**Files (~15):**
- `apps/web/app/{globals.css, layout.tsx, onboarding/page.tsx, onboarding/animations.css}`
- `apps/web/components/onboarding/{CoverSurface, JeffreyIntroSurface}.tsx`
- `apps/web/components/patterns/{PhoneFrame, StatusBar}.tsx`
- `apps/web/components/ui/{PillCTA, JeffreyAvatar, CodeComment, PreLabel, TextLink}.tsx`
- `apps/web/{package.json, postcss.config.mjs}`, `pnpm-lock.yaml` (subset)
- `cowork-briefs/jeffrey-intro.md`, `docs/design-system/aissisted-figma-handoff.md`

**Reviewer focus:** SSR safety, font-stack + token usage, animation smoke (memory note S37: no `next/font` imports — flag if reviewers expect them).
**Verification:** `pnpm -F @aissisted/web dev` → load `localhost:3000/onboarding`; confirm both surfaces render; HTTP 200; visual regression ok.

---

### PR-B — JeffreyAvatar voice-pattern state machine

**Risk:** Low. Component-internal refinement, no API surface change.
**Depends on:** PR-C (modifies files PR-C introduced).
**Commits (1):**
- `ac94da4` — JeffreyAvatar voice-pattern indicator with state machine

**Files (3):**
- `apps/web/components/ui/JeffreyAvatar.tsx` (modified)
- `apps/web/components/ui/jeffrey-avatar.css` (new)
- `apps/web/components/onboarding/JeffreyIntroSurface.tsx` (modified)

**Reviewer focus:** state-machine transitions (`idle | listening | thinking | speaking`), CSS animation perf, accessibility (`prefers-reduced-motion`).
**Verification:** load `/onboarding` Surface 2, exercise each state via local toggles or test harness; confirm no jank.

---

### PR-D — Eval suite (B1 + 17-persona cohort) + bridge observability + repo infra

**Risk:** Medium-high — largest PR, but conceptually isolated from user-facing surfaces. Reviewers can split if they prefer (sub-buckets called out below).
**Depends on:** none (independent of A/B/C); can be reviewed in parallel with PR-A.
**Commits (18):**

*Eval suite + bridge (12 commits):*
- `f237b8c` — Initial cohort + eval suite scaffold
- `19e6d8c` — Restructure to monorepo conventions
- `0fdd135` — B1 bridge observability (`CapturedTurnResult`) — cross-cutting into `apps/api`, `apps/site`, `packages/jeffrey`
- `4682a00` — Wire `setup.ts` (fixture-backed memory adapter)
- `46fdb49` — Wire `execute.ts` + `score.ts`
- `ae78164` — Finish B1 (DNR/SR drafts, soft gates, fast subset wiring)
- `8c071c3` — Gitignore eval runner runtime artifacts
- `05aba61` — Voice spec G-06 (British premium register absorbed into §8.1)
- `ca464d6` — G-16 fix: `report.ts:47` uses text-channel model env var
- `830e5c5` — Expand cohort to 17 personas + voice eval set + manifest sync
- `598241b` — Add `ttsStartLatencyMs` to `CaseMetrics` + `voice_jeffrey` to `Channel`

*Specs + infra docs (1 commit):*
- `b8844a2` — Phase α deliverables: `AISSISTED_BETA_LAUNCH_PLAN_v1.md`, `JOURNAL_AND_ANALYTICS_SPEC_V1.md`, `LAB_INGESTION_SPEC_V1.md`, `SECURITY_AND_COMPLIANCE_V1.md`, `infra/aws/{BOOTSTRAP,README}.md`

*Codebase mapping + repo hygiene (6 commits):*
- `b0bc3e6` — Map existing codebase (`.planning/codebase/{ARCHITECTURE,CONCERNS,CONVENTIONS,INTEGRATIONS,STACK,STRUCTURE,TESTING}.md`)
- `27c3bb0` — Gitignore `.claude/`; import `tools/figma-foundation-builder/` + `docs/superpowers/plans/2026-05-03-aissisted-live-demo.md`
- `25b8b52` — Rewrite `.canonical` (~/aissisted canonical, iCloud retired)
- `6b8df0d` — Restore `jeffrey-voice-deploy.command` + `paste-key-and-deploy.command` from salvage
- `da187c1` — Ensure all `.env` patterns gitignored
- `77f8afc` — Path-enforcement pre-commit hook (`scripts/git-hooks/pre-commit`)

**Reviewer focus:** Bridge type contract (`CapturedTurnResult` shape), eval scoring rubric, persona coverage, `.gitignore` correctness for `.env`/`.claude/`, hook script soundness (location-based, blocks iCloud paths + non-canonical roots).
**Verification:**
- `pnpm -F @aissisted/jeffrey-evals test` (or configured runner script) — confirm B1 fast-subset green
- Probe-commit from a non-canonical path (e.g. `/tmp/probe`) to confirm the hook blocks
- `git check-ignore` against representative `.env*` and `.claude/*` paths

**Sub-bucket fallback (if reviewers find PR-D too large):**
- **PR-D1:** Eval suite + bridge observability (12 commits above)
- **PR-D2:** Specs + infra + repo hygiene (7 commits: `b8844a2`, `b0bc3e6`, `27c3bb0`, `25b8b52`, `6b8df0d`, `da187c1`, `77f8afc`)

---

## Recommended merge order

**`A → C → B → D`** (with D mergeable in parallel with A as long as B/C aren't blocked).

| Step | PR | Why this position |
| --- | --- | --- |
| 1 | **PR-A** Brand foundation | Lowest risk, defines tokens that PR-C consumes. |
| 2 | **PR-C** Onboarding Surfaces | Adds the surfaces that exercise the tokens; introduces the JeffreyAvatar baseline that PR-B refines. |
| 3 | **PR-B** JeffreyAvatar refinement | Polish on top of PR-C; tiny review. |
| 4 | **PR-D** Evals + bridge + infra | Independent of A/B/C; can land any time after A. Reviewable in parallel. |

If PR-D is split into D1/D2, both can land independently — D1 (evals) gates eval CI, D2 (hygiene) gates the path-enforcement hook for downstream branches.

---

## Locked decisions (planning session, 2026-05-06)

1. **Merge order:** `A → C → B → D` — no commit splitting; PR-B is the small focused refinement.
2. **PR-D size:** keep as **one** PR (18 commits, ~6,300 LoC) — honors the 4-PR scope. Sub-bucket split to D1/D2 only if review feedback demands it.
3. **Branch base:** this plan-doc branch (`chore/design-system-slice-plan`) cut from `design-system-v0.1` (not from `main`) so the path-enforcement hook is active when committing.

---

## Next session — slice execution

Out of scope for this doc. The follow-up session will perform the actual `git rebase --onto` / cherry-pick surgery to materialize PR-A, PR-C, PR-B, PR-D from `design-system-v0.1`, opening each PR against `main` in the order above.
