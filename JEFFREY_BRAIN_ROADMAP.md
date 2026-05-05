# Jeffrey Brain — Build Roadmap v1

**Date:** 2026-05-02
**Owner:** Ron Gibori
**Status:** Canonical. Supersedes the Jeffrey-touching items in §3 of `AISSISTED_ROADMAP_v3.md` for the next 8 weeks.
**Scope:** Complete the Jeffrey brain — finish the agent layer, wire the eval suite as a deploy gate, and stand up the adaptive loop. Not in scope: web UI polish, billing, fulfillment.

---

## 0. Executive summary

Jeffrey ships in three forms today: a server package (`@aissisted/jeffrey`), a voice surface (OpenAI Realtime + ElevenLabs), and a chat surface in `apps/web`. The brain reasons. The voice speaks. The memory remembers. **What's missing is the scaffolding around it that proves Jeffrey is safe, on-brand, and personalized at scale — and the closing of the adaptive loop that makes the formula get better over time.**

Two artifacts make the difference between "Jeffrey works for me" and "Jeffrey works for everyone":

1. **`@aissisted/jeffrey-evals`** — a 17-persona synthetic cohort + 8 eval sets that gates every Jeffrey-touching deploy. **Scaffolded; three integration TODOs from production.**
2. **The agent layer** — the orchestrator that decides which sub-agent (formula, recall, proactive, safety) handles a turn. **Specced; not built.**

Closing both unlocks private beta. Everything past that is commercial scale.

**The plan in one sentence:** wire evals (week 1) → close memory + safety (weeks 2–3) → ship agent layer (weeks 4–5) → adaptive loop (weeks 6–7) → beta gate (week 8).

---

## 1. Where Jeffrey stands today

### 1.1 What's live

- `packages/jeffrey/` — 22 source files. Personality, voice, memory, investor brain, onboarding brain, health-tools, competitive, client, session, bridge, prompts, system-prompt.md.
- `packages/jeffrey-evals/` — 17-persona cohort, 8 eval sets, vitest runner, scoring scaffolding.
- `apps/api/src/routes/jeffrey.ts` + `jeffrey-realtime.ts` — REST + WebSocket entry points.
- `apps/web/app/jeffrey-live/` — the voice modal surface.
- OpenAI Realtime WS proxy is live. ElevenLabs TTS relay is live.

### 1.2 What's specced but not built

- `docs/specs/JEFFREY_VOICE_LAYER_SPEC.md` — golden tests T1-T10 referenced by HV evals; not yet wired.
- `docs/specs/ORCHESTRATOR_ROUTING_SPEC.md` — agent routing decision tree.
- `docs/specs/AGENT_LAYER_IMPLEMENTATION_PLAN.md` — sub-agent decomposition.
- `docs/specs/SAFETY_RULE_PACK_V1.md` — I-18 through I-21 rule families.
- `docs/specs/SHARED_STATE_AND_MEMORY_SPEC.md` — pgvector + structured memory contract.

### 1.3 What's broken or unfinished

- Eval suite has three integration TODOs blocking it from running against real Jeffrey:
  - `src/setup.ts` — DB seeding via `@aissisted/db` (cohort fixtures → live tables)
  - `src/execute.ts` — invoking Jeffrey via `@aissisted/jeffrey/bridge`
  - `src/score.ts` — LLM-as-judge via OpenAI gpt-4o-mini for non-regex criteria
- No CI gate — Jeffrey-touching PRs can land without running evals.
- No memory lifecycle — items get written, never reviewed, pruned, or summarized.
- Agent layer is one big system-prompt + tool-loop. No sub-agent dispatch.
- Adaptive loop is open — protocols generate, but feedback (adherence, biomarker delta, sleep response) doesn't tune the next protocol.

---

## 2. Target state — what "Jeffrey is done" looks like

A user asks Jeffrey something. Jeffrey:

1. **Routes** — orchestrator picks the right sub-agent (recall · formula · proactive · safety · investor).
2. **Recalls** — pulls relevant memory (structured + semantic) without hallucinating.
3. **Acts** — calls the right tool with the right args.
4. **Speaks** — voice or text, on brand voice, calm/clear/assured, British premium register.
5. **Refuses cleanly** — medical-diagnosis, emergency, scope-mismatch handled in-character.
6. **Adapts** — last night's HRV moves tonight's stack. Adherence influences nudge cadence.
7. **Remembers** — long-term context survives, short-term clutter expires.

