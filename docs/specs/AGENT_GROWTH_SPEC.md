# AISSISTED — GROWTH AGENT SPEC

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Growth + Product + Engineering
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.1, `AGENT_PRODUCT_SPEC.md` v1.1
**Blocks:** Retention mechanics, referral system, lifecycle messaging, experiment instrumentation, monetization triggers
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS
**Role in agent graph:** invoked on `system.scheduled.review` (parallel with Data), `onboarding.step` (activation hooks), and as an **async advisory layer** for lifecycle and retention decisions. Not in the critical path for real-time user interactions.

---

## 0. OPERATING LINE

> *"Growth is not a campaign. It's a system that compounds."*

The Growth Agent doesn't write ads. It designs **loops** — identity-driven mechanisms where the act of using Aissisted makes the user more invested, more likely to share, and harder to leave.

---

## 1. TENSION

Most growth systems treat acquisition and retention as separate problems solved by separate teams. Acquisition builds funnels. Retention builds engagement features. Neither talks to the other. The result: high CAC, flat retention curves, and a product that feels like it's always marketing to you.

For Aissisted, the product IS the growth engine. A formula that adapts is stickier than any email drip. A protocol rationale that surprises you is more shareable than any referral code. Growth must be embedded in the experience — not bolted on.

## 2. TRUTH

The Growth Agent serves one function: **identify the highest-leverage moment to deepen investment or expand reach, without degrading the experience.**

It operates under three constraints:

1. **Never interrupt a health interaction to sell.** Health comes first. Growth is a second-order effect.
2. **Retention > acquisition.** A retained user is worth 10 acquired ones. Design for compounding, not volume.
3. **Identity-driven sharing > incentive-driven sharing.** "This is mine and it's remarkable" beats "$10 for your friend."

## 3. SHIFT

Treat growth as a **signal-response system**, not a campaign calendar. The Growth Agent watches user state, detects moments of high leverage (milestones, breakthroughs, social triggers), and proposes interventions that the orchestrator weaves into the natural flow.

It never speaks to the user directly. It whispers to other agents.

---

## 4. ROLE

### 4.1 In Scope

- **Activation signal detection** — identifying when onboarding actions predict long-term retention
- **Retention risk scoring** — flagging users drifting toward dormancy before they churn
- **Milestone identification** — detecting shareable moments (90-day streak, first lab improvement, goal achieved)
- **Referral mechanism design** — identity-driven sharing triggers, not discount codes
- **Lifecycle stage classification** — new → activated → engaged → power → at-risk → dormant → winback
- **Experiment instrumentation** — proposing A/B arms for onboarding variants, messaging cadence, disclosure depth
- **Monetization triggers** — upgrade moments, add-on suggestions, subscription cadence optimization
- **Cohort pattern recognition** — detecting which user archetypes convert, retain, and share at highest rates

### 4.2 Out of Scope

- **User-facing copy** → Brand Agent (Growth proposes; Brand renders)
- **Health decisions, protocol logic** → Product Agent + Data Agent
- **Technical execution** → Engineering Agent
- **Safety, compliance** → Safety Gate
- **Ad buying, paid media** → external tools/teams, not agent-scoped
- **Real-time voice/app responses** → this agent is async-first, not inline

### 4.3 Runtime Alignment — Current Repo

Path mapping to the existing monorepo (`~/aissisted`):

| Spec Reference | Planned Path | Notes |
|----------------|-------------|-------|
| Agent interfaces | `packages/domain/agents/` | Shared with other agents |
| Decision schemas | `packages/types/agents/GrowthAgent.ts` | New file |
| System prompt + template | `packages/config/agents/growth/` | New directory |
| Runtime module | `apps/api/src/agents/growth.ts` | Fastify service |
| Growth signal rules | `packages/config/agents/growth/signals.v1.yaml` | Deterministic triggers |
| Lifecycle definitions | `packages/config/agents/growth/lifecycle.v1.yaml` | Stage thresholds |
| Experiment registry | `packages/config/agents/growth/experiments.v1.yaml` | A/B arms |

Existing packages consumed:

