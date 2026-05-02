# AISSISTED — BETA LAUNCH PLAN

**Version:** 2.0
**Date:** 2026-04-30 (v2.0 update — post-PR-#60-merge + journal/analytics ratification)
**Status:** Active execution plan
**Owner:** Cowork (with Chat-spec + Code-impl loops)
**Supersedes:** v1.0 (this same file). v1.0 superseded `AISSISTED_TECHNICAL_SPEC_AND_ROADMAP_v1.0.md` (pre-build charter).
**Anchors against:** `docs/roadmap.md` v3, `docs/specs/JOURNAL_AND_ANALYTICS_SPEC_V1`, `docs/specs/JEFFREY_VOICE_LAYER_SPEC`, `docs/specs/SECURITY_AND_COMPLIANCE_V1`.

**v2.0 changelog:**
- PR #60 squash-merged to main as `ed5b8ea5` — eval suite + bridge B1 + 17-persona cohort + soft latency gates + brand-voice §8.1 paragraph all shipped
- Journal + Analytics product loop ratified as the actual product (not a feature) — see §0.5 below + `JOURNAL_AND_ANALYTICS_SPEC_V1`
- Multi-source wearable abstraction locked (WHOOP / Oura / Apple Watch interchangeable + combinable at canonical signal layer)
- §6 decisions matrix updated with five new ratifications (extraction-deferred-until-BAA, cohort-priors-post-launch, WHOOP+Oura-at-beta-Apple-deferred, lab-cadence-in-bundle, counterfactual-slider-as-preview)
- Phase 2/3/4 deliverable tables updated to include canonical signal layer (Phase 2), voice-first journal + Analytics v1 (Phase 3), Analytics v2 with causal inference (Phase 4)
- Onboarding Claude Design system-aligned to `aissisted-system.html` mocks (v2.1 prompt sequence)

---

## 0. WHY THIS DOCUMENT EXISTS

Two documents claimed to be roadmaps and contradicted each other:

1. **`AISSISTED_TECHNICAL_SPEC_AND_ROADMAP_v1.0.md`** — written before the team could see the actual repo. Says "Codebase: ❌ Not started." Claims everything ships in 9–10 months. **Stale.**
2. **`docs/roadmap.md` v3** (Cowork-authored, Apr 21) — written from the actual repo. Says Foundation 95% / Core 70% / Intelligence 40% / Commercial 10%. **Accurate.**

This document is the **execution plan to ship a fully interactive Beta** (onboarding → analytics → Jeffrey voice) on the v3 roadmap's actual baseline, with explicit treatment of:

- HIPAA-compliant AWS infrastructure
- Claude Design UI/UX scope
- Email migration to `ron@aissisted.me`
- Realistic timeline anchored to today (Apr 30)

Read this in conjunction with `docs/roadmap.md` v3. Where they conflict, this doc supersedes for Beta scope only.

---

## 0.5 THE PRODUCT — RATIFIED 2026-04-30

The journal + analytics + voice modal are **one product loop**, not three features. This loop is the actual product. Everything else (eval suite, AWS infra, onboarding) is plumbing.

```
Jeffrey checks in (voice modal, ~60s/day)
      ↓
User reflects (journal: adherence + symptom + free-text)
      ↓
Wearable + lab + journal data fuse via canonical signal layer
      ↓
Analytics surfaces what's actually working (causal attribution per intervention)
      ↓
Jeffrey proposes 30-day protocol adjustment
      ↓
User adheres
      ↓
[cycle repeats]
```

**Strategic outcome:** the loop is the retention engine. DTC supplement attrition between months 3 and 6 is the industry's graveyard — users churn because they can't *feel* whether the protocol is working. The analytics + journal combo is the mirror that reflects results back to them. The voice modal makes daily journaling frictionless. The causal inference makes the analytics not just observational but explanatory.

**Strategic moat:** every other supplement company is selling SKUs. Aissisted is running an N-of-1 platform on top of a canonical data layer. WHOOP is uni-modal (wearable only). We are multi-modal — wearable + labs + journal + adherence + EHR — and that fusion enables analytics WHOOP structurally cannot build: lab biomarker overlay on biometric trends, protocol attribution with confidence scores, predictive forecasting, counterfactual sliders. The killer screen is **"What's actually working?"** — ingredient-level attribution with confidence scores. No supplement company on Earth answers this question.

**Wearable strategy (locked):** WHOOP, Oura, Apple Watch are interchangeable signal sources at the data layer; some signals fuse across multiple devices when complementary. The user is never device-locked.

Full spec: `docs/specs/JOURNAL_AND_ANALYTICS_SPEC_V1`.

---

## 1. ACTUAL STATE OF THE REPO (as of 2026-04-30, post-Round 3 push)

The v1.0 charter was wrong about state-of-project. Here's the truth.

### 1.1 What's built

| Surface | Status | Evidence |
|---|---|---|
| **`apps/api`** Fastify backend | 95% Phase-1 done | 11 route groups, 14 services, 21 DB tables, rules engine across 5 health domains (sleep/inflammation/hormones/energy/cognition), interaction + allergy safety, JWT + rate limit + audit log, 3 integrations scaffolded (WHOOP / FHIR-Epic / Apple Health) |
| **`apps/web`** authenticated app | All routes scaffolded | dashboard, chat, jeffrey-live, labs, profile, stack, adherence, integrations, onboarding, login, register |
| **`apps/site`** marketing + investor surface | Full info architecture | home, for-you, how-it-works, science, longevity, pricing, faq, contact, request-access, investor-room (with waitlist + allocation-status + lead capture + admin + live-metrics + request-deck APIs) |
| **`apps/landing`** | Static HTML landing for `aissisted.me` | Live |
| **`packages/jeffrey`** canonical AI brain | Voice live | OpenAI brain (single key, all surfaces). ElevenLabs streaming TTS primary, OpenAI Realtime fallback. Bridge exposes `CapturedTurnResult` (timing + cost) per turn (just landed, B1). Memory adapter + session module + system prompt + tool catalog skeleton |
| **`packages/jeffrey-evals`** regression suite | Just shipped | 17-persona synthetic cohort, 8 eval sets, DNR (40 cases) + SR (49 cases) authored, runner wired (setup/execute/score/report) |
| **`packages/brand`** | v1.1 locked | Brand tokens (color/type/spacing) codified. Filter enforced (forbidden words). Palette budget tooling shipped |
| **`packages/db`** | Drizzle ORM | 21 tables. SQLite for dev, Postgres for production (per `docs/deployment.md`) |
| **`packages/{ui,domain,types,integrations,config}`** | Shared libraries | Standard monorepo packages |
| **`docs/specs/`** | 14 spec docs | Voice Layer, Brand Filter, Orchestrator Routing, Protocol Engine, Safety Rule Pack v1, Shared State + Memory, Agent specs (Brand/Data/Engineering/Growth/Product), Implementation Plan |
| **Voice runtime** | Live | OpenAI Realtime WS proxy, browser hook, ElevenLabs TTS relay, `/jeffrey-live` panel |
| **Branch state** | 10 commits ahead of main on `feat/jeffrey-evals-package` | Bridge B1 + eval suite + DNR/SR + cohort + voice eval set + G-06 + G-16 — **awaiting PR + merge** |

### 1.2 What's NOT built (for Beta)

| Gap | Phase | Honest status |
|---|---|---|
| Production deployment | Phase 1 | `docs/deployment.md` is a complete runbook. **Nothing is deployed.** |
| CI gates (typecheck, test) | Phase 1 | Workflows exist; not required-checks on `main` |
| Sentry / structured logging | Phase 1 | `console.warn` only |
| Onboarding end-to-end polish | Phase 2 | Scaffolded, needs brand-voice pass + UX QA |
| Lab ingestion (LabCorp + Quest PDF round-trip) | Phase 2 | OCR pipeline not yet wired |
| WHOOP live-sync | Phase 2 | OAuth scaffolded; webhook + backfill missing |
| FHIR/Epic round-trip | Phase 2 | SMART scaffolded; no certified Epic App Orchard yet |
| Adherence loop | Phase 2 | UI shell present; daily prompt cycle not wired |
| Adaptive protocol tuning (lab-delta → recommendation) | Phase 3 | Hooks unwired |
| Agent layer decomposition (jeffrey.service.ts → orchestrator + agents) | Phase 3 | Monolith |
| Memory write policy (long-term memory writebacks) | Phase 3 | Adapter exists; never invoked |
| Tool-calling through OpenAI Tools API | Phase 3 | Catalog defined; not wired |
| Audit log instrumentation in jeffrey turn flow | Phase 3 | No turn-level events written |
| Stripe billing | Phase 4 | Not started |
| Compounder / fulfillment integration | Phase 4 | Not started |
| Provider / care-team surface | Phase 4 | Not started |
| Admin / ops console | Phase 4 | Not started |
| HIPAA AWS posture (BAA, encrypted RDS, KMS, audit retention) | Phase 4 | Not started |

### 1.3 Beta scope (per Ron's request)

**Beta = a fully interactive, invite-only release that lets a small cohort do the full loop:**

```
[Onboarding] → [Connect signals] → [See protocol] → [Daily dashboard] → [Talk to Jeffrey by voice] → [Receive adaptive update]
```

What that requires from each phase:

| Phase | What Beta requires | What Beta defers |
|---|---|---|
| **1. Foundation** | All of it (CI, deploy, observability) | — |
| **2. Core** | Onboarding e2e + LabCorp/Quest PDF round-trip + WHOOP live-sync + adherence loop | Apple Health (defer to iOS app post-beta), Epic FHIR (defer to certified release post-beta) |
| **3. Intelligence** | Agent layer decomposition + safety rule pack live + Jeffrey workflow library + adaptive tuning (lab-delta → recommendation) + memory writebacks (basic) | Tool-calling beyond Jeffrey's existing read-only path (defer to v2), full audit event taxonomy (basic version OK) |
| **4. Scale + Commercial** | HIPAA AWS posture (BAAs + encryption + audit retention), Stripe billing live, basic admin console | SOC 2, provider/care-team surface, fulfillment-partner integration (manual fulfillment for beta cohort) |

**Cohort size:** 50–200 paid invites. **Geography:** US-only.

---

## 2. PHASED PLAN TO BETA (anchored to today)

The v3 roadmap calls for ~20 weeks total to commercial launch. **Beta** sits earlier — at the boundary of Phase 3 → Phase 4. Realistic estimate from today:

### Phase 1 Close-out — Weeks 1–2 (May 1–14)

Goal: **Team can deploy.** No more "it works on my machine."

- **F-1..F-4** CI gates (typecheck + test required on `main`)
- **F-5..F-7** Sentry + structured logger + request-ID propagation
- **F-8..F-12** Production deploy: AWS environment up, RDS Postgres, S3 for artifacts, ECR + Fargate or EC2 for `apps/api`, Vercel for `apps/web`+`apps/site`, secrets in Parameter Store/Secrets Manager
- **F-13** Domain routing: `aissisted.me` (landing), `app.aissisted.me` (web app), `api.aissisted.me` (API), `aissisted.me/investor` (investor room)
- **F-14** Pre-prod environment for QA
- **F-15** First merge of `feat/jeffrey-evals-package` to main → triggers CI eval gate

**Exit criteria:** push to main triggers full CI; production environment serving the existing surfaces; eval suite gates Jeffrey-touching PRs.

### Phase 2 Core — Weeks 3–6 (May 15 – Jun 11)

Goal: **End-to-end user proof + canonical data layer foundation.** A real user can complete the full happy path AND the data substrate for Phase 3-4 analytics is locked in.

- **C-1..C-4** Onboarding e2e (system-aligned per `aissisted-system.html` v2.1 prompt sequence): brand-voice pass, completion-rate instrumentation, save-state at every step, resumable email
- **C-5..C-8** Lab ingestion: LabCorp + Quest PDF OCR pipeline → biomarker normalization → reference-range mapping → integration into canonical signal layer (per `LAB_INGESTION_SPEC_V1`)
- **C-9..C-12** **Wearable adapter framework + canonical signal layer**: WHOOP webhook receiver + Oura polling adapter + signals_raw + signals_canonical hypertables + per-vendor normalization workers + quality scoring + cross-source fusion strategies (per `JOURNAL_AND_ANALYTICS_SPEC_V1` §2)
- **C-13..C-15** **Journal MVP (text-first)**: chip-style adherence + 5-tag symptom log + free-text typed entry, ~30s post-onboarding surface, persisted to journal_* tables. NO NLP extraction yet (deferred per Decision #11). Daily prompt UI + streak tracking + Jeffrey nudge on miss.
- **C-16..C-18** **Intervention table + protocol-change instrumentation**: every protocol change writes to `interventions` table with start/end/dose/reason — substrate for Phase 4 causal inference
- **C-19..C-21** Stack UX polish: Brand Bible tone pass on protocol view + ingredient explanations
- **F-12 verification** in production for `/jeffrey-live`

**Schema deliverables (non-negotiable Phase 2 lock-ins):**
- `signal_sources` (wearable connection metadata)
- `signals_raw` (TimescaleDB hypertable, immutable vendor payload audit)
- `signals_canonical` (TimescaleDB hypertable, normalized + provenance + quality)
- `journal_entries` + `journal_adherence` + `journal_symptoms` + `journal_events` + `journal_extracted_facts`
- `interventions`
- `lab_results` + `lab_biomarkers` (per Lab Ingestion spec)
- TimescaleDB continuous aggregates (daily/weekly rollups for Phase 3 trend layer perf)

**Exit criteria:** A new test user can sign up → connect WHOOP + Oura → upload lab PDF → see biomarkers → see protocol → log a daily journal entry (text-first) → receive Jeffrey check-in. End-to-end. In production. Canonical signal layer ingesting from both wearables. Intervention events being recorded.

### Phase 3 Intelligence (beta-scoped) — Weeks 7–10 (Jun 12 – Jul 9)

Goal: **The product thesis.** Adaptive intelligence that the user can feel + the daily engagement loop running end-to-end.

- **I-1..I-9** Agent layer: decompose `jeffrey.service.ts` into orchestrator + Brand/Product/Data/Engineering/Safety agents (specs already in `docs/specs/AGENT_LAYER_IMPLEMENTATION_PLAN.md`)
- **I-10..I-13** Adaptive protocol tuning: lab-delta → recommendation pipeline; weekly cron generates protocol diff with reasoning trace; every diff writes to `interventions` table
- **I-14..I-17** Memory lifecycle: write-policy spec → wire `LongTermMemoryAdapter.upsertEntry()` into turn flow → forget rules → user-facing "what Jeffrey remembers" surface
- **I-18..I-21** Safety rule pack v1 live: rules from `docs/specs/SAFETY_RULE_PACK_V1.md` wired through agent layer; SR eval set runs on every Jeffrey-touching PR
- **I-22..I-24** **Voice-first daily journal via Jeffrey modal**: morning push trigger → opens voice modal → canonical 60-90s script (adherence chips → free voice/text → reflection-back) → entry persisted with voice_transcript + audio S3 ref. Text-first MVP from Phase 2 stays for users who prefer it.
- **I-25..I-27** **Analytics v1** (Reflection + Trend layers, no causal yet):
  - Reflection layer: today's score, last night's sleep, yesterday's adherence, journal summary, today's protocol, Jeffrey's read (<500ms load)
  - Trend layer: 7d/30d/90d HRV/sleep/recovery + lab biomarker overlay + symptom heatmap + adherence calendar + intervention markers
  - Brushable timeline mandatory
  - Built on canonical signal layer's continuous aggregates
- **I-28..I-30** Jeffrey workflow library: 5–8 canonical workflows (morning check-in, post-lab review, missed-adherence nudge, weekly-summary, escalation handoff)
- **I-31..I-33** Health-signal emission: structured events to Postgres for downstream analytics (Issue #35 from roadmap)
- **B2 slices for Jeffrey**: tool-calling (TI eval set goes live), memory writes (MR eval set goes live), audit instrumentation (audit-event eval set goes live)

**Exit criteria:** The full eval suite (8 sets) runs end-to-end with the OPENAI_API_KEY_EVALS in CI and produces meaningful pass/fail. DNR + SR at 100% pass. H-T at >95%. MR/TI/PT/BV at >80%. **Daily engagement loop running**: user gets morning push → talks to Jeffrey ~75s → reflects on last night's data → analytics v1 surfaces the day's read. Personal data fusion (wearable + lab + journal) visible end-to-end.

### Phase 4 Beta-ready Compliance + Differentiation — Weeks 11–14 (Jul 10 – Aug 6)

Goal: **HIPAA-defensible posture + commercial baseline + Analytics v2 (the differentiation moment).** This phase runs in parallel with the tail of Phase 3.

- **HIPAA-1** AWS BAA executed (free; paperwork)
- **HIPAA-2** OpenAI BAA executed (Enterprise tier; required for sending PHI through OpenAI). Once executed, journal NLP extraction service (`services/journal-extraction`) goes live.
- **HIPAA-3** ElevenLabs DPA verified (TTS only — should not see PHI; verify with vendor); voice journaling responses pre-stripped of biomarker values per `JEFFREY_VOICE_LAYER_SPEC` §11
- **HIPAA-4** All PHI tables in Postgres get row-level security; non-PHI services use a separate DB role. Journal_* and signals_canonical tables explicitly tagged `data-class=phi`.
- **HIPAA-5** S3 bucket for lab PDFs gets KMS encryption with customer-managed key + bucket policies. Journal voice audio bucket on same posture.
- **HIPAA-6** Audit log retention 6 years (HIPAA requirement); auto-archive to S3 Glacier after 90 days hot
- **HIPAA-7** Audit-log access controls: app cannot read/write its own audit log via standard route; dedicated admin endpoint with elevated auth
- **HIPAA-8** Privacy policy + Notice of Privacy Practices drafted by health-law attorney (1-hour call queued — still needed)
- **HIPAA-9** Data classification doc: PHI vs non-PHI tables explicitly labeled; non-PHI services blocked at the network layer from reaching PHI
- **HIPAA-10** Incident response runbook
- **A2-1..A2-4** **Analytics v2 — Causal layer** (`services/causal-inference` Python FastAPI service ships):
  - Per-intervention attribution panel (Cohen's d + bootstrap CIs + confidence labels per `JOURNAL_AND_ANALYTICS_SPEC` §6)
  - "What's actually working?" screen per spec §7 (the differentiation moment)
  - Predictive forecast (Prophet trend + Bayesian state-space short-horizon)
  - Confounder controls (alcohol, training, travel, illness, season, stressor, late meals, caffeine)
- **A2-5** **Counterfactual sliders (preview)** — synthetic-control-like rough estimates for "what if I'd stopped Vit D at week 6?". Marked "preview / experimental" in UI per Decision #14.
- **A2-6** Journal NLP extraction service goes live (post-HIPAA-2). Free-text → symptoms / events / wins / concerns / questions. Confidence-thresholded; below 0.6 surfaced for next-day confirm.
- **STRIPE-1..STRIPE-4** Subscription billing live (Stripe Connect + webhook receiver + cadence change + pause/cancel UI)
- **ADMIN-1..ADMIN-4** Basic admin console: user lookup, recommendation trace viewer, manual override path
- **OPS-1** Beta cohort onboarding flow (invite codes, allocation queue from `apps/site/api/investor/allocation-status`)

**Exit criteria:** Beta-ready. Defensible HIPAA posture. Stripe charging real cards. Admin can audit any recommendation. **"What's actually working?" screen live with at least one user (Ron) seeing real personal attribution.** Counterfactual slider visible (preview-labeled). Daily engagement loop running with voice-first journal feeding causal inference.

### Beta Launch — Week 15 (Aug 7 – Aug 13)

- Final security pass (pen-test if budget allows; OWASP scan minimum)
- 10-user smoke cohort (Ron + 9 close advisors) — 1 week
- Open to 50-user beta cohort (week 16)
- Open to 200-user beta cohort (week 18)

### Total: ~15 weeks from today to Beta launch.

That's **mid-August 2026** for the 50-user beta and **end of August** for the 200-user expansion.

---

## 3. HIPAA-COMPLIANT AWS INFRASTRUCTURE PLAN

This is the section the v1.0 charter glossed over. Concrete steps below.

### 3.1 AWS account posture

| Item | Action | When |
|---|---|---|
| AWS Organizations | Create org with separate accounts: `aissisted-prod`, `aissisted-staging`, `aissisted-dev` | Phase 1 week 1 |
| AWS BAA | Execute (free, online) | Phase 1 week 1 |
| Tag policy | Mandatory tags: `env`, `data-class` (`phi`/`non-phi`/`public`), `owner`, `cost-center` | Phase 1 week 1 |
| Root user | Hardware MFA, never used after setup | Phase 1 week 1 |
| Identity Center (SSO) | All human access via SSO; no IAM users | Phase 1 week 1 |
| CloudTrail | All accounts → centralized log archive bucket with object-lock + 7-year retention | Phase 1 week 1 |
| Config | Enabled in all accounts; conformance pack `Operational-Best-Practices-for-HIPAA-Security` applied | Phase 1 week 2 |
| Security Hub | Enabled with HIPAA security standard | Phase 1 week 2 |
| GuardDuty | Enabled in all regions | Phase 1 week 2 |

### 3.2 Network and compute

| Layer | Choice | Rationale |
|---|---|---|
| **VPC** | Private subnets for compute and data; public only for ALB | PHI never on a public IP |
| **Compute (`apps/api`)** | ECS Fargate behind ALB | Containerized; no patching; fits Fastify; auto-scales |
| **Compute (Vercel)** | `apps/web` and `apps/site` on Vercel Pro | Same as today; Vercel signed BAA available on Enterprise — verify before sending PHI through Vercel functions |
| **Database** | RDS Postgres (Multi-AZ, encryption-at-rest with KMS CMK, automated backups 35 days, point-in-time recovery) | HIPAA-eligible service |
| **Cache** | ElastiCache Redis (encryption in transit + at rest, in private subnet) | Session memory for Jeffrey |
| **Object store** | S3 with bucket policies enforcing TLS, KMS CMK encryption, public access block, versioning, MFA delete on PHI buckets | Lab PDFs, audit log archives |
| **Secrets** | AWS Secrets Manager with KMS CMK; auto-rotation for DB credentials | No secrets in env files in production |
| **Container registry** | ECR with image scanning enabled | Catch CVEs before deploy |
| **DNS** | Route 53 with DNSSEC | `aissisted.me`, `app.aissisted.me`, `api.aissisted.me` |
| **Edge** | CloudFront in front of ALB and S3; WAF with AWS managed rules + rate-limit | Mitigates basic attacks |
| **ACM** | ACM certificates for `*.aissisted.me` | TLS 1.2 minimum, 1.3 preferred |

### 3.3 PHI handling specifics

- **Tagging**: every resource that handles PHI tagged `data-class=phi`. Cost reporting and access policies key off this.
- **OpenAI BAA**: required if PHI is sent in prompts. Two paths:
  - (a) Sign Enterprise BAA with OpenAI (preferred — straightforward)
  - (b) Build a redaction layer that strips PHI before any prompt and re-injects post-hoc — adds complexity, only do this if (a) isn't workable
- **ElevenLabs**: shouldn't see PHI; jeffrey responses are health-adjacent but synthesized for voice. Confirm in their DPA whether they can be considered a "Conduit" rather than a Business Associate. If not, sign a BAA.
- **Audit log retention**: 6 years per HIPAA. Hot tier in Postgres for 90 days, then archive to S3 Glacier with object-lock.
- **Encryption**: at-rest mandatory (KMS CMK); in-transit mandatory (TLS 1.2+); encrypted EBS volumes; encrypted RDS; encrypted S3.
- **Key management**: customer-managed KMS keys for PHI. Separate key for audit logs. Annual rotation.
- **Backup**: RDS automated backups in same KMS scope. Quarterly restore drill.
- **Access reviews**: quarterly; documented in Confluence/Notion.

### 3.4 Concrete deliverable list (for Phase 1 week 1–2)

- [ ] `infra/aws/` Terraform repo (separate from main monorepo or as a sibling)
- [ ] CloudFormation/Terraform for: VPC, RDS, ElastiCache, ECS cluster, ALB, ECR, S3 buckets, KMS keys, Secrets Manager
- [ ] GitHub Actions OIDC trust policy → eliminates long-lived AWS keys in CI
- [ ] `docs/specs/SECURITY_AND_COMPLIANCE_V1.md` — HIPAA control mapping (gap from v1.0 charter §14 item 9)

---

## 4. CLAUDE DESIGN UI/UX SCOPE

You already have a Claude Design canvas at `aissisted-system.html` with a System Reference (brand tokens, color, type) and onboarding screens led by Jeffrey. The runtime issue earlier today (`missing EndStreamResponse`) was Claude Design choking on long single-file generations.

### 4.1 Recommended Claude Design structure

Split the canvas into focused files (each <2000 lines so Claude Design doesn't time out mid-generation):

| File | Contents | Status |
|---|---|---|
| `aissisted-system.html` | Tokens, type ramp, color, motion CSS | ✅ Exists |
| `aissisted-onboarding.html` | Onboarding flow (the 9-step Lemonade-style sequence from v1.0 §5.1) | Partial |
| `aissisted-dashboard.html` | Dashboard tile library + 6 tile variants (Readiness, HRV, Sleep, Vitamin D, Adaptation log, Formula) | Not built |
| `aissisted-protocol.html` | Protocol view + ingredient detail + change history + diff viewer | Not built |
| `aissisted-jeffrey.html` | Voice modal + transcript view + memory surface | Not built |
| `aissisted-labs.html` | Lab upload + results view + biomarker trends | Not built |
| `aissisted-empty-states.html` | Empty/loading/error states across all surfaces | Not built |

### 4.2 Build order in Claude Design

| Order | File | Why this order |
|---|---|---|
| 1 | Dashboard | Highest-traffic surface; defines tile pattern that other screens reuse |
| 2 | Onboarding | Critical path for new-user activation |
| 3 | Jeffrey voice modal | Brand-defining moment; needs polish |
| 4 | Protocol view | The "reveal" payoff after onboarding |
| 5 | Labs | Trust-building; data-heavy |
| 6 | Empty states | Maturity polish |

### 4.3 How to avoid the EndStreamResponse error

The error happened because you asked Claude Design to generate 6 interactive screens in one file. **Constrain each request to one screen at a time**, in a new file. Example prompt for Dashboard:

> "Create a new file called `aissisted-dashboard.html`. In that file, build ONLY the Dashboard hero (Readiness tile). Use the brand tokens already defined in `aissisted-system.html`. Do not build other tiles yet. Do not modify aissisted-system.html. When done, stop and wait for my next instruction."

Then iterate one tile per prompt. ~5 prompts per screen, ~6 screens = 30 prompts, ~3–4 days of work spread across a week.

### 4.4 Handoff to engineering

Each Claude Design HTML doubles as a visual spec for the corresponding `apps/web` route:

| Claude Design file | `apps/web` route | Engineering handoff |
|---|---|---|
| dashboard | `app/dashboard/page.tsx` | Already scaffolded; replace placeholder UI with token-aligned components |
| onboarding | `app/onboarding/page.tsx` | Already scaffolded; brand-voice pass + token enforcement |
| jeffrey | `app/jeffrey-live/page.tsx` | Already scaffolded; align voice modal copy + motion |
| protocol | `app/stack/page.tsx` | Already scaffolded; tile pattern from dashboard |
| labs | `app/labs/page.tsx` | Already scaffolded; add OCR upload + results |

The Claude Design output isn't deployed directly — it's the visual spec that the engineering team (Code) implements against the existing scaffolded routes.

### 4.5 Estimate

Three to four weeks of intermittent Claude Design work, parallel to Phase 2 + Phase 3 engineering. Doesn't extend the critical path because Claude Design is upstream of the engineering implementation, which can absorb the design lag.

---

## 5. EMAIL MIGRATION: rongibori@gmail.com → ron@aissisted.me

You mentioned a screenshot. **It didn't attach to this turn — only the v1.0 charter file came through.** Please re-send the screenshot of the draft emails so I can specify exactly what needs to be ported. In the meantime, the migration setup itself doesn't depend on the screenshot:

### 5.1 Domain and mailbox setup (one-time, ~1 day)

| Step | Action | Owner |
|---|---|---|
| 1 | Choose mail provider: **Google Workspace** (recommended — same UX as Gmail, $6/user/mo Business Starter) or Microsoft 365 ($6 too). Google Workspace assumed below. | Ron |
| 2 | Sign up at workspace.google.com using `aissisted.me` domain. Initial admin: ron@aissisted.me | Ron |
| 3 | Verify domain ownership (TXT record in Route 53) | Cowork can prep DNS commands |
| 4 | Add MX records pointing to Google Workspace mail servers | Cowork can prep DNS commands |
| 5 | Add SPF, DKIM, DMARC records (deliverability) | Cowork can prep DNS commands |
| 6 | Provision `ron@aissisted.me` as primary mailbox | Ron in Workspace admin |
| 7 | Provision common aliases: `hello@`, `support@`, `legal@`, `privacy@`, `security@` | Ron in Workspace admin |
| 8 | Provision shared mailboxes if needed: `investors@` for investor-room replies | Ron in Workspace admin |

### 5.2 Migrating from rongibori@gmail.com

| Concern | Resolution |
|---|---|
| Existing inbox | Use Google's "Migrate from Gmail" tool (Workspace admin → Data migration). Migrates last 6–12 months of emails automatically. |
| Drafts you mentioned (the screenshot) | Once I see the screenshot, I'll provide a copy-paste-ready version with: (a) header from `Ron Gibori <ron@aissisted.me>`, (b) signature block matching brand voice, (c) any Aissisted-relevant context |
| Forwarding for transition | Set rongibori@gmail.com to forward to ron@aissisted.me for 90 days; auto-respond on rongibori@gmail.com after 90 days saying "I've moved to ron@aissisted.me — please update your records" |
| Contacts | Export Gmail contacts → import into Workspace |
| Calendar | Calendar migrates with the data migration tool |
| Drive files | Optional — keep on personal Drive or migrate; Workspace gives 30 GB on Business Starter |
| Account-recovery email accounts (banks, etc.) | Switch to ron@aissisted.me one at a time; high-value first (banks, tax services, AWS, GitHub, OpenAI dashboard, Anthropic console) |

### 5.3 Brand-voice signature

```
Ron Gibori
Founder, Aissisted
ron@aissisted.me  ·  aissisted.me

Personalized well-being, powered by intelligent science.
```

(Adjust per brand voice — currently a placeholder until I see the screenshot for tone calibration.)

### 5.4 Send-as and delegation

In Gmail, set up **send-as** so you can keep replying from a single inbox:
- Primary: ron@aissisted.me
- Send-as: hello@aissisted.me (for investor outreach)
- Send-as: legal@aissisted.me (only when corresponding with attorneys)

This avoids needing to switch accounts.

### 5.5 Once the screenshot is shared

I'll generate the rewritten email drafts directly into a file at `/Users/rongibori/aissisted/jeffrey/email-drafts/` (or wherever you prefer). You'll have copy-paste-ready text from `ron@aissisted.me` with brand-aligned tone.

---

## 6. DECISIONS — RESOLVED 2026-04-30

| # | Decision | Choice | Status |
|---|---|---|---|
| 1 | AWS region for production | **us-east-1 primary, us-west-2 DR** | ✅ Decided |
| 2 | OpenAI BAA: Enterprise tier vs redaction layer | **Sign Enterprise BAA** | ✅ Decided — outreach email drafted to compliance@openai.com |
| 3 | Beta gating: how does cohort sign up | **Reuse investor-room allocation queue** (already built — `apps/site/api/investor/allocation-status`) | ✅ Decided |
| 4 | Stripe rollout: subscription-only or +one-time | **Subscription-only for beta** | ✅ Decided |
| 5 | Fulfillment for beta cohort | **Manual for first 50, compounder by 200-user expansion** | ✅ Decided |
| 6 | iOS app for Apple HealthKit | **Defer to post-beta** | ✅ Decided |
| 7 | Email provider | **Google Workspace** — `ron@aissisted.me` already provisioned | ✅ Done |
| 8 | Health-law attorney engagement | **Schedule the 60-minute call this week** | 🟡 Action item — not blocking until Phase 4 (HIPAA-9 privacy policy) |
| 9 | Daily journal modality (Phase 2 MVP vs Phase 3 voice-first) | **Phase 2 ships text-first chip+symptom MVP; Phase 3 layers in voice-first via Jeffrey modal** | ✅ Decided |
| 10 | Wearable signal sources at beta | **WHOOP + Oura at beta. Apple Watch deferred to v1.1 post-beta.** Three sources interchangeable + combinable at canonical signal layer once all three ship. | ✅ Decided |
| 11 | OpenAI for journal NLP extraction (pre-BAA) | **Defer extraction until Enterprise BAA executes (Phase 4).** Phase 3 Analytics v1 doesn't need NLP-extracted facts; structured tags + symptom scales are sufficient signal. | ✅ Decided |
| 12 | Cohort augmentation timing for causal panels | **Ship causal panels with personal-only attribution at Phase 4 launch.** Cohort priors layered post-launch when k-anonymity ≥ 20 is viable (~1000 user cohort). | ✅ Decided |
| 13 | Lab-draw cadence in $149/mo bundle | **4× / year baseline draws stay in bundle.** Clinician-on-call decision separate, driven by Phase 4 health-law attorney advice. | ✅ Decided |
| 14 | Counterfactual slider at Analytics v2 | **Ship at v2 with "preview / experimental" label.** The slider IS the magic moment; "preview" gives cover for early roughness. | ✅ Decided |
| 15 | Time-series storage for wearable + biomarker data | **TimescaleDB on Postgres** (hypertables + continuous aggregates). Stays inside existing PG stack; HIPAA-eligible on AWS RDS. | ✅ Decided |
| 16 | Causal inference compute | **Python FastAPI service** (`services/causal-inference`) with DoWhy + EconML + statsmodels. Industry-standard causal stack; not native to TS/Node. | ✅ Decided |
| 17 | Frontend visualization library | **Observable Plot primary + D3 escape hatch.** Brushable + linked views native; D3 for bespoke (heatmap, counterfactual slider). | ✅ Decided |

### 6.1 Implications of these decisions

- **AWS us-east-1 primary**: Phase 1 Terraform targets us-east-1 first; us-west-2 DR setup deferred to Phase 4 weeks 11-12.
- **OpenAI Enterprise BAA**: Phase 1 Week 1 includes BAA execution (after Ron's email reaches OpenAI compliance and tier upgrade closes). PHI flows freely in prompts once signed; no redaction-layer engineering needed.
- **Investor-room allocation queue as beta gate**: No new signup infrastructure. Phase 4 Week 11 task is updating the queue copy to reflect "beta access" framing instead of "investor allocation."
- **Subscription-only Stripe**: Single plan in Phase 4; pause/cancel UI required by week 13. No one-time-purchase flow.
- **Manual fulfillment for first 50**: Compounder partner selection runs in parallel as Phase 4 commercial track; deal close by week 14 for the 200-user expansion.
- **iOS deferred**: WHOOP + Oura + manual lab PDF covers Beta data signal. iOS native app is a Phase 5 (post-public-launch) build.
- **Phase 2 text-first journal MVP**: ~30s daily entry surface (chip-style adherence + 5-tag symptom log + free-text typed). Voice-first deferred to Phase 3 when Jeffrey voice modal is the primary surface.
- **WHOOP + Oura at beta, Apple deferred**: matches the iOS-deferred-to-post-beta decision (Apple HealthKit needs an iOS native bridge). WHOOP + Oura covers ~70% of target signal; Apple lands at v1.1.
- **Defer journal NLP extraction until BAA**: Phase 2/3 journal captures structured tags + free-text typed/transcribed but doesn't run free-text through OpenAI until Phase 4 BAA closes. Analytics v1 (Phase 3) doesn't need extracted facts to function.
- **Personal-only attribution at causal v2 launch**: Cohort augmentation comes later. The personal N-of-1 inference is the differentiation; cohort prior is icing.
- **Lab cadence in bundle**: Reinforces premium positioning. Removes price sensitivity around add-on lab fees.
- **Counterfactual slider as preview**: Marked "preview / experimental" in UI; gives cover for the synthetic-control approach being early-stage.
- **TimescaleDB on Postgres**: Avoids introducing a separate time-series DB (Influx, ClickHouse). RDS Postgres already in Phase 1 infra plan; TimescaleDB is a Postgres extension. One stack to manage.
- **Causal inference as Python service**: Decoupled from `apps/api` (Node/Fastify). Communicates via internal HTTPS; deployed alongside API on ECS Fargate. Adds ~$20/mo at beta scale (small Fargate task, mostly idle, computes on-demand).
- **Observable Plot for analytics canvas**: Recharts is sufficient for simple trend tiles in Phase 3 Reflection layer; Observable Plot is required for the brushable + linked-views Trend layer and the bespoke Causal layer in Phase 4.
- **Workspace done**: DNS records visible in Ron's drafts list (5 BAA outreach drafts queued from `ron@aissisted.me`).
- **Attorney**: 60-minute call to schedule; doesn't block Phases 1–3, but Privacy Policy + Notice of Privacy Practices need to be in flight by Phase 4 Week 11. Recommended booking date: any day Weeks 5–8 (mid-Phase 2).

---

## 7. RISKS

Carry-over from v1.0 charter §13, updated for current state:

| Risk | Status today | Mitigation |
|---|---|---|
| OpenAI Realtime API/pricing change | LOW — stable since spring 2026 | Fallback path (Whisper + Claude + ElevenLabs) is already in `packages/jeffrey/voice.ts` |
| WHOOP / Oura rate limits | MEDIUM — known issue | Backoff already implemented; verify under live-sync load in Phase 2 |
| HIPAA OpenAI BAA timing | HIGH if not started | Initiate Phase 1 week 1 |
| Vector memory drift / forget rules | MEDIUM | Phase 3 I-14..I-17 covers; basic forget-on-request UI for beta |
| Compounder relationship | HIGH | Beta starts manual; partner deal must close by week 10 |
| Single-operator (Ron) bottleneck on QA | HIGH | Eval suite (just shipped) covers regression; user QA needs at least 1 beta-user-feedback intake person by week 12 |
| Browser extension / mount issues during dev (today's `missing EndStreamResponse`) | LOW operationally, HIGH morale | Document in `docs/troubleshooting.md`; not blocking Beta |
| Email migration disrupts ongoing investor conversations | MEDIUM | 90-day forward + send-as keeps continuity |

---

## 8. WHAT I'LL DO NEXT (without further input from you)

1. Open the PR for `feat/jeffrey-evals-package` → main (per task #21) — single command if you tell me to
2. Prep DNS commands for `aissisted.me` MX/SPF/DKIM/DMARC — output ready to apply once Workspace is signed up
3. Draft `docs/specs/SECURITY_AND_COMPLIANCE_V1.md` (HIPAA control mapping) — the gap from v1.0 charter §14 item 9
4. Once you send the email screenshot — rewrite drafts under `ron@aissisted.me` brand voice

## 9. WHAT YOU NEED TO DO

| Item | Time | Why |
|---|---|---|
| Confirm or amend Beta scope (§1.3) | 5 min | Anchors everything else |
| Decisions §6 #1–#8 | 30 min total | Gates Phase 1 work |
| Send the email draft screenshot | 1 min | Unblocks §5.5 |
| Sign Google Workspace + AWS BAA | 30 min | Phase 1 prerequisite |
| Schedule health-law attorney call | 5 min calendar block | Phase 4 prerequisite |
| Identify beta cohort source (investor-room queue or fresh) | 5 min | Phase 4 prerequisite |
| Approve Phase 1 close-out budget if any (AWS spend ~$200/mo for first dev environment, ~$1500/mo at production beta scale) | 5 min | Phase 1 prerequisite |

---

## 10. CHANGELOG

| Date | Version | By | Change |
|---|---|---|---|
| 2026-04-30 | 1.0 | Cowork | Initial draft. Supersedes v1.0 charter for Beta scope. Anchors against `docs/roadmap.md` v3. |

---

*End of document. Next review: after Ron ratifies §1.3 (Beta scope) and §6 (decisions). Once ratified, this becomes the canonical execution plan for Beta.*