**And every change to any of the above runs a 250-case eval suite before it ships.**

Each of the 7 numbered behaviors above maps to one or more eval sets:

| Behavior | Eval set | Threshold |
|---|---|---|
| Routes correctly | (new) Orchestrator Routing — OR | 95% |
| Recalls correctly | Memory Recall — MR | 90% |
| Acts correctly | Happy Path Text — HT, Voice — HV | 92% |
| Speaks on brand | Brand Voice — BV (overlay) | 95% on every set |
| Refuses cleanly | Do-Not-Respond — DNR + Safety Rule — SR | **100%** (zero tolerance) |
| Adapts correctly | (new) Adaptive Loop — AL | 85% |
| Triggers proactively | Proactive Triggers — PT | 90% |
| Reads trends | Trend Interpretation — TI | 85% |

**DNR + SR are zero-tolerance.** Any failure blocks deploy. No exceptions.

---

## 3. Decision framework

Three questions to ask before any Jeffrey-touching change ships:

1. **Did `pnpm --filter @aissisted/jeffrey-evals eval:full` pass?**
   - If no → not shipping.
2. **Did DNR + SR pass at 100%?**
   - If no → not shipping. Period.
3. **Did the 14-case fast suite (`EVAL_FAST=1`) pass in the PR check (~$0.40, ~3 min)?**
   - If no → not merging.

Everything else is a soft threshold with a regression alert, not a block. We optimize for shipping speed within the safety envelope.

---

## 4. Phases

### Phase J1 · Eval wiring (Week 1 — 5 days)

**Goal:** every Jeffrey-touching PR runs the eval suite. Today it doesn't run at all.

| ID | Task | Effort | Owner |
|---|---|---|---|
| J1-1 | Wire `src/setup.ts` — cohort manifest → DB seed via `@aissisted/db`. 17 personas, memory seeds, protocol fixtures. | 1d | Eng |
| J1-2 | Wire `src/execute.ts` — invoke Jeffrey via `@aissisted/jeffrey/bridge`. Both text and voice paths. STT confidence band injection for voice. | 1d | Eng |
| J1-3 | Wire `src/score.ts` — LLM-as-judge with gpt-4o-mini. Structured JSON output. Brand-voice rubric overlay. | 1d | Eng |
| J1-4 | Add `eval:fast` and `eval:full` to `.github/workflows/ci.yml`. Fast on every PR. Full on `main` push only. | 0.5d | Eng |
| J1-5 | Wire deploy gate logic — `eval:full` must pass for deploy. DNR + SR fail = deploy blocked. | 0.5d | Eng |
| J1-6 | First green run of full suite (~$3-4, ~12 min). Document baseline scores. | 1d | Eng |

**Exit criteria:**
- `pnpm --filter @aissisted/jeffrey-evals eval:full` runs against real Jeffrey end-to-end.
- CI fails on DNR or SR regression.
- Baseline scores documented in `packages/jeffrey-evals/BASELINE.md`.

### Phase J2 · Memory + safety lock-in (Weeks 2–3 — 10 days)

**Goal:** Jeffrey remembers correctly and refuses cleanly. The two zero-tolerance behaviors must be production-grade.

| ID | Task | Effort | Owner |
|---|---|---|---|
| J2-1 | Implement `SAFETY_RULE_PACK_V1.md` rule families I-18 (medical diagnosis), I-19 (emergency), I-20 (scope), I-21 (drug interaction) as enforceable code in `packages/jeffrey/src/safety/`. | 2d | Eng |
| J2-2 | Wire safety pack into `bridge/index.ts` so every turn passes through it before the LLM sees it AND after the response is generated. | 1d | Eng |
| J2-3 | Pgvector memory store — `packages/jeffrey/src/memory.ts` upgrade. Drizzle schema for `memory_items` + `memory_embeddings`. | 2d | Eng |
| J2-4 | Memory lifecycle — promote (recurring → permanent), expire (one-off → 30 days), summarize (5+ related items → 1 summary). Cron in `apps/api/src/scheduler.ts`. | 2d | Eng |
| J2-5 | "Forget this" tool — user-initiated deletion respecting `respectsForgetRules` from MR eval set. | 0.5d | Eng |
| J2-6 | Reach DNR=100% + SR=100% on full suite. Patch any failure cases — code + eval review. | 1.5d | Eng |
| J2-7 | Reach MR ≥ 90% on full suite. | 1d | Eng |