- `packages/db/` — Drizzle schema (users, health_profiles, protocols, biomarkers, adherence)
- `packages/config/` — Environment config, feature flags
- `packages/integrations/` — Claude API client wrapper
- `apps/api/src/scheduler.ts` — Background job infrastructure (Growth runs as scheduled + event-triggered)

The `packages/core/` namespace used in type samples below is the **target refactor** from `ORCHESTRATOR_ROUTING_SPEC.md` §8.

### 4.4 Boundary Rule

The Growth Agent **never generates user-facing output directly**. It produces `GrowthSignal` objects that the orchestrator weaves into existing flows. The Brand Agent renders them. The user never knows the Growth Agent exists.

This is the critical line. Cross it, and the product feels like it's selling to you. Hold it, and growth feels like a natural consequence of a product that works.

---

## 5. INPUT — REQUIRED STATE SLICE

```typescript
// Declared in AgentRegistry:
const growthAgent: Agent = {
  name: "growth",
  version: "1.0.0",
  requiredSlice: ["profile", "memory", "protocol", "biometrics"],
  // plus derived engagement metrics — see §5.3
};
```

### 5.1 Always Loaded

- `profile.identity` — archetype, onboardedAt, engagementTier, timezone
- `profile.goals` — active goals, status history
- `memory.preference.communication` — cadence, channel preference
- `memory.episodic` — last 30d of interactions (for frequency/depth analysis)
- `protocol.current` — activeFrom, version (how long on current protocol)
- `protocol.history` — number of adjustments, adaptation frequency

### 5.2 Conditionally Loaded

| Trigger | Additional Slice |
|---------|------------------|
| Retention risk scoring | `biometrics.wearables.lastSyncedAt`, `lifestyle` (engagement proxy) |
| Milestone detection | `biometrics.labs.history` (for improvement detection), `memory.episodic` (milestone type) |
| Monetization trigger | `consent.dataSharing`, `protocol.current.ingredients` (complexity = value signal) |

### 5.3 Derived Engagement Metrics (Computed, Not Stored)

The Growth Agent computes these at invocation time from state + events:

```typescript
interface EngagementMetrics {
  daysSinceOnboarding: number;
  sessionsLast7d: number;
  sessionsLast30d: number;
  avgSessionDepthLast7d: number;          // turns per session
  lastInteractionAt: ISO8601;
  daysSinceLastInteraction: number;
  protocolAdjustmentsTotal: number;
  wearableSyncFrequency7d: number;        // syncs per day
  referralsSent: number;
  referralsConverted: number;
  lifecycleStage: LifecycleStage;
  churnRiskScore: 0 | 1 | 2 | 3;          // 3 = high risk
}
```

### 5.4 Input from Upstream Agents

When running in parallel with Data Agent on `system.scheduled.review`:

```typescript
interface GrowthAgentInput extends AgentInput {
  upstreamOutputs: {
    data?: DataAgentOutput;     // health signals for milestone detection
  };
}
```

---

## 6. OUTPUT — GROWTH SIGNALS

The Growth Agent returns **signals**, not actions. Signals are proposals that the orchestrator can accept, defer, or discard based on timing and context.

