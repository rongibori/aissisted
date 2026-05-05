# Aissisted — Build Roadmap v3

**Date:** 2026-04-21
**Status:** Canonical. Supersedes `docs/roadmap.md` (2026-04-19 stub).
**Author:** Planner (Cowork)

---

## 1. Where we stand

The foundation is built. What remains is closing the wiring gaps, shipping the intelligence layer that was specced but not executed, and standing up the commercial surface.

**Scale of what's already on disk:**

- **apps/api** — Fastify, 11 route groups, 14 services, 20 DB tables, rules engine (sleep, inflammation, hormones, energy, cognition), interaction + allergy safety checks, auth + JWT + rate limiting, 3 integrations scaffolded (WHOOP, FHIR/Epic, Apple Health), audit log.
- **apps/web** — Next.js 15, every authenticated surface present: dashboard, chat (with voice), jeffrey-live, labs, profile, stack, adherence, integrations, onboarding, login, register.
- **apps/site** — Next.js 15, public surface: home, for-you, how-it-works, science, longevity, pricing, faq, contact, investor-room, request-access.
- **packages** — 8 packages. Canonical Jeffrey brain (one provider, one key, every surface). Brand tokens v1.1. Domain models. DB (Drizzle). Shared UI. Shared types. Integrations clients.
- **Voice** — OpenAI Realtime WS proxy live. Browser hook live. ElevenLabs TTS relay live. /chat voice panel live.
- **Brand** — Locked hex + typography, decision filter enforced, palette budget tooling shipped.

What this means: we are not building a product. We are finishing and commercializing one.

---

## 2. The four remaining phases

Per standard phasing (Foundation → Core → Intelligence → Scale), the honest read is:

| Phase | Status | Remaining weight |
| --- | --- | --- |
| 1 · Foundation | 95% done | Close gaps — CI gates, deploy |
| 2 · Core | 70% done | Polish + end-to-end proof |
| 3 · Intelligence | 40% done | Agent layer + adaptive loop + memory lifecycle |
| 4 · Scale + Commercial | 10% done | Billing, ops, provider-side, compliance sign-off |

---

## 3. Phase 1 · Foundation — closing gaps (≈2 weeks)

The repo is healthy. These are the honest gaps.

### 1.1 CI hardening
Current CI runs `build` only. Typecheck and tests are written but not gated. Bugs can land on main.

- **[F-1]** Add `typecheck` job to `.github/workflows/ci.yml` running `pnpm -r typecheck`
- **[F-2]** Add `test` job running `pnpm -r test` (currently vitest on api + engine)
- **[F-3]** Make both required checks for branch protection on `main`
- **[F-4]** Add lint check (`pnpm -r lint`) — lint rules TBD, minimal pass acceptable

### 1.2 Observability baseline
Today: `console.warn` only. No structured logs, no error reporting, no metrics.

- **[F-5]** Wire Sentry in `apps/api/src/index.ts` + `apps/web/app/layout.tsx` + `apps/site/app/layout.tsx` (gate on `SENTRY_DSN`)
- **[F-6]** Structured logger in `apps/api` (pino recommended, fastify-native) replacing `console.*` calls
- **[F-7]** Request-ID propagation through chat → jeffrey → openai path for tracing

### 1.3 Production deployment
`docs/deployment.md` is a complete runbook. Nothing is deployed.

- **[F-8]** Stand up Neon or Render Postgres → set `DATABASE_URL`
- **[F-9]** Deploy `apps/api` to Render (WS-capable, Dockerfile ready) at `api.aissisted.com`
- **[F-10]** Deploy `apps/web` to Vercel at `app.aissisted.com`
- **[F-11]** DNS + SSL for both subdomains
- **[F-12]** Run end-to-end `/jeffrey-live` verification per runbook §7

### 1.4 Repo hygiene
- **[F-13]** Replace `docs/roadmap.md` stub with this document
- **[F-14]** Clean macOS Finder duplicate files (`apps/web/**/* 2.tsx`, `docs/deployment 2.md`) — not tracked, but cluttering the working tree

---

## 4. Phase 2 · Core — end-to-end proof (≈4 weeks)

The screens exist. The question is whether a real person can go from landing → sign-up → lab upload → wearable sync → protocol → daily check-in without breaking.

