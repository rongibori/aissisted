# Aissisted — State of the World

**Date:** 2026-05-06
**Operator:** Cowork (synthesis, no code changes)
**Canonical:** `/Users/rongibori/aissisted` · branch `design-system-v0.1`
**Sources:** `docs/roadmap.md` (v3, PR #52), `SALVAGE_REPORT_2026-05-05.md`, `docs/specs/JEFFREY_VOICE_LOCK.md` (v1.1, PR #65), `git log origin/main`, remote branch inventory.

---

## 0. TL;DR

The product is built. The intelligence layer is half-built. The commercial layer is not built. The repo is healthier than it looks: nearly all unpushed work is preserved on origin (16 salvage branches + a 25-commit `design-system-v0.1` lane), and the canonical clone is finally clean.

The bottleneck is **promotion, not creation** — too much value is sitting on branches and salvage refs instead of `main`. The next five missions should drain that backlog in revenue-impact order: ship the design-system lane → close PR #67 (health integration) → deploy → revenue (Stripe) → Intelligence (agent layer).

---

## 1. What's shipped (merged to `origin/main`)

Sequenced newest → oldest. "User-facing capability" is what the merge actually enabled, not what the title says.

### Phase 3 wave — public marketing surface + Jeffrey voice lock (Apr 30 → May 6)

| PR | Date | Capability unlocked |
|---|---|---|
| **#71** chore: soft-retire apps/site | 2026-05-06 | `apps/landing` is now the canonical public surface. `apps/site` deprecated. One marketing surface, not two. |
| **#66** M3 Phase 3 — pricing + jeffrey | 2026-05-05 | Marketing-site `/pricing` and `/jeffrey` pages live. Pricing tiers visible (no checkout yet). |
| **#65** Lock in Jeffrey Voice v1.1 | 2026-05-03 | Cedar voice + temp 0.6 + 1000ms silence + RP British prompt — locked across `apps/landing/server.mjs` and the Vercel function. Voice ratified live by Ron on cloudflared tunnel. |
| **#63** M3 Phase 2 — formula pages | 2026-05-03 | Morning/day/night formula pages on the marketing site. |
| **#62** M3 Phase 1 — shell + homepage | 2026-04-30 | Marketing-site shell + new homepage. |
| **#61** docs: two-clone protocol | 2026-04-30 | CLAUDE.md updated with the two-clone protocol — kept us out of further iCloud trouble. |
| **#60** Jeffrey eval suite + B1 + cohort to 17 | 2026-04-30 | First quantitative measurement of Jeffrey behavior. 17-persona synthetic cohort. Voice eval set. B1 bridge observability. **This is the first real eval gate in the repo.** |

### Phase 2 wave — Jeffrey voice + investor room + provider migration (Apr 19 → 24)

| PR | Date | Capability unlocked |
|---|---|---|
| **#57** apps/landing for aissisted.me | 2026-04-24 | Public marketing site live at `www.aissisted.me`. |
| **#52** roadmap v3 (canonical) | 2026-04-21 | Doc-only — but this is the planning anchor everything else references. |
| **#51** Anthropic rollback retired; protocol synthesis → OpenAI | 2026-04-21 | Single LLM provider for protocol generation. Removes provider sprawl. |
| **#50** Intent parser → OpenAI Haiku replacement | 2026-04-21 | Single LLM provider for intent parsing. |
| **#49** Token polish (Copilot review) | 2026-04-21 | Brand-token hygiene from review threads. |
| **#48** Voice on /chat via JeffreyVoicePanel | 2026-04-21 | Voice modality wired into authenticated `/chat` (not just `/jeffrey-live` demo). |
| **#47** Deploy preflight | 2026-04-21 | CORS allowlist, env.example sync, vercel.json, runbook. **Repo is deploy-ready, not deployed.** |
| **#46** Jeffrey Realtime client + /jeffrey-live | 2026-04-21 | Browser hook + public demo page for voice. |
| **#45** Jeffrey Realtime WS proxy | 2026-04-20 | Backend WS proxy to OpenAI Realtime. The voice spine. |
| **#44** Investor Room v2–v6 cumulative | 2026-04-20 | Lead capture, scoring, email pipeline, allocation urgency, calendar. The investor surface is essentially complete. |
| **#39** Investor Room v1 | 2026-04-20 | Chapter scaffold + live Jeffrey console embedded. |
| **#38** Jeffrey consolidated brain | 2026-04-19 | One canonical `packages/jeffrey` brain, one provider, one key. |
| **#37** Jeffrey scaffold | 2026-04-19 | Operating-intelligence package skeleton. |

### Brand + design-system lane (Apr 17 → 19)

`#36` Milestone 2 design system, `#35` M1 scaffold + `@aissisted/brand`, `#34/#32` Brand Bible v1.1 token migration, `#30` canonical specs commit, plus the v1.0 → v1.1 red swap (`#8A0F1A` → `#EE2B37`). Net effect: the brand is locked, tokens are shared across `apps/site`, `apps/landing`, `apps/web`, and `packages/brand`.

### Foundation merges (Apr 13 → 15)

PRs #1 → #17 — phase-1 through phase-10 infra plus copilot CI fixes. This is the body of Foundation: monorepo, Fastify API, Drizzle DB, Next.js web/site, integrations scaffolds, auth, vitest infrastructure (119 tests), AES-256-GCM token encryption, FHIR Patient demographics, audit logging, longitudinal conditions/medications.

**Total since project start:** ~42 PRs merged to main (25 squash-merges + 17 merge-commits via `git log`). Highest PR number on disk is #71 — the gap is closed-without-merge or superseded PRs. Roadmap-v3 reads "we are not building a product, we are finishing one" — that's accurate.

---

## 2. What's in flight (open / unmerged branches with main-divergent commits)

`gh` is not available in the sandbox; the table below is reconstructed from `git log` and remote-branch divergence. Treat "Open PR?" as a heuristic — Ron should confirm via the GitHub UI.

| Branch | Ahead / Behind main | Last commit | Almost-certainly | What it does | Status |
|---|---|---|---|---|---|
| **`design-system-v0.1`** *(currently checked out)* | **25 / 7** | 2026-05-06 | **Active lane, no PR yet** | Phase α design-system foundation: DTCG tokens, Brand v2.1 (Signal Red promoted to identity), JeffreyAvatar voice-pattern component, onboarding cover Surface 1, onboarding Surface 2 (Jeffrey intro), Figma workspace handoff, jeffrey-evals B1 wiring + 17-persona cohort + voice eval set, gitignore .claude/, figma-foundation-builder tool import, .canonical rewrite, voice-deploy + key-rotation script restore from salvage, .env gitignore hardening, **path-enforcement pre-commit hook (today)**. | **Highest-value unmerged work in the repo. Needs a PR (or a series).** |
| `claude/complete-health-integration-oc4Bi` | 10 / 49 | 2026-05-04 | **Open PR #67** (referenced in salvage report) | "complete-health-integration" — README + DEMO walkthrough rewrite. Likely the cohort/seed/demo polish PR. | **Promotion candidate.** Behind 49 — needs main-merge before review. |
| `feat/m3-phase4-remaining-pages` | 1 / 1 | 2026-05-05 | **Open PR likely** | M3 Phase 4 — how-it-works, science, faq, about, legal pages. Last of the M3 series. | **Ready to merge once reviewed.** Only 1 commit behind. |
| `claude/add-gsd-help-NnImv` | 3 / 2 | 2026-05-05 | Open PR likely | pnpm-lock sync + apps/landing devDependencies fix. Plumbing-grade. | **Quick promotion.** Decide if still needed post-#71. |
| `claude/connect-github-YcvR8` | 1 / 7 | 2026-04-27 | Possibly open | **Agent layer PR 1 — types + state loader scaffold.** This is roadmap item I-1. | **Strategically important — first cut at the orchestrator. Promote or merge into a fresh agent-layer branch.** |
| `claude/implement-onboarding-cover-uqkFR` | 1 / 4 | 2026-05-03 | Stale post-merge | Source branch of PR #65 (Voice Lock). Likely already merged, just not deleted. | **Delete.** |
| `chore/retire-apps-site` | 1 / 1 | 2026-05-06 | Stale post-merge | Source branch of PR #71. | **Delete.** |
| `chore/bump-v0.3.0` | 1 / 2 | — | Stale | Version-bump only. | **Delete or merge as a chore PR.** |
| `feat/postgres-migration` | 17 / 31 | 2026-04-17 | **Stalled** | Postgres migration work (was the working branch behind the Drizzle baseline). Hasn't moved since 2026-04-17. | **Decide: rebase + ship, or close.** |
| `copilot/cleanup-docs-artifacts-postgres-migration` | 2 / 31 | 2026-04-17 | Stalled, child of above | Doc/artifact cleanup tied to postgres-migration. | Same fate as parent. |
| `copilot/fix-database-result-handling` | 2 / 31 | 2026-04-18 | Stalled, child of above | `.rowsAffected` → `.returning()` postgres compat fix. | **Cherry-pick the fix to a fresh branch — it's a real bug fix.** |
| `feat/m3-content-scope` | 1 / 7 | 2026-04-29 | Superseded | Was the planning doc for M3; M3 Phase 1–4 implementation has now run past the scope doc. | **Delete.** |
| `feat/apps-site-milestone-1-scaffold` | 11 / 23 | — | Superseded | Predecessor of #35 (M1 scaffold) and #71 (apps/site retired). | **Delete.** |
| `feat/apps-site-milestone-2-design-system` | 5 / 22 | — | Superseded | Predecessor of #36. | **Delete.** |
| `feat/investor-room-v2 … v5` (4 branches) | 2–5 / 19 | — | Superseded by #44 | Investor-room iteration history; PR #44 cumulatively merged v2–v6. | **Delete all 4.** |
| `screenshots/m3-phase2-formula-pages` | 1 / 138 | — | Stale review aid | Screenshots for #63 review. | **Delete.** |
| `claude-integrations-handoff` | 1 / 85 | — | Stale | Claude super-prompt for MyChart + WHOOP integrations (handoff doc). | Triage: extract content to `docs/`, then delete. |
| `claude/connect-github-eYEXV` | 1 / 49 | — | Stale | Predecessor of #12, #13 (already merged). | **Delete.** |

**Headline take:** the repo has **~20 stale branches** that are merged or superseded but not pruned. Pruning them costs 5 minutes and dramatically clarifies the picture. Three branches matter: `design-system-v0.1` (25 commits unmerged), `claude/complete-health-integration-oc4Bi` (PR #67), and `feat/m3-phase4-remaining-pages` (M3 Phase 4).

---

## 3. What's salvaged but unmerged — the 16 salvage branches

Ranked by "how easy to promote" × "how valuable." All branches are pristine — no rebases, no cherry-picks, content-faithful to the iCloud clone state at recovery time.

### Tier 1 — Promote first (high value, clean to merge)

| Rank | Branch | Tip | Why promote | How |
|---|---|---|---|---|
| **1** | `salvage/jeffrey-ai-system` | `b408c13` | **The biggest unshipped feature on disk.** 12-commit chain: pilot seed → safety pack → adaptive-tuning + memory-lifecycle services → JeffreyAISystem neural viz + NeuralVoiceIndicator → roadmaps/DoD/BAA inventory → seed-pilot DB fixes → SystemSnapshot endpoint → integrations sync-status → orchestrator+safety wired into `/chat` → demo runbook. **Touches roadmap items I-6, I-7, I-14..I-21 directly.** | Open as a stack of small PRs, not one mega-PR. Recommended order: (a) safety pack, (b) memory-lifecycle services, (c) adaptive-tuning, (d) JeffreyAISystem visual layer, (e) orchestrator/safety wiring into /chat, (f) demo runbook. |
| **2** | `salvage/orchestrator` | `bbe929a` | 7-commit clean chain: orchestrator package scaffold + classifier + apps/api endpoints. **This is roadmap items I-1..I-5** (typed orchestrator, intent classifier, state loader, plan builder, executor). | Single PR titled "feat(orchestrator): scaffold + classifier + endpoints (I-1..I-5)". |
| **3** | `salvage/experience-surface` | `ea71445` | Adds `/experience` user-facing surface + 3 tuning passes ("the version I would ship"). Built on top of `salvage/orchestrator`. | Land **after** #2. PR title: "feat(web): /experience surface". |
| **4** | `salvage/deploy-preflight` | `b52fafd` | 3-commit deploy hardening: CORS allowlist + env.example + vercel.json + runbook → access-log redaction + voice/PHI checklist → CORS-isDev docs alignment. Note: PR #47 already shipped *initial* preflight; this is the follow-up tightening. | Diff against `apps/landing/`'s current state first — some may already be in main. PR the delta. |
| **5** | `salvage/jeffrey-realtime-server` | `2e5ed27` | WS proxy server endpoint for Jeffrey Realtime. **Possibly already on main via PR #45.** | Diff against `cb1a61a` (PR #45 merge). If divergent, PR the delta; if identical, delete. |

### Tier 2 — Decide-then-promote (value depends on follow-up choice)

| Rank | Branch | Tip | Why promote (or not) |
|---|---|---|---|
| **6** | `salvage/jeffrey-realtime` | `0efbadf` | Client hook + `/jeffrey-live` demo + AuthProvider prerender fix + Copilot fixes. **Possibly redundant with PR #46.** Diff first, then merge the delta or delete. |
| **7** | `salvage/haiku-to-openai-parser` | `25f2c7c` | Intent-parser migration Haiku → OpenAI. **Almost certainly redundant with PR #50.** Diff and discard if covered. |
| **8** | `salvage/icloud-dirty-20260505` | `1c3143c` | Single salvage commit with: preview.html demo-mode fallback (webkit fallback for `file://`), INVESTOR_DEMO_SCRIPT v0.2 rewrite (3 pitch-length variants tied to deck v3), seed-pilot DB-path fix, .canonical update, **20 .command/.sh scripts at repo root**, `aissisted-app.html` (164 KB), `docs/decks/AISSISTED_Investor_Presentation_Master_v3.md`, `scripts/fix-icloud-dupes.sh`. **Cherry-pick file-by-file** — most of these are useful, but the .command scripts should land in `scripts/` not repo root, and the giant single-file artifact is worth its own decision. |
| **9** | `salvage/pilot-seed` | `a40bcc3` | Already an ancestor of `salvage/jeffrey-ai-system`. Promoted automatically when Tier 1 #1 lands. Don't merge separately. |
| **10** | `salvage/claude-md-protocol` | `64a2c23` | Single commit: two-clone protocol added to CLAUDE.md. **Possibly redundant with PR #61.** Diff and discard if covered. |

### Tier 3 — Confirm and discard

| Rank | Branch | Tip | Verdict |
|---|---|---|---|
| **11** | `salvage/m3-phase1` | `a36186c` | **Byte-identical to PR #62 merge.** Salvage report §6 confirms. **Delete after Ron confirms.** |
| **12** | `salvage/m3-divergence-review` | `cbfbef7` | All-deletion diff against PR #63 + PR #65 — older than main, not divergent. **Delete after Ron confirms.** |
| **13** | `salvage/investor-room` | `6469a49` | v2–v6 cumulative; same content as PR #44. **Delete.** |
| **14** | `salvage/investor-room-v6` | `c82cc6f` | Parallel to consolidate-v6 (different SHA, same subject). **Delete after diff confirms identity.** |
| **15** | `salvage/stash-1-56929e5` | `56929e5` | WIP stash — `WIP on claude/implement-onboarding-cover-uqkFR: a40bcc3 …`. **Inspect, then delete or land any unique deltas.** |
| **16** | `salvage/stash-2-cde738a` | `cde738a` | Index stash — same parent as #15. **Same fate as #15.** |

**Net:** 5 salvage branches contain real value (Tier 1) and should be promoted in order. 5 are redundancy-suspects (Tier 2) that need a 2-minute diff before disposition. 6 should be deleted after a confirmation glance.

---

## 4. What's documented but not built — gaps between roadmap v3 and reality

Roadmap v3 was written 2026-04-21. We're 15 days in. Status against each phase:

### Phase 1 · Foundation — 95% on roadmap, **~85% in reality**

| Item | Roadmap status | Reality |
|---|---|---|
| **F-1..F-3** CI gates (typecheck + test required) | "Closing gap" | **Not done.** CI still build-only. Required-checks not enforced. |
| **F-4** Lint check | "Closing gap" | Not done. |
| **F-5..F-7** Sentry + structured logger + request-ID | "Closing gap" | **Not done.** Still `console.warn`. |
| **F-8..F-12** Production deploy (Render API + Vercel web + Neon DB + DNS) | "Closing gap" | **Not done.** `apps/landing` deployed to Vercel via #57; **`apps/api` and `apps/web` are not deployed.** |
| **F-13** Replace roadmap.md stub | Done via PR #52 | ✅ |
| **F-14** Clean macOS Finder duplicate files | "Closing gap" | Mostly done via salvage report cleanup; spot-check needed. |

### Phase 2 · Core — 70% on roadmap, **~65% in reality** (no movement since)

| Item | Roadmap status | Reality |
|---|---|---|
| **C-1..C-4** Onboarding QA + brand-voice pass + empty-states + resumable progress | "Polish + e2e proof" | **Onboarding cover (Surface 1) and Jeffrey intro (Surface 2) are on `design-system-v0.1`** but unmerged. C-1 / C-2 / C-3 / C-4 not formally executed. |
| **C-5..C-8** Lab ingestion (LabCorp/Quest/BostonHeart/Genova + manual entry + timeline) | "Polish + e2e proof" | Scaffold exists; no QA pass; `labNormalizer.ts` coverage unknown. |
| **C-9..C-12** Wearable live-sync (WHOOP, Apple Health, Oura) | "Polish + e2e proof" | Scaffold exists for WHOOP + Apple Health; **Oura not scaffolded**; happy-path against real data not verified. |
| **C-13..C-15** FHIR / Epic | "Polish + e2e proof" | Scaffold + sandbox auth path exists; not verified end-to-end against an Epic sandbox; **Epic App Orchard application not started** (per roadmap §8 risk note). |
| **C-16..C-21** Stack UX + adherence loop + daily check-in | "Polish + e2e proof" | UI surfaces exist; Jeffrey daily check-in not wired; voice-logged supplements not wired. |

### Phase 3 · Intelligence — 40% on roadmap, **~50% in reality** (new lane has emerged)

| Item | Roadmap status | Reality |
|---|---|---|
| **I-1..I-9** Agent layer (orchestrator, intent classifier, state loader, plan builder, executor, safety gate, brand filter, route migration, monolith deprecation) | "Specced not executed" | **Specced in `AGENT_LAYER_IMPLEMENTATION_PLAN.md`.** PR-1 scaffold sits on `claude/connect-github-YcvR8`. **`salvage/orchestrator` (Tier 1 #2) covers I-1..I-5.** Not on main. |
| **I-10..I-13** Adaptive protocol tuning | "Specced not executed" | **`salvage/jeffrey-ai-system` carries adaptive-tuning service.** Not on main. |
| **I-14..I-17** Memory lifecycle | "Specced not executed" | **`salvage/jeffrey-ai-system` carries memory-lifecycle service.** Not on main. |
| **I-18..I-21** Safety rule pack v1 | "Specced not executed" | **`salvage/jeffrey-ai-system` carries safety pack.** Not on main. |
| **I-22..I-25** Jeffrey workflow library (morning check-in, post-lab debrief, weekly review, refill triggers) | "Specced not executed" | Not built. |
| **I-26..I-28** Health-signal emission | "Specced not executed" | Not built. |
| **NEW: Jeffrey eval suite (B1)** | Not in v3 | **Built and merged via PR #60. 17-persona cohort + voice eval set.** This is a quiet win — first quantitative eval surface in the repo. |
| **NEW: Jeffrey Voice v1.1 lock** | Not in v3 | **Locked via PR #65** — cedar / 0.6 / 1000ms / RP British prompt. |
| **NEW: Design-system Phase α** | Not in v3 | **DTCG tokens, JeffreyAvatar component, onboarding Surface 1+2, Brand v2.1.** Sitting on `design-system-v0.1`. |

### Phase 4 · Scale + Commercial — 10% on roadmap, **~10% in reality** (no movement)

Stripe (S-1..S-5), supplement fulfillment (S-6..S-9), provider/care-team (S-10..S-13), admin/ops (S-14..S-16), HIPAA + BAAs (S-17..S-22), perf + scale (S-23..S-26): **none started.** BAA inventory (S-17) is mentioned in the salvage `salvage/jeffrey-ai-system` chain but not promoted to main.

### Net gap

The roadmap v3 numbers are roughly accurate at the *phase* level, but the **work has shifted location**: a lot of Phase 3 intelligence work that v3 calls "specced not executed" has actually been *executed* on salvage branches and the `design-system-v0.1` lane. The gap is **promotion-to-main**, not creation. Once Tier 1 salvages land, Phase 3 jumps from 40% → ~70% on disk.

---

## 5. Recommended next 5 missions (in order, with reasoning)

Optimizing for: **revenue speed × engineering hygiene × moat**, and respecting that the largest single risk is unmerged work rotting on branches.

### Mission 1 — **Land the design-system lane (`design-system-v0.1`) → main**

**Why:** 25 commits of high-value work — Phase α design system, Brand v2.1, JeffreyAvatar, onboarding Surfaces 1+2, jeffrey-evals B1 + 17-persona cohort, path-enforcement pre-commit hook — sitting one branch away from `main`. Every day this stays unmerged risks drift and merge-conflict tax.

**Form:** Don't squash into one PR. Slice into 4 logical PRs:
1. **Plumbing:** `.canonical` rewrite, .gitignore hardening, path-enforcement pre-commit, voice-deploy/key-rotation script restore, figma-foundation-builder import. *(2 hrs review.)*
2. **Brand v2.1 + DTCG tokens:** Signal Red identity promotion + design-system foundation. *(half-day review — token changes ripple.)*
3. **Jeffrey evals B1 + cohort:** the eval surface. *(half-day review — eval semantics matter.)*
4. **Onboarding Surface 1+2 + JeffreyAvatar:** the user-facing piece. *(full-day review — UX-critical.)*

**Output:** `design-system-v0.1` retired into `main`. Stale branches pruned.

**Time:** 2–3 working days end-to-end.

**Risk if skipped:** rebase tax compounds; the next major main-merge (e.g., agent layer) will collide with this.

---

### Mission 2 — **Drain the salvage Tier 1 + close PR #67**

**Why:** five salvage branches carry orchestrator + adaptive tuning + memory lifecycle + safety pack + experience surface — i.e., **most of roadmap Phase 3** in physical form. Plus PR #67 (`claude/complete-health-integration-oc4Bi`) is the last live PR from the prior session and should not be left dangling.

**Form:**
1. **PR #67 review and land** (or close with documented reason). 1 day.
2. **`salvage/orchestrator` → PR** "feat(orchestrator): I-1..I-5 scaffold". 1 day.
3. **`salvage/jeffrey-ai-system` stack → 5–6 PRs** (safety pack, memory lifecycle, adaptive tuning, JeffreyAISystem viz, orchestrator/safety wiring into /chat, demo runbook). 1 week.
4. **`salvage/experience-surface` → PR** "feat(web): /experience surface". 1 day.
5. **`salvage/deploy-preflight`, `salvage/jeffrey-realtime-server`, `salvage/jeffrey-realtime`, `salvage/haiku-to-openai-parser`** — diff against main, land delta or delete. 1 day total.
6. **Tier 3 deletions** (m3-phase1, m3-divergence-review, investor-room, investor-room-v6, the two stashes). 1 hour.

**Output:** Phase 3 jumps from ~40% to ~70% on `main`. 16 salvage branches → 0.

**Time:** 7–10 working days.

**Risk if skipped:** branches age; merge conflicts compound; the agent-layer PR-1 scaffold (`claude/connect-github-YcvR8`) sits unused.

---

### Mission 3 — **Close Phase 1 Foundation gaps and deploy `apps/api` + `apps/web` to production**

**Why:** the marketing site is live (`www.aissisted.me`); the actual product is not. Investor Room, voice demo, and the public surface all *imply* a working product. Today, no one can sign up and use it. Roadmap items F-1..F-12 are the path.

**Form:**
1. **F-1..F-4:** wire `pnpm -r typecheck`, `pnpm -r test`, `pnpm -r lint` into `.github/workflows/ci.yml`. Make required checks. *(half-day.)*
2. **F-5..F-7:** Sentry on api/web/site (gated on `SENTRY_DSN`). pino logger in api. Request-ID propagation. *(1–2 days.)*
3. **F-8..F-12:** Neon Postgres → Render API at `api.aissisted.com` → Vercel web at `app.aissisted.com` → DNS/SSL → run `/jeffrey-live` end-to-end against prod per `docs/deployment.md`. *(2–3 days.)*

**Output:** First real-user-capable production stack. Sign-up → onboarding → Jeffrey voice on a real domain.

**Time:** 4–6 working days.

**Risk if skipped:** Phase 4 (Stripe) is meaningless without a deployed surface. Investor conversations happen on a marketing site that doesn't have a back-end users can hit.

---

### Mission 4 — **Phase 4 revenue beachhead: Stripe + entitlement (S-1..S-5)**

**Why:** the shortest path to revenue per roadmap §7. With Mission 3 done, this is two weeks of focused work to convert pricing-page intent into MRR.

**Form:**
1. **S-1:** Stripe products + tiers per business-model memo. *(1 day.)*
2. **S-2:** `/pricing` → checkout flow on `apps/landing` (the canonical marketing surface post-#71). *(1 day.)*
3. **S-3:** Entitlement enforcement in `apps/api` — paywall protocol generation + advanced features. *(2 days.)*
4. **S-4:** Dunning + churn email flows via Loops/Postmark. *(1 day.)*
5. **S-5:** Annual vs monthly + trial period handling + tax (Stripe Tax). *(1 day.)*

**Output:** First dollar capture-able. Investor Room CTAs become credible.

**Time:** 5–7 working days.

**Risk if skipped:** company is a research project, not a business. Investor conversations stall when "what's MRR?" hits.

---

### Mission 5 — **Phase 2 Core e2e proof — the first cohort experience (C-1..C-21)**

**Why:** Mission 1 ships UI; Mission 2 ships intelligence; Mission 3 ships infra; Mission 4 ships billing. Mission 5 closes the loop: a real human can land → sign up → upload labs → connect WHOOP → get a protocol → log adherence → hear from Jeffrey daily. Until this is true, churn will be brutal.

**Form:**
1. **C-1..C-4:** onboarding e2e QA + brand-voice pass + empty-states + resumable progress. *(2 days.)*
2. **C-5..C-8:** lab ingestion — LabCorp/Quest/BostonHeart/Genova parser coverage + manual entry + timeline. *(3–4 days.)*
3. **C-9..C-12:** WHOOP OAuth happy path + scheduled sync + Apple Health export.zip flow + Oura adapter. *(3–4 days.)*
4. **C-13..C-15:** FHIR/Epic against an Epic sandbox + error surfaces. *(2–3 days, plus Epic App Orchard application started in parallel.)*
5. **C-16..C-21:** stack UX explain drawer + adherence loop + daily check-in via Jeffrey + voice-log. *(3–4 days.)*

**Output:** the 17-persona cohort can actually run. Adaptive loop has data to learn from.

**Time:** 12–15 working days.

**Risk if skipped:** the product thesis (data-driven, continuously adaptive) is unproven; cohort retention is a coin flip.

---

## 6. Strategic posture

**One sentence:** the foundation is built; promotion is the bottleneck; ship the design-system lane this week, drain salvage next week, deploy the week after, then run revenue and core in parallel.

**Decision framework for the next 4 weeks:**
- **If cash is the constraint:** Mission 1 → 3 → 4 (skip 2, accept the technical-debt cost on the agent layer).
- **If thesis is the constraint:** Mission 1 → 2 → 3 → 5 (defer billing).
- **Recommended (both):** Mission 1 → 2 → 3 → 4 + 5 in parallel (one lane each).

**Open questions for Ron:**
1. Do we have an active Vercel/Render/Neon billing relationship, or do those need provisioning before Mission 3?
2. Epic App Orchard — has the application been started? If not, kick that off this week regardless; review timeline is months.
3. Medical advisory board — roadmap §8 calls this out as the top regulatory risk. Status?
4. Stripe — do we have a business-model memo with tiers locked, or does Mission 4 begin with pricing strategy work?

---

*End of synthesis. No code changes made. Source data captured 2026-05-06 from `git log origin/main`, remote branch divergence, and the three primary docs.*