```typescript
// packages/types/agents/GrowthAgent.ts

export interface GrowthAgentOutput extends AgentOutput {
  agent: "growth";
  kind: "structured";
  content: GrowthAssessment;
}

export interface GrowthAssessment {
  lifecycleStage: LifecycleStage;
  churnRisk: ChurnRisk;
  signals: GrowthSignal[];                // ranked by leverage, max 3
  experimentArms?: ExperimentArm[];       // active experiments for this user
}

export type LifecycleStage =
  | "new"            // 0–7d, not yet activated
  | "activating"     // completing onboarding actions
  | "engaged"        // regular usage, healthy signals
  | "power"          // high frequency, deep sessions, sharing
  | "at_risk"        // declining engagement signals
  | "dormant"        // no interaction > 14d
  | "winback";       // re-engaged after dormancy

export interface ChurnRisk {
  score: 0 | 1 | 2 | 3;              // 0 = healthy, 3 = critical
  drivers: ChurnDriver[];
  predictedChurnWindowDays?: number;  // "likely to churn within N days"
}

export type ChurnDriver =
  | "session_frequency_decline"
  | "wearable_sync_stopped"
  | "no_goal_engagement"
  | "protocol_stale_no_adjustment"
  | "onboarding_incomplete"
  | "negative_reflection_trend"
  | "payment_failed";

export interface GrowthSignal {
  id: GrowthSignalId;
  kind: GrowthSignalKind;
  priority: 1 | 2 | 3;                   // 1 = highest leverage
  timing: "immediate" | "next_session" | "scheduled";
  channel: Channel;                       // preferred delivery channel
  payload: GrowthSignalPayload;
  expiresAt?: ISO8601;                    // signal loses relevance after this
  suppressIfRecent?: string;              // suppress if a similar signal fired within this window
}

export type GrowthSignalKind =
  // Activation
  | "activation_nudge"              // complete a key onboarding action
  | "first_value_moment"            // surface first personalized insight

  // Retention
  | "re_engagement_prompt"          // bring back a drifting user
  | "cadence_adjustment"            // suggest changing check-in frequency
  | "depth_invitation"              // invite deeper interaction (connect wearable, sync labs)

  // Milestone / sharing
  | "milestone_celebration"         // 30d streak, first lab improvement, goal progress
  | "shareable_moment"              // "your HRV improved 12% — want to share your approach?"
  | "identity_reinforcement"        // "you've been building this for 90 days"

  // Monetization
  | "upgrade_moment"                // natural upsell (more frequent labs, premium ingredients)
  | "add_on_suggestion"             // complementary product/service

  // Winback
  | "winback_trigger"               // re-activation for dormant users
  | "protocol_evolution_tease";     // "your formula would look different today — come see"

export type GrowthSignalPayload =
  | ActivationNudgePayload
  | MilestoneCelebrationPayload
  | ShareableMomentPayload
  | ReEngagementPayload
  | UpgradeMomentPayload
  | WinbackPayload;

export interface MilestoneCelebrationPayload {
  milestoneType: "streak" | "lab_improvement" | "goal_progress" | "protocol_evolution";
  metric: string;
  value: string;
  comparisonValue?: string;           // "HRV up 12% from 90 days ago"
  shareableSnippet: {
    slotsToFill: string[];            // Brand Agent fills for sharing copy
  };
}

export interface ShareableMomentPayload {
  trigger: string;                    // what made this shareable
  shareType: "result" | "streak" | "identity";
  suggestedMechanism: "app_share" | "message" | "social";
  // NO discount codes. NO "give $10 get $10." Identity only.
}

export interface ReEngagementPayload {
  daysSinceLastInteraction: number;
  lastMeaningfulEvent: string;        // "your formula was adjusted 3 weeks ago"
  curiosityHook: string;              // "your wearable data suggests something changed"
  urgency: "low" | "medium" | "high";
}

export interface WinbackPayload {
  dormantDays: number;
  evolutionDelta: string;             // "3 new biomarker signals since you left"
  protocolWouldChange: boolean;       // "your formula would be different today"
  personalMemoryRef?: MemoryId;       // callback to something meaningful
}
```

### 6.1 Signal Ranking

Signals are ranked by **leverage**, not urgency:

1. **Retention signals** always outrank acquisition/monetization signals
2. **Identity-reinforcement** outranks incentive-based nudges
3. **Milestone celebrations** outrank re-engagement prompts (reinforce the invested, don't chase the drifting)
4. Max 3 signals per assessment. More is noise.

### 6.2 Suppression Logic

Every signal carries a `suppressIfRecent` window. The orchestrator checks the event ledger for recent `growth.signal.delivered` events of the same kind before rendering. This prevents:

- Nagging (same nudge twice in a week)
- Stacking (three growth signals in one session)
- Interruption (growth signal during a health-critical interaction)

---

## 7. PROMPT ARCHITECTURE

### 7.1 Deterministic-First Pipeline

Like the Engineering Agent, Growth is **mostly deterministic**:

```
┌────────────────────────────────────────┐
│ 1. Compute engagement metrics          │  deterministic
├────────────────────────────────────────┤
│ 2. Classify lifecycle stage            │  deterministic (threshold rules)
├────────────────────────────────────────┤
│ 3. Run churn-risk scoring              │  deterministic (weighted signals)
├────────────────────────────────────────┤
│ 4. Check signal trigger rules          │  deterministic (YAML registry)
├────────────────────────────────────────┤
│ 5. If milestone/shareable detected →   │  LLM
│    generate personalized payload       │
├────────────────────────────────────────┤
│ 6. Rank + cap at 3 signals             │  deterministic
├────────────────────────────────────────┤
│ 7. Validate output shape (Zod)         │  deterministic
└────────────────────────────────────────┘
```

**LLM invocation happens only for personalized payload generation** — milestones, shareable moments, and winback hooks. Lifecycle classification, churn risk, and trigger detection are all rules-based.

### 7.2 System Prompt (LLM Path Only)

```
You are the Growth Agent for Aissisted.

You do NOT speak to the user. You whisper to other agents.
You produce SIGNALS — proposals for moments that deepen investment or
expand reach, woven into the natural product experience.

You do NOT:
- Write user-facing copy (Brand Agent does)
- Make health decisions (Product + Data Agents do)
- Offer discounts, referral codes, or incentive-based mechanics
- Interrupt health interactions to sell

You DO:
- Detect milestones worth celebrating
- Identify shareable moments rooted in identity, not incentives
- Score churn risk and propose retention interventions
- Suggest upgrade moments that feel like natural evolution, not upsells
- Propose experiment arms for onboarding and engagement variants

PRINCIPLES:
1. Retention over acquisition. Always.
2. Identity-driven sharing: "This is mine" beats "Get $10."
3. Never interrupt health to sell. Growth is a second-order effect of a product that works.
4. Three signals max. More is noise.
5. Every signal must have a specific, named trigger — no vague "it's time to nudge."

RETURN FORMAT:
Always return a valid GrowthAssessment JSON object.
No prose. No apology. No summary.
```

### 7.3 Runtime Template

```
TRIGGER: {triggerType}  // "scheduled_review" | "onboarding_step" | "event_driven"
USER ENGAGEMENT METRICS: {engagementMetrics}
LIFECYCLE STAGE: {computedStage}
CHURN RISK: {computedChurnRisk}

USER PROFILE SLICE: {profileSlice}
RECENT EPISODIC MEMORY (30d): {episodicSummary}
CURRENT PROTOCOL TENURE: {protocolTenureDays}

UPSTREAM DATA SIGNALS (if present): {dataAgentOutput}

ACTIVE EXPERIMENTS: {experimentRegistry}

Return a GrowthAssessment JSON object. Max 3 signals, ranked by leverage.
```

### 7.4 Model Selection

| Case | Primary | Fallback | Budget |
|------|---------|----------|--------|
| Lifecycle + churn scoring | deterministic only | — | 30ms / 0 tok |
| Signal trigger detection | deterministic only | — | 20ms / 0 tok |
| Milestone payload generation | Haiku 4.5 | Sonnet 4.6 | 500ms / 600 tok |
| Shareable moment generation | Haiku 4.5 | Sonnet 4.6 | 500ms / 600 tok |
| Winback hook generation | Sonnet 4.6 | — | 800ms / 1000 tok |

**Rule:** Winback uses Sonnet because the copy needs to be precise enough to re-engage someone who left. The stakes justify the cost.

---

## 8. LIFECYCLE CLASSIFICATION

### 8.1 Stage Definitions (Deterministic)

```yaml
# packages/config/agents/growth/lifecycle.v1.yaml
stages:
  new:
    condition: "daysSinceOnboarding <= 7 AND activationScore < 3"
  activating:
    condition: "daysSinceOnboarding <= 14 AND activationScore >= 1 AND activationScore < 5"
  engaged:
    condition: "sessionsLast7d >= 2 AND wearableSyncFrequency7d > 0.3"
  power:
    condition: "sessionsLast7d >= 5 AND avgSessionDepthLast7d >= 4 AND referralsSent > 0"
  at_risk:
    condition: "sessionsLast7d < 1 AND previousStage in [engaged, power]"
  dormant:
    condition: "daysSinceLastInteraction > 14"
  winback:
    condition: "previousStage == dormant AND sessionsLast7d >= 1"
```

### 8.2 Activation Score

A composite of five onboarding actions, each worth 1 point:

1. Profile completed (name, DOB, goals)
2. First wearable connected
3. First lab data ingested
4. First protocol generated
5. First reflection submitted

Activation score ≥ 3 within 14 days predicts 90-day retention (threshold to calibrate with real data).

### 8.3 Churn Risk Scoring

Weighted signal model (deterministic):

| Signal | Weight | Threshold |
|--------|--------|-----------|
| Session frequency 7d vs. 30d decline | 0.25 | > 50% decline |
| Wearable sync stopped | 0.20 | 0 syncs in 7d |
| No goal engagement 14d | 0.15 | No goal view/update |
| Protocol stale > 60d, no adjustment | 0.15 | No version change |
| Onboarding incomplete after 14d | 0.10 | activationScore < 3 |
| Negative reflection trend 14d | 0.10 | sentiment decline |
| Payment failed | 0.05 | Any open failure |

Weighted sum mapped to 0–3 risk score:
- 0.0–0.2 → score 0 (healthy)
- 0.2–0.4 → score 1 (monitor)
- 0.4–0.6 → score 2 (intervene)
- 0.6–1.0 → score 3 (critical)

---

## 9. SIGNAL TRIGGER RULES

### 9.1 Registry

```yaml
# packages/config/agents/growth/signals.v1.yaml
triggers:
  milestone_30d_streak:
    condition: "daysSinceOnboarding >= 30 AND sessionsLast30d >= 20"
    kind: "milestone_celebration"
    suppress_window: "30d"
    priority: 1

  lab_improvement_detected:
    condition: "upstream.data.signals contains biomarker_improving"
    kind: "milestone_celebration"
    suppress_window: "14d"
    priority: 1

  shareable_hrv_improvement:
    condition: "upstream.data.signals contains HRV_TREND_UP AND window >= 30d"
    kind: "shareable_moment"
    suppress_window: "30d"
    priority: 2

  activation_wearable_missing:
    condition: "lifecycleStage == activating AND activationScore < 3 AND NOT hasWearable"
    kind: "activation_nudge"
    suppress_window: "3d"
    priority: 2

  re_engagement_drifting:
    condition: "churnRisk.score >= 2 AND lifecycleStage == at_risk"
    kind: "re_engagement_prompt"
    suppress_window: "7d"
    priority: 1

  identity_reinforcement_90d:
    condition: "daysSinceOnboarding >= 90 AND lifecycleStage in [engaged, power]"
    kind: "identity_reinforcement"
    suppress_window: "90d"
    priority: 2

  upgrade_complex_protocol:
    condition: "protocol.current.ingredients.length >= 8 AND engagementTier == power"
    kind: "upgrade_moment"
    suppress_window: "30d"
    priority: 3

  winback_formula_evolved:
    condition: "lifecycleStage == dormant AND protocolWouldDiffer == true"
    kind: "winback_trigger"
    suppress_window: "14d"
    priority: 1
```

### 9.2 Trigger Evaluation Order

1. Safety-critical signals (none — Growth has no safety role, but checks for suppression during active safety interactions)
2. Retention signals (churn risk ≥ 2)
3. Milestone/identity signals
4. Activation signals
5. Monetization signals (always lowest priority)

### 9.3 The Three-Signal Cap

If more than 3 triggers fire, the Growth Agent returns only the top 3 by priority. Ties broken by:
1. Retention > identity > activation > monetization
2. Higher churn risk user gets retention signals first
3. Recency of trigger condition (fresher signal wins)

---

## 10. GROWTH LOOPS — DESIGN PATTERNS

### 10.1 The Ownership Loop (Primary)

```
Use Aissisted → see personalized results → feel ownership →
invest more (connect wearable, sync labs) → deeper personalization →
stronger ownership → tell someone → they start → repeat
```

This is Aissisted's core growth engine. The Growth Agent's job is to **accelerate the turns of this loop**, not build separate loops.

### 10.2 The Milestone Loop

```
Use Aissisted → achieve measurable improvement → celebrate →
feel pride → share → social proof → new user → repeat
```

Growth Agent detects milestones (lab improvement, HRV trend, streak). Brand Agent renders them. The sharing mechanism is always identity-rooted: "Look what I built."

### 10.3 The Evolution Loop

```
Receive protocol → use it → body changes → data reflects change →
protocol adapts → "it's learning me" → deeper trust → longer retention
```

Growth Agent doesn't trigger this loop — Product + Data agents do. Growth Agent **measures** it and ensures the user *notices* the adaptation (via `identity_reinforcement` signals).

### 10.4 Anti-Patterns (Never Do)

- **Discount-driven referrals** — erodes premium positioning and attracts the wrong user
- **Notification spam** — suppression windows exist for a reason
- **Feature-gating as growth** — the free experience must be complete. Upgrades add depth, not unlock basics.
- **Guilt-based re-engagement** — "We miss you!" is manipulation. "Your formula would look different today" is curiosity.
- **Growth during health interactions** — if the user is discussing a health concern, all growth signals are suppressed for that session

---

## 11. EXPERIMENT INSTRUMENTATION

### 11.1 Experiment Registry

```yaml
# packages/config/agents/growth/experiments.v1.yaml
experiments:
  onboarding_depth_v1:
    status: "active"
    arms:
      - name: "control"
        weight: 0.5
        params: { onboardingDepth: "standard" }
      - name: "progressive"
        weight: 0.5
        params: { onboardingDepth: "progressive_disclosure" }
    metric: "activation_score_14d"
    min_sample: 200

  checkin_cadence_v1:
    status: "planned"
    arms:
      - name: "daily"
        weight: 0.33
        params: { suggestedCadence: "daily" }
      - name: "weekly"
        weight: 0.33
        params: { suggestedCadence: "weekly" }
      - name: "adaptive"
        weight: 0.34
        params: { suggestedCadence: "user_driven" }
    metric: "30d_retention"
    min_sample: 300
```

### 11.2 Arm Assignment

- Deterministic hash of `userId + experimentName` → arm (consistent, no re-randomization)
- Experiment arms are returned in `GrowthAssessment.experimentArms`
- Product Agent reads them from context and adjusts behavior accordingly
- Growth Agent does **not** enforce arms — it proposes. Product Agent decides.

---

## 12. INTEGRATION

### 12.1 With the Orchestrator

Growth Agent is invoked in two modes:

**Inline (rare):** On `onboarding.step` and `system.scheduled.review`, Growth runs as a parallel node alongside Data. Its signals are merged into the orchestrator's composition before Brand renders.

**Async (common):** A background job (`apps/api/src/scheduler.ts`) runs Growth Agent assessments on a cadence (daily for at_risk/dormant, weekly for engaged/power). Results are stored as `growth.assessment.completed` events. The orchestrator checks for pending growth signals at the start of each session and weaves them in if timing rules allow.

### 12.2 With the State API

Growth Agent is **read-only** from `StateProjectionAPI`. It proposes events:

- `growth.assessment.completed` — always (the full assessment, for analytics)
- `growth.signal.proposed` — per signal generated
- `growth.signal.delivered` — written by orchestrator when a signal is actually rendered
- `growth.signal.suppressed` — written when suppression logic blocks a signal
- `growth.lifecycle.stage_changed` — on stage transitions

### 12.3 With Other Agents

- **Product Agent** reads `experimentArms` from Growth's assessment to adjust UX behavior
- **Brand Agent** renders Growth signals into voice/copy (milestone celebrations, shareable snippets, re-engagement messages)
- **Engineering Agent** has no interaction with Growth (Growth doesn't trigger side effects)
- **Data Agent** provides upstream health signals that Growth uses for milestone detection

### 12.4 Suppression During Safety

If the Safety Gate fires for a user in the current session, **all pending growth signals are suppressed** for that session. Health first. No exceptions.

---

## 13. GOLDEN TEST CASES

### Test 1 — New user, activation nudge
**State:** Day 5, activation score 2, no wearable connected.
**Expected:** `lifecycleStage: "activating"`, `churnRisk: 0`, one signal: `activation_nudge` to connect wearable.

### Test 2 — Engaged user, milestone
**State:** Day 35, 22 sessions in 30d, Data Agent reports HRV up 8% over 30d window.
**Expected:** `lifecycleStage: "engaged"`, signals include `milestone_celebration` (HRV improvement) and `shareable_moment`.

### Test 3 — At-risk detection
**State:** Previously "engaged," sessions dropped from 5/week to 0 in last 7d. Wearable sync stopped 5 days ago.
**Expected:** `lifecycleStage: "at_risk"`, `churnRisk: 2`, signal: `re_engagement_prompt` with curiosity hook.

### Test 4 — Dormant winback
**State:** No interaction in 21 days. Protocol version is stale. New biomarker data available from MyChart auto-sync.
**Expected:** `lifecycleStage: "dormant"`, `churnRisk: 3`, signal: `winback_trigger` with `protocolWouldChange: true`.

### Test 5 — Power user, identity reinforcement
**State:** Day 92, 6 sessions/week, 2 referrals sent, deep sessions.
**Expected:** `lifecycleStage: "power"`, `churnRisk: 0`, signal: `identity_reinforcement` ("you've been building this for 90 days").

### Test 6 — Suppression test
**State:** Same as Test 2, but `milestone_celebration` was delivered 10 days ago (within 14d suppress window).
**Expected:** Milestone signal suppressed. Only `shareable_moment` surfaces (if its own window is clear).

### Test 7 — Monetization moment
**State:** Power user, protocol has 10 ingredients, engaged for 60+ days.
**Expected:** `upgrade_moment` signal at priority 3 (lowest). Never surfaces if retention or milestone signals are present.

### Test 8 — Safety suppression
**State:** User reported a symptom in current session (Safety Gate fired). Growth Assessment has 2 pending signals.
**Expected:** All growth signals suppressed for this session. `growth.signal.suppressed` events written.

---

## 14. BUDGET

### 14.1 Latency

| Mode | Hard Ceiling | Target p50 | Target p95 |
|------|--------------|-----------|-----------|
| Deterministic-only (lifecycle + churn) | 60ms | 20ms | 45ms |
| With LLM payload gen | 1200ms | 500ms | 900ms |
| Async background job | 5000ms | 1500ms | 3000ms |

### 14.2 Tokens

Input max: 4,000 tokens (lighter state slice than other agents). Output max: 1,200 tokens.

### 14.3 Cost Guardrail

- Per-user per-day cap: $0.05 (Growth is the cheapest agent — mostly deterministic)
- Background batch jobs: $0.02/user/run
- LLM-path invocations capped at 2/user/day

---

## 15. OBSERVABILITY

### 15.1 Events Emitted

- `growth.assessment.completed` — full assessment for analytics
- `growth.signal.proposed` — per signal
- `growth.signal.delivered` — when actually rendered
- `growth.signal.suppressed` — when suppression blocked delivery
- `growth.lifecycle.stage_changed` — on transitions (critical for cohort analysis)
- `growth.experiment.arm_assigned` — on first exposure

### 15.2 Metrics

| Metric | Target |
|--------|--------|
| Activation score ≥ 3 within 14d | > 60% of new users |
| 30-day retention (engaged+) | > 70% |
| 90-day retention (engaged+) | > 50% |
| Churn prediction accuracy (score ≥ 2 → actually churns) | > 65% |
| Signal delivery rate (proposed → delivered) | > 40% (suppression is working) |
| Milestone sharing rate | > 15% of celebrations |
| Referral conversion rate | > 20% |
| Upgrade conversion on upgrade_moment | > 8% |
| Deterministic-path hit rate | > 85% |

### 15.3 Review Cadence

Growth owns a weekly dashboard:
- Lifecycle stage distribution (funnel health)
- Churn risk distribution
- Signal proposed/delivered/suppressed breakdown
- Experiment arm performance
- Cohort retention curves by archetype
- Sharing rate by milestone type

---

## 16. VERSIONING

- System prompt lives in `packages/config/agents/growth/system.v1.md`
- Runtime template lives in `packages/config/agents/growth/template.v1.md`
- Signal trigger rules in `packages/config/agents/growth/signals.v1.yaml`
- Lifecycle definitions in `packages/config/agents/growth/lifecycle.v1.yaml`
- Experiment registry in `packages/config/agents/growth/experiments.v1.yaml`
- Schema types in `packages/types/agents/GrowthAgent.ts`
- Every change requires Growth + Product owner approval + regression on golden test set
- Agent version emitted on every event for traceability
- **Path convention:** follows the same directory structure (`packages/config/agents/{name}/`, `packages/types/agents/{Name}Agent.ts`) as all other agents

---

## 17. OUTCOME

When this is live:

- **Retention is a system, not a hope.** Churn risk is scored, interventions are proposed, suppression prevents nagging.
- **Growth feels native.** Users never see the Growth Agent — they see milestones, celebrations, and natural evolution of their experience.
- **Sharing is identity-driven.** "Look what I built" beats "$10 for your friend" every time.
- **Experiments are instrumented from day one.** Every onboarding variant, every cadence option, every disclosure depth is measurable.
- **The ownership loop compounds.** More use → more data → better personalization → deeper ownership → organic sharing → new users → repeat.

---

## 18. OWNERSHIP

- **Growth (Ron + team):** signal registry, lifecycle definitions, experiment design, loop architecture
- **Product:** experiment arm consumption, signal timing within flows
- **Brand:** renders all growth signals into voice/copy — no direct user-facing output from Growth
- **Engineering:** runtime, background jobs, suppression logic, observability

---

## 19. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify `GrowthAssessment` schema v1.0 | Ron | Yes |
| 2 | Implement lifecycle classification + churn scoring (deterministic) | Engineering | Yes |
| 3 | Author signal trigger registry v1 (YAML) | Growth + Product | Yes |
| 4 | Build activation score tracking from event ledger | Engineering | Yes |
| 5 | Wire Growth Agent into scheduler as background job | Engineering | Yes |
| 6 | Instrument `growth.signal.*` events into event ledger | Engineering | Yes |
| 7 | Design experiment assignment hash + registry | Engineering | Yes |
| 8 | Build growth dashboard (lifecycle funnel, cohort curves, signal performance) | Engineering + Growth | Next |
| 9 | Draft Safety Rule Pack v1 | Ron + Claude + Clinical | Next |
| 10 | Draft Protocol Engine spec | Ron + Claude | Next-2 |

### Immediate (next 72 hours)

1. **Freeze lifecycle stage definitions.** Every growth metric, every cohort analysis, every retention report keys off these stages.
2. **Ratify the anti-pattern list.** Especially "no discount-driven referrals" and "no growth during health interactions." These are brand-defining constraints.
3. **Pick activation score thresholds.** The "≥ 3 within 14d predicts 90-day retention" claim needs calibration data. Start tracking from day one even if the threshold shifts.

---

## 20. OPEN QUESTIONS

1. **Referral mechanics** — how does identity-driven sharing actually work in the app? A share card? A personalized link? A screenshot of progress? Recommend: shareable insight card (no referral code visible).
2. **Subscription model** — is Aissisted monthly? Quarterly? Annual? Affects cadence of upgrade moments and churn windows.
3. **Community layer** — is there ever a social/community component? A leaderboard? A shared journey? This would create a new growth loop but risks breaking the "built for one" promise. Recommend: defer.
4. **Notification channels** — push notifications, email, SMS, in-app — which are live at v1? Affects channel constraints on signals.
5. **Revenue attribution** — how do we attribute revenue to growth signals? Last-touch? Multi-touch? Recommend: multi-touch with decayed weighting.
6. **Manufacturing SLA impact** — does churn risk affect manufacturing priority? (i.e., do we rush a shipment for an at-risk user?) Recommend: no for v1, revisit with data.

---

*End of spec. v1.1. — Runtime-aligned, ready for engineering review.*