**Exit criteria:**
- DNR=100%, SR=100% on every PR.
- MR ≥ 90% on full suite.
- Memory lifecycle cron running in dev with logged transitions.

### Phase J3 · Agent layer (Weeks 4–5 — 10 days)

**Goal:** Jeffrey is a router, not a monolith. Sub-agents handle their domains.

| ID | Task | Effort | Owner |
|---|---|---|---|
| J3-1 | Implement orchestrator per `ORCHESTRATOR_ROUTING_SPEC.md`. Classification step before tool-loop. | 2d | Eng |
| J3-2 | Sub-agent: `formula-agent` — owns protocol read/write, dose math, interaction warnings. | 2d | Eng |
| J3-3 | Sub-agent: `recall-agent` — owns memory queries, structured + semantic. | 1d | Eng |
| J3-4 | Sub-agent: `proactive-agent` — fires from scheduler events, never user-initiated. Owns push channel selection. | 2d | Eng |
| J3-5 | Sub-agent: `safety-agent` — supervises every other sub-agent's output. Veto power. | 1d | Eng |
| J3-6 | New eval set: **OR** (Orchestrator Routing) — 30 cases. Verifies the right sub-agent gets the turn. Add to suite. | 1d | Eng + Cohort review |
| J3-7 | Reach OR ≥ 95%, HT ≥ 92%, HV ≥ 92% on full suite. | 1d | Eng |

**Exit criteria:**
- Orchestrator routes 30/30 OR test cases correctly.
- HT, HV pass at 92%.
- DNR + SR still at 100% (no regression).

### Phase J4 · Adaptive loop (Weeks 6–7 — 10 days)

**Goal:** the formula gets better over time. Jeffrey closes the loop between protocol → outcome → next protocol.

| ID | Task | Effort | Owner |
|---|---|---|---|
| J4-1 | Health-signal emission per Issue #35 — biomarker delta, sleep response, adherence streak, mood notes emit `signal:` events. | 2d | Eng |
| J4-2 | Adaptive tuning service in `apps/api/src/services/adaptive-tuning.ts` — consumes signals, proposes formula deltas. | 2d | Eng |
| J4-3 | Tuning runs nightly at 04:00 user-local. Generates "v3.2 → v3.3" deltas with rationale. | 1d | Eng |
| J4-4 | Jeffrey explains the change on the next morning surface — "Magnesium up +40 mg. Rhodiola back in." | 1d | Eng |
| J4-5 | New eval set: **AL** (Adaptive Loop) — 25 cases across persona archetypes. Synthetic 14-day signal histories → expected formula deltas. | 2d | Eng + Cohort review |
| J4-6 | Reach AL ≥ 85%, TI ≥ 85%, PT ≥ 90% on full suite. | 2d | Eng |

**Exit criteria:**
- Nightly tuning produces formula v.next with rationale every night for cohort C-01 through C-05.
- AL, TI, PT pass at threshold.
- DNR + SR + MR + HT + HV + OR no regression.

### Phase J5 · Beta gate (Week 8 — 5 days)

**Goal:** Jeffrey is ready for 50 real users. All eval thresholds met. Production runtime hardened.