### 2.1 Onboarding (end-to-end)
- **[C-1]** QA full flow: register → email verify → profile → goals → integrations picker → first protocol
- **[C-2]** Brand-voice pass on every screen's copy against `docs/specs/BRAND_FILTER_SPEC.md`
- **[C-3]** Empty-state design for zero-data users — no biomarkers yet, no wearable connected, no goal set
- **[C-4]** Progress indicator / resumable onboarding (currently unclear if state persists across sessions)

### 2.2 Lab ingestion
- **[C-5]** Audit `apps/api/src/routes/biomarkers.ts` + `apps/web/app/labs` — can a person drop a LabCorp / Quest PDF and see normalized biomarkers?
- **[C-6]** Expand `packages/integrations/src/labNormalizer.ts` coverage — LabCorp + Quest + BostonHeart + Genova at minimum
- **[C-7]** Manual-entry fallback for biomarkers the parser misses
- **[C-8]** Lab-history timeline UX on `/labs` (trend visualization — slope + status + unit conversion)

### 2.3 Wearable live-sync
- **[C-9]** WHOOP OAuth happy path — authorize → first sync → visible data in dashboard
- **[C-10]** Scheduled sync (node-cron is in deps — confirm wired in `apps/api`)
- **[C-11]** Apple Health: export.zip drop flow + parse + normalize (scaffold exists)
- **[C-12]** Oura (planned in brand docs, not scaffolded) — add adapter following WHOOP pattern

### 2.4 FHIR / Epic
- **[C-13]** SMART-on-FHIR auth flow end-to-end against an Epic sandbox
- **[C-14]** Epic resource → biomarker normalization coverage audit (currently `fhir/normalizer.ts` + `syncBatches` table)
- **[C-15]** Error surfaces for FHIR sync failures (currently silent catches in places)

### 2.5 Supplement stack UX
- **[C-16]** `/stack` page audit — is the ranked protocol readable, explainable, swappable?
- **[C-17]** Per-supplement explain drawer (mechanism + evidence + timing + source link)
- **[C-18]** Manual override ("I already take X") reflecting in scoring

### 2.6 Adherence loop
- **[C-19]** Daily check-in prompt via Jeffrey (voice + text)
- **[C-20]** Supplement logging UX — tap to log on mobile, voice log via Jeffrey
- **[C-21]** Adherence score visualization on dashboard (backend exists, UI state unclear)

---

## 5. Phase 3 · Intelligence — the product thesis (≈6 weeks)

This is where Aissisted stops being a logger and becomes the operating system for a body. The specs exist. The execution does not.

### 5.1 Agent layer decomposition
`docs/specs/AGENT_LAYER_IMPLEMENTATION_PLAN.md` describes a 5-PR cut that replaces the `jeffrey.service.ts` monolith with a typed orchestrator routing to data / product / engineering / brand agents. This plan is ready to execute.

- **[I-1]** Scaffold `apps/api/src/agents/` with typed contracts from `ORCHESTRATOR_ROUTING_SPEC.md`
- **[I-2]** Extract `intentClassifier` from `intent.ts` into an agent
- **[I-3]** Build `stateLoader.getSlice(userId, requiredKeys)` — replaces ad-hoc context assembly
- **[I-4]** Build `planBuilder.plan(intent, context)` — deterministic plan tree
- **[I-5]** Build `executor.run(plan)` orchestrating data / product / engineering / brand agents
- **[I-6]** Wire `safetyGate.inspect(agentOutputs)` before reply
- **[I-7]** Wire `brandFilter.filter(output)` before reply (already specced in `BRAND_FILTER_SPEC.md`)
- **[I-8]** Migrate `routes/chat.ts` from direct `chat()` call to `orchestrator.handle()`
- **[I-9]** Deprecate monolithic `jeffrey.service.ts` once orchestrator is stable

### 5.2 Adaptive protocol tuning
Today: adherence adjusts the score (`protocol.service.ts` lines 74–82). Lab-delta feedback loop is not wired.