| ID | Task | Effort | Owner |
|---|---|---|---|
| J5-1 | Full eval suite passes at all thresholds across 5 consecutive nightly runs. | continuous | Eng |
| J5-2 | Production observability: every Jeffrey turn → Sentry breadcrumb + structured pino log + request ID through chat → jeffrey → openai. | 1d | Eng |
| J5-3 | Rate limit tuning — Jeffrey turns capped at 200/user/day. Cost ceiling at $40/user/month with auto-throttle. | 1d | Eng |
| J5-4 | Cost telemetry — per-turn token spend logged, daily roll-up dashboard. | 1d | Eng |
| J5-5 | Beta cohort selection — 50 users from request-access waitlist. Tier 1 from existing dogfooders. | 0.5d | Ron |
| J5-6 | Beta runbook — how to triage Jeffrey complaints, how to add a new eval case from production failure, how to run regression locally. | 1.5d | Eng + Ron |

**Exit criteria:**
- 5 consecutive green nightly runs.
- Cost telemetry live.
- 50 beta invites sent.

---

## 5. Eval coverage matrix

The 8 existing eval sets plus the 2 new ones map to every Jeffrey behavior. This is the contract.

| Eval set | ID | Cases (target) | Threshold | Status | Phase |
|---|---|---|---|---|---|
| Brand Voice (overlay) | BV | scoring rubric | 95% on every set | ✅ defined | J1 |
| Do-Not-Respond | DNR | 30 | **100%** | ✅ drafted | J1 + J2 |
| Happy Path Text | HT | 50 | 92% | ✅ drafted | J1 + J3 |
| Happy Path Voice | HV | 30 | 92% | ✅ drafted (T1-T10 ref) | J1 + J3 |
| Memory Recall | MR | 35 | 90% | ✅ drafted | J2 |
| Proactive Triggers | PT | 25 | 90% | ✅ drafted | J4 |
| Safety Rule | SR | 30 | **100%** | ✅ drafted | J2 |
| Trend Interpretation | TI | 25 | 85% | ✅ drafted | J4 |
| **Orchestrator Routing** | **OR** | 30 | 95% | 🆕 new | J3 |
| **Adaptive Loop** | **AL** | 25 | 85% | 🆕 new | J4 |
| | | **~280 cases** | | | |

**Cost per run:**
- Full suite: ~$3–4, ~12 min
- Fast subset (every 5th case): ~$0.40, ~3 min
- CI runs fast on every PR. Nightly runs full on `main`.

---

## 6. Claude Code as Jeffrey's QA agent

**Decision:** Claude Code is the resident QA engineer for the eval suite. This is leverage.

Three workflows where Claude Code earns its keep:

### 6.1 New eval cases from production failures
When a beta user hits a Jeffrey response that's wrong, file a GitHub issue with the transcript. Claude Code:
1. Reads the transcript.
2. Identifies the closest matching persona in the cohort.
3. Drafts a new eval case in the appropriate set with expected behavior.
4. Opens a PR with the case + the failing input + the proposed code fix.
5. CI runs the suite. If green, merge.

This is the loop that keeps Jeffrey getting better without inflating engineering load.

### 6.2 Regression triage
When a PR regresses an eval set:
1. Claude Code reads the failing case + the diff.
2. Identifies whether the regression is intentional (prompt change) or accidental (bug).
3. Either patches the code or proposes an updated expected behavior — the human ratifies.

### 6.3 Cohort expansion
Today's cohort is 17. Real users will surface gaps. Claude Code generates new persona profiles (`C-18`, `C-19`, ...) by sampling underrepresented dimensions: rare conditions, edge demographics, adversarial intent patterns. Each new persona is reviewed by Ron before merging.

**Setup:** dedicated `claude-code-jeffrey` GitHub app with read+write on the repo, scoped to `packages/jeffrey-evals/`, `packages/jeffrey/`, and `.github/workflows/ci.yml`. Credentials in 1Password vault `aissisted/ci`.

---

## 7. Critical path

```
J1-1 ──► J1-2 ──► J1-3 ──► J1-6 (eval baseline live)
                                    │
                                    ▼
                      J2-1 ──► J2-2 ──► J2-6 (DNR/SR=100%)
                                    │
                                    ▼
              J2-3 ──► J2-4 ──► J2-7 (MR ≥ 90%)
                                    │
                                    ▼
            J3-1 ──► J3-2..J3-5 ──► J3-7 (OR ≥ 95%)
                                    │
                                    ▼
            J4-1 ──► J4-2..J4-5 ──► J4-6 (AL ≥ 85%)
                                    │
                                    ▼
                         J5-1..J5-6 (beta gate)
```

**Critical path length:** 8 weeks (40 working days).
**Slack:** ~5 days. Memory work (J2-3, J2-4) can overlap with safety work (J2-1, J2-2). Sub-agents (J3-2..J3-5) parallelize.

---

## 8. Risks + weak assumptions

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM-as-judge drift between gpt-4o-mini versions | Medium | High | Pin model version. Re-baseline on every model upgrade. Calibration set of 10 hand-graded cases. |
| Cohort doesn't represent real users | High | Medium | Phase J5-6 mandates new eval cases from beta failures within 24h. |
| pgvector + Drizzle integration drag | Medium | Medium | Use raw SQL via `db.execute()` if the type-safe path stalls. Memory recall is a deploy gate. |
| Orchestrator routing degrades end-to-end latency | Medium | Medium | Budget: orchestrator + sub-agent < +400ms over baseline. Drop to monolith if exceeded; ship on parity then optimize. |
| Adaptive tuning produces unsafe formula changes | Low | **Critical** | Safety-agent veto on every tuning proposal. Tuning never crosses I-21 (drug interaction) thresholds. |
| Eval cost grows past $50/day with cohort expansion | Medium | Low | Fast-mode default for non-deploy runs. Full only on main + nightly. |
| Voice eval cases drift from `JEFFREY_VOICE_LAYER_SPEC.md` golden tests | Medium | Medium | Spec + eval set both versioned. Bumping one requires bumping the other. |

---

## 9. Next 14 days (2026-05-02 → 2026-05-16)

A punch list. Concrete, no fluff.

**Week 1 — Eval wiring (J1)**

- [ ] **Mon** — J1-1: cohort fixtures → DB seed wired. Run `pnpm --filter @aissisted/jeffrey-evals test` and watch it spin up real DB.
- [ ] **Tue** — J1-2: `execute.ts` invokes real Jeffrey via bridge. Ten cases pass against live brain.
- [ ] **Wed** — J1-3: LLM-as-judge scoring works. Brand voice rubric scores correctly.
- [ ] **Thu** — J1-4 + J1-5: GitHub Actions wired. Fast suite gates PRs.
- [ ] **Fri** — J1-6: full suite green run. Baseline scores in `BASELINE.md`. Ship.

**Week 2 — Safety + memory (J2 first half)**

- [ ] **Mon** — J2-1: safety rule pack v1 — I-18, I-19 implemented + tested.
- [ ] **Tue** — J2-1 cont. + J2-2: I-20, I-21 in. Bridge integration.
- [ ] **Wed** — J2-3: pgvector schema + migration. `memory_items` + `memory_embeddings` live.
- [ ] **Thu** — J2-4: lifecycle cron. Promote / expire / summarize logic.
- [ ] **Fri** — J2-5: "forget this" tool. J2-6 starts: hunt the DNR/SR failures.

---

## 10. What I'm explicitly not doing in this roadmap

To keep scope honest:

- **Not building** new wearable integrations (Oura, Garmin) — that's apps work, not Jeffrey work.
- **Not building** the supplement fulfillment commerce — Phase 4 of the parent roadmap, separate.
- **Not building** new chat/voice surfaces — the current ones are enough to prove the brain.
- **Not migrating** the OpenAI Realtime to Anthropic-native voice — that's a 2026 H2 decision, post-beta.
- **Not redesigning** the system prompt — incremental tuning only, gated by evals.

If Jeffrey passes the suite, it ships. If it doesn't, it doesn't. That's the only line that matters for the next 8 weeks.

---

## 11. Handoff

- **Tracking:** Linear project `Jeffrey Brain v1`. Issues prefixed `J1-`, `J2-`, etc.
- **Reviews:** Friday end-of-week sync, Ron + lead engineer. Eval scoreboard reviewed first.
- **Escalation:** any DNR or SR regression on `main` → page Ron immediately. Other regressions → 24h SLA.
- **Done definition:** Phase J5 exit criteria all met for 5 consecutive nightly runs. 50 beta invites sent.

---

*Roadmap: 2026-05-02 → 2026-06-27. Beta start: 2026-06-30 if green.*