- **[I-10]** Biomarker-change → recommendation-score adjustment (if Vit D rose after 90 days on D3 → lock that rec; if CRP didn't fall after curcumin → down-rank)
- **[I-11]** Time-to-effect awareness (don't judge a 6-week intervention at 2 weeks)
- **[I-12]** Stop / swap / continue decision logic surfaced to the person in Jeffrey's voice
- **[I-13]** A/B protocol variants for ambiguous cases (ashwagandha vs rhodiola for energy/stress profiles)

### 5.3 Memory lifecycle
DB-backed memory adapter exists (Task #54). The policy for what gets written, when, and by whom is not yet defined.

- **[I-14]** Write-policy spec: which turns become long-term entries, which stay session-only
- **[I-15]** Entry types: `preference`, `clinical-context`, `commitment`, `safety-flag` — each with retention + surfacing rules
- **[I-16]** Memory consolidation pass (dedupe, stale-entry pruning) — scheduled job
- **[I-17]** Surfacing rules — when Jeffrey references memory ("you mentioned last month…") and when it stays quiet

### 5.4 Safety rule pack v1
`docs/specs/SAFETY_RULE_PACK_V1.md` exists. Today `engine/interactions.ts` handles drug interactions + allergy blocking.

- **[I-18]** Medication-specific contraindications (statin + red yeast rice; warfarin + vitamin K; SSRIs + 5-HTP)
- **[I-19]** Condition-specific contraindications (kidney disease + high-dose potassium; thyroid + iodine; autoimmune + immune stimulants)
- **[I-20]** Dose ceiling enforcement per biomarker status (don't recommend 10,000 IU D3 for someone already at 80 ng/mL)
- **[I-21]** Escalation triggers for clinical review (critical labs, medication conflicts, cancer history flags)

### 5.5 Jeffrey workflow library
Voice is live. Proactive workflows are not.

- **[I-22]** Morning check-in (voice-initiated via schedule): review overnight WHOOP data + nudge day's protocol
- **[I-23]** Post-lab debrief (triggered when new biomarkers land): Jeffrey walks the deltas
- **[I-24]** Weekly review (Sunday evening): adherence summary + week-ahead adjustments
- **[I-25]** Refill triggers (when predicted supply runs low based on adherence logs)

### 5.6 Health-signal emission (Issue #35)
Draft spec exists. Not executed. This is the foundation for the adaptive loop — structured signal events instead of ad-hoc table writes.

- **[I-26]** Implement `emitSignal()` contract from spec
- **[I-27]** Refactor existing state writes to emit signals (biomarker change, adherence drop, goal update, med change)
- **[I-28]** Signal → downstream reaction wiring (adaptive tuning, memory write, Jeffrey proactive nudge)

---

## 6. Phase 4 · Scale + Commercial — making it a company (≈8 weeks)

Paid access, provider-side, compliance.

### 6.1 Billing
- **[S-1]** Stripe integration — subscription product, pricing tiers per business-model memo
- **[S-2]** `/pricing` → checkout flow on apps/site
- **[S-3]** Entitlement enforcement in apps/api (paywall protocol generation, advanced features)
- **[S-4]** Dunning + churn email flows (Loops / Postmark)
- **[S-5]** Annual vs monthly + trial period handling

### 6.2 Commerce — supplement fulfillment
The data business is one lane. The product business is the other.

- **[S-6]** Supplement catalog schema + admin surface
- **[S-7]** Inventory + fulfillment partner integration (Amazon MCF / ShipBob / direct)
- **[S-8]** Quality tier selection per recommendation (pharma-grade vs standard)
- **[S-9]** Subscribe-and-adapt logic (ship revises when protocol changes)

### 6.3 Provider / care-team
Original Phase 3 from legacy roadmap. Needed for the B2B2C lane + MD-supervised positioning.

- **[S-10]** Provider account model + invite flow
- **[S-11]** Patient roster view for providers
- **[S-12]** Annotated protocol review (provider can approve / modify / flag)
- **[S-13]** HIPAA-grade messaging between provider and person

### 6.4 Admin / ops
- **[S-14]** Internal admin surface — person lookup, protocol audit, integration status
- **[S-15]** Support runbook tooling (impersonation with audit log, data export on request)
- **[S-16]** Metrics dashboard — cohort adherence, protocol outcomes, integration health

### 6.5 Compliance + HIPAA readiness
- **[S-17]** BAA executed with every vendor touching PHI (OpenAI, ElevenLabs, Render, Vercel, Neon, Sentry)
- **[S-18]** Audit log review + retention policy (table exists, policy pending)
- **[S-19]** Token encryption rotation procedure (`TOKEN_ENCRYPTION_KEY` in env, rotation path pending)
- **[S-20]** Penetration test before commercial launch
- **[S-21]** Medical advisory board formalization + clinical review channel for escalated cases
- **[S-22]** Consent record audit — every data flow has a matching consent entry in `consent_records`

### 6.6 Performance + scale
- **[S-23]** Rate limiting per-tier (free vs paid)
- **[S-24]** Realtime WS scaling — today one Render instance; plan for horizontal scale + sticky sessions
- **[S-25]** DB read replicas for dashboard / history queries
- **[S-26]** Background job infrastructure (currently node-cron in-process; migrate to BullMQ + Redis at scale)

---

## 7. Critical path

The tasks gate each other in roughly this order:

```
F-1..F-14 (Foundation gaps)
    │
    ▼
C-1..C-21 (Core end-to-end) ──► first paying person can use the product
    │
    ▼
I-1..I-9 (Agent layer)    ──► Jeffrey becomes coherent at scale
    │
    ▼
I-10..I-28 (Intelligence) ──► product thesis is proven
    │
    ▼
S-1..S-26 (Commercial)    ──► this is a company
```

**The shortest path to revenue** runs F → C → S-1..S-5 (billing only), keeping Intelligence in parallel rather than sequential. That's the defensible read if cash is the constraint.

**The shortest path to the product thesis** runs F → C → I. That's the defensible read if the thesis is the constraint.

Recommended sequencing: run both in parallel — one lane on C→S for revenue, one lane on I for moat. That matches the 3-track priority locked in memory (MVP / site / business model).

---

## 8. Risks + weak assumptions

- **Single-operator risk.** One person planning, one agent executing, no clinical SME loop. A medical board is flagged — needs to move from "in flight" to "formalized" before commercial launch or the regulatory posture is fragile.
- **Adaptive loop feasibility.** I-10..I-13 assume we can attribute lab changes to specific interventions. N=1 causal inference is hard. Soft-launch this with "signal" language, not "cause," until cohort data accrues.
- **Voice latency at scale.** Realtime WS proxy works at a single-instance level. Production-grade voice under load will require OpenAI enterprise access or a fallback path.
- **Epic / FHIR partnership dependency.** Epic App Orchard review is a real gate and can take months. Start the application in parallel with any work that depends on live Epic data.
- **HIPAA posture.** Today is "HIPAA+wellness" per memory — meaning we act HIPAA-compliant but don't claim the regulated category until BAAs + audit are in place. S-17..S-22 is the path from posture to defensible.
- **Commerce complexity.** Fulfillment (S-6..S-9) is a category shift — subscription SaaS to regulated-adjacent CPG. This may be a wedge or a distraction depending on the wholesale-data lane's traction.

---

## 9. Next 14 days (2026-04-21 → 2026-05-05)

Cut through Phase 1 gaps while one parallel track starts Phase 2 QA.

**Week 1 (2026-04-21 → 2026-04-27)**
1. F-1, F-2, F-3 — CI gates (typecheck + test required on main)
2. F-5, F-6 — Sentry + structured logger
3. F-8, F-9, F-10 — Production stand-up on Render + Vercel + Neon
4. C-1 — First end-to-end onboarding walkthrough against deployed stack
5. F-13 — Replace `docs/roadmap.md` with this document

**Week 2 (2026-04-28 → 2026-05-05)**
1. F-12 — `/jeffrey-live` verification against production
2. C-2, C-3 — Brand-voice pass + empty-states across onboarding
3. C-9, C-10 — WHOOP happy path + scheduled sync
4. I-1, I-2 — Begin agent layer scaffolding (parallel lane)
5. S-17 — BAA inventory across every PHI-touching vendor

Decision gate at end of week 2: do we launch a private beta on this stack, or does C-5..C-8 (lab ingestion QA) need another week before anyone but us uses it?

---

## 10. Task-tracking handoff

Every item above (F-_, C-_, I-_, S-_) should become a TaskCreate entry as it enters the active queue, with spec links to `docs/specs/*` where relevant. Do not pre-create all 90+ tasks now — that clutters the queue. Create them in 10-task rolling windows tied to the week plan.
