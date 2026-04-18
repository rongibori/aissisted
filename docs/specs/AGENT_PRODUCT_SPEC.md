# AISSISTED — PRODUCT AGENT SPEC

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Product + Engineering
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.1
**Blocks:** Onboarding flow, protocol explanation UX, adjustment decisions, scheduled review surfacing
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS
**Role in agent graph:** invoked on `question.protocol`, `action.update_goal`, `onboarding.step`, `reflection.progress`, `action.adjust_protocol`, `system.scheduled.review`

---

## 0. OPERATING LINE

> *"Design the system. Then surface it."*

The Product Agent doesn't write copy. It doesn't interpret biomarkers. It doesn't build APIs. It decides **how the system should behave for this specific individual, right now**.

---

## 1. TENSION

A personalization system is only as good as the decisions it makes about *what to show, what to ask, what to adjust, and what to hide*. Without a dedicated agent owning that judgment, either the Data Agent over-reaches (drowning users in numbers) or the Brand Agent over-reaches (polishing sentences that shouldn't have been produced in the first place).

Product decisions are their own discipline. They need their own agent.

## 2. TRUTH

The Product Agent is the **experience architect**. It reads the full user picture and answers four questions at every turn:

1. **What does this person need to understand right now?**
2. **What should the system decide on their behalf?**
3. **What should it ask them?**
4. **What should it withhold?**

Those four answers define the interaction. Every other agent serves one of them.

## 3. SHIFT

Treat the Product Agent as a **structured-output agent**, not a copywriter. It returns a **decision object** — flow steps, personalization signals, surfacing logic — which downstream agents (Brand, Engineering) render. The Product Agent never writes the final words; it writes the plan.

---

## 4. ROLE

### 4.1 In Scope

- Onboarding step selection and ordering
- Protocol **rationale structure** — what to show, in what order, at what depth
- Progress-reflection framing — "what does this week mean for this person?"
- Adjustment decisions — when to change a protocol, when to wait, when to ask
- Scheduled-review composition — what goes into the weekly/monthly summary
- Personalization decisions — which known facts to surface, which to hold

### 4.2 Out of Scope

- **Raw biomarker interpretation** → Data Agent
- **Final copy / voice** → Brand Agent (then Brand Filter)
- **API contracts, data pipelines, infra** → Engineering Agent
- **Acquisition / retention / loops** → Growth Agent
- **Safety / interaction checks** → Safety Gate (deterministic, pre-agent)

### 4.3 Runtime Alignment — Current Repo

As of v1.1, the repo at `aissisted/` has no `packages/core/` or `agents/` directory yet. Planned paths map to the existing monorepo structure:

| Spec Reference | Planned Path | Notes |
|----------------|-------------|-------|
| Agent types & interfaces | `packages/domain/agents/` | New directory under existing `packages/domain/` |
| Decision schemas | `packages/types/agents/ProductAgent.ts` | New file under existing `packages/types/` |
| System prompt + template | `packages/config/agents/product/` | New directory under existing `packages/config/` |
| Runtime module | `apps/api/src/agents/product.ts` | Fastify route handler + agent invocation |

Existing packages that this agent consumes:
- `packages/db/` — Drizzle schema (users, health_profiles, protocols, biomarkers)
- `packages/config/` — Environment config, feature flags
- `packages/integrations/` — Claude API client wrapper

The `packages/core/` namespace used in §5–§6 type samples is the **target refactor** — create `packages/core/` to house agent interfaces, orchestrator types, and the shared `AgentOutput` contract from `ORCHESTRATOR_ROUTING_SPEC.md` §8.

### 4.4 Boundary Rule

If the Product Agent's output would require **new data** to render (e.g. "show their latest ferritin"), it declares the data need as a structured request, not a free-text mention. The Data Agent resolves it upstream. This keeps the DAG clean.

---

## 5. INPUT — REQUIRED STATE SLICE

```typescript
// Declared in AgentRegistry:
const productAgent: Agent = {
  name: "product",
  version: "1.0.0",
  requiredSlice: ["profile", "memory", "protocol"],
  // conditional additions based on intent (see §5.2)
};
```

### 5.1 Always Loaded

- `profile.identity` — name, archetype, timezone, engagement tier
- `profile.goals` — active goals, priorities, affirmation timestamps
- `memory.preference.communication` — tone, detail level, cadence
- `memory.semantic.traits` — stable facts (e.g. "sensitive to caffeine")
- `memory.working.currentIntent` — from orchestrator classification

### 5.2 Conditionally Loaded (by intent class)

| Intent | Additional Slice |
|--------|------------------|
| `question.protocol` | `protocol.current`, `protocol.history[-1]` |
| `action.update_goal` | — |
| `onboarding.step` | `profile.onboardedAt`, `consent` |
| `reflection.progress` | `biometrics.latest`, `protocol.current`, `memory.episodic[-30d]` |
| `action.adjust_protocol` | ALL |
| `system.scheduled.review` | `biometrics.latest`, `protocol.current`, `memory.episodic[-7d]` |

### 5.3 Input from Upstream Agents

When Data Agent runs first (e.g. `Data → Product → Brand`), Product receives:

```typescript
interface ProductAgentInput extends AgentInput {
  upstreamOutputs: {
    data?: DataAgentOutput;   // biomarker interpretation, signals, confidence
  };
}
```

---

## 6. OUTPUT — DECISION OBJECT

The Product Agent returns a **typed decision**, not prose.

```typescript
// /packages/core/agents/ProductAgentOutput.ts

export interface ProductAgentOutput extends AgentOutput {
  agent: "product";
  kind: "structured";
  content: ProductDecision;
}

export type ProductDecision =
  | OnboardingStepDecision
  | ProtocolExplanationDecision
  | ProgressReflectionDecision
  | AdjustmentDecision
  | ScheduledReviewDecision
  | GoalUpdateDecision;

export interface ProtocolExplanationDecision {
  kind: "protocol_explanation";
  layers: ExplanationLayer[];           // progressive disclosure
  personalizationHooks: PersonalizationHook[];
  suggestedCTA?: CallToAction;
}

export interface ExplanationLayer {
  depth: 1 | 2 | 3;                     // 1=headline, 2=rationale, 3=science
  content: {
    kind: "summary" | "why_for_you" | "evidence";
    slotsToFill: string[];              // e.g. ["drivingBiomarker", "goalRef"]
    maxWordsForBrandLayer: number;      // hint for Brand Agent
  };
}

export interface AdjustmentDecision {
  kind: "adjustment";
  verdict: "hold" | "adjust_minor" | "adjust_major" | "defer_to_clinician";
  drivingSignals: SignalRef[];
  proposedChanges?: ProtocolChange[];
  rationaleRefs: EvidenceRef[];
  requiresUserConfirmation: boolean;
  holdReason?: string;                  // if verdict = "hold"
}

export interface ProgressReflectionDecision {
  kind: "progress_reflection";
  framing: "on_track" | "adapting" | "mixed" | "early_signal";
  pillarsToSurface: Pillar[];           // which dimensions to highlight (sleep, HRV, etc.)
  acknowledgments: string[];            // memory refs worth calling back to
  askFromUser?: string;                 // optional reflective prompt
}

export interface OnboardingStepDecision {
  kind: "onboarding_step";
  nextStep: OnboardingStepId;
  skipStep?: OnboardingStepId;
  reason: string;                       // why this ordering for this person
  progressFraction: number;             // 0–1
}

export interface ScheduledReviewDecision {
  kind: "scheduled_review";
  headline: { slotsToFill: string[] };
  sections: ReviewSection[];            // ranked by relevance
  callToActionCandidates: CallToAction[];
}

export interface GoalUpdateDecision {
  kind: "goal_update";
  acknowledgment: { slotsToFill: string[] };
  reconciliation?: {                    // if new goal conflicts with existing
    conflictingGoalId: GoalId;
    resolution: "replace" | "both" | "ask_user";
  };
  cadenceAdjustment?: CheckInCadence;   // does this goal change cadence?
}
```

### 6.1 The Slots Pattern

The Product Agent produces **slot-filled templates**, not sentences. Brand Agent (the next node) turns slots into final copy.

Example:

```json
{
  "kind": "protocol_explanation",
  "layers": [
    {
      "depth": 1,
      "content": {
        "kind": "why_for_you",
        "slotsToFill": [
          { "name": "drivingBiomarker", "value": "HRV_7d_trend", "displayHint": "HRV" },
          { "name": "preferredName", "value": "Ron" },
          { "name": "goalRef", "value": "goal:energy_stability" }
        ],
        "maxWordsForBrandLayer": 25
      }
    }
  ],
  "personalizationHooks": [
    { "kind": "calls_back_memory", "memoryId": "mem_q1_2026_sleep_breakthrough" }
  ]
}
```

Brand Agent consumes the slots and produces: *"Ron — your HRV's been unsteady this week. That's why magnesium is doing more of the work."*

---

## 7. PROMPT ARCHITECTURE

### 7.1 System Prompt (Locked)

```
You are the Product Agent for Aissisted.

Your role is to make ONE decision at a time about how the system should
behave for a specific individual, based on their full context.

You do NOT:
- Write the final words shown to the user (Brand Agent does)
- Interpret raw biomarkers (Data Agent does, you read its output)
- Discuss technical architecture (Engineering Agent does)
- Design growth mechanics (Growth Agent does)

You DO:
- Decide what to show, in what order, at what depth
- Decide what to ask, what to withhold, what to acknowledge
- Decide when to adjust, when to hold, when to defer
- Surface the individual, not the average

PRINCIPLES:
1. One person. Not a segment. Not a type. This person, right now.
2. Progressive disclosure — depth 1 by default, deeper only on pull.
3. Ownership beats guidance — let them see why before what.
4. Fewer decisions is better than more. Reduce until the right thing is obvious.
5. If you do not have enough signal, say so explicitly and ask.

RETURN FORMAT:
Always return a valid ProductDecision JSON object matching the schema.
No prose. No apology. No summary.
```

### 7.2 Runtime Template

```
INTENT: {intent.class}
CONFIDENCE: {intent.confidence}
CHANNEL: {channel}

USER CONTEXT (sliced):
{stateSliceJSON}

UPSTREAM DATA OUTPUT (if present):
{dataAgentOutputJSON}

DECISION REQUIRED: {decisionKind}

Return a ProductDecision JSON object. Adhere strictly to the schema for decisionKind={decisionKind}.
```

### 7.3 Model Selection

| Intent Class | Primary Model | Fallback | Budget |
|--------------|---------------|----------|--------|
| `question.protocol` | Haiku 4.5 | Sonnet 4.6 | 400ms / 600 tok |
| `action.update_goal` | Haiku 4.5 | Sonnet 4.6 | 300ms / 400 tok |
| `onboarding.step` | Haiku 4.5 | Sonnet 4.6 | 300ms / 400 tok |
| `reflection.progress` | Sonnet 4.6 | Opus 4.6 | 800ms / 1200 tok |
| `action.adjust_protocol` | **Sonnet 4.6** | **Opus 4.6** | 1200ms / 1800 tok |
| `system.scheduled.review` | Sonnet 4.6 | Opus 4.6 | 1000ms / 1500 tok |

**Rule:** Any decision that modifies a protocol uses Sonnet minimum. Opus is the fallback for low-confidence adjustments — cost is justified by the stakes.

---

## 8. DECISION PATTERNS

### 8.1 The Four Questions (Always)

Before returning any decision, the agent internally addresses:

1. **What does this person need to understand?** → drives depth and layering
2. **What should the system decide for them?** → drives `verdict` fields
3. **What should the system ask them?** → drives `askFromUser` / `requiresUserConfirmation`
4. **What should be withheld?** → drives omission, not suppression

Withholding is an active decision. Logged as `withheldSignals: SignalRef[]` in reasoning.

### 8.2 Progressive Disclosure Default

Every explanation defaults to **depth 1 (headline only)**. Depth 2 (rationale) is offered as a pull, not a push. Depth 3 (science) only on explicit request.

This matches the brand principle: simplicity is intelligence.

### 8.3 Hold-Before-Adjust Bias

The default verdict for any adjustment decision is **`hold`**. The agent must find specific justifying signal(s) to move to `adjust_minor` or higher. A hold is not a failure — it is protection against whiplash personalization.

### 8.4 Confidence Gating

| Confidence | Behavior |
|------------|----------|
| 3 | Proceed with decision |
| 2 | Proceed, flag `reasoning.uncertaintyNotes` |
| 1 | Return `verdict: "hold"` or `askFromUser`, never an adjustment |
| 0 | Return `kind: "no_op"` with reasoning |

### 8.5 Memory-Callback Pattern

For `reflection.progress` and `scheduled_review`, the agent searches episodic memory (`StateProjectionAPI.searchMemory(userId, intent.rawInput, { topK: 3 })`) and includes up to **one** memory callback per output. More than one feels like surveillance. Zero feels like amnesia.

---

## 9. INTEGRATION

### 9.1 With the Orchestrator

The Product Agent is a leaf node in the agent graph. Orchestrator invokes it per `ORCHESTRATOR_ROUTING_SPEC.md` §8:

```typescript
const output = await productAgent.invoke(
  { intent, upstreamOutputs },
  { userId, sessionId, state, memory, requestId, budget }
);
```

### 9.2 With the State API

The agent is **read-only** against `StateProjectionAPI`. It can **propose events** via `output.proposedEvents`, but the orchestrator decides whether to append them.

Proposed events Product Agent typically emits:
- `agent.decision.made` (always, for audit)
- `interaction.completed` (when the decision closes a loop)
- `protocol.adjustment.proposed` (when `verdict: "adjust_*"`)

### 9.3 With the Brand Filter

The Product Agent's output is **not rendered directly**. It flows to the Brand Agent (next node), which fills slots and produces final copy. That copy is what passes through the Brand Filter.

In the rare case Product Agent is the last node (shouldn't happen by routing, but belts and suspenders), the orchestrator synthesizes its decision into structured UI data, which is channel-appropriate and skips the Brand Filter entirely (structured data, not copy).

### 9.4 With the Safety Gate

The Safety Gate runs **before** the Brand Filter, which runs **after** the Brand Agent. The Product Agent's `adjust_protocol` decisions are inspected by Safety **after Brand produces copy** but **before delivery**. A flagged interaction collapses the whole response to a safe fallback.

---

## 10. GOLDEN TEST CASES

These become the agent's regression suite. Each pairs an input (intent + state slice) with an expected decision shape.

### Test 1 — `question.protocol` (simple)
**User asks:** "Why is magnesium in my formula?"
**Expected decision:** `protocol_explanation`, depth=1 only, single driving biomarker surfaced, personalization hook to user's name.

### Test 2 — `question.protocol` (deep)
**User asks:** "What's the science behind magnesium glycinate specifically?"
**Expected decision:** `protocol_explanation`, depth=1 + depth=3 (skipping depth=2 is valid when the question is explicitly scientific).

### Test 3 — `action.adjust_protocol` (hold)
**Signal:** HRV trending down 3 days, but sample size < 7 days.
**Expected decision:** `adjustment`, `verdict: "hold"`, `holdReason: "insufficient_window"`.

### Test 4 — `action.adjust_protocol` (adjust_minor)
**Signal:** 14-day sleep quality drop of 18%, protocol unchanged for 30 days.
**Expected decision:** `adjustment`, `verdict: "adjust_minor"`, `requiresUserConfirmation: true`.

### Test 5 — `action.adjust_protocol` (defer_to_clinician)
**Signal:** New medication reported, interaction risk flagged by Data Agent.
**Expected decision:** `adjustment`, `verdict: "defer_to_clinician"`.

### Test 6 — `reflection.progress` (on_track)
**Signal:** 14-day positive trend across sleep + HRV, user wrote "I'm feeling great."
**Expected decision:** `progress_reflection`, `framing: "on_track"`, one memory callback, no `askFromUser`.

### Test 7 — `onboarding.step` (skip)
**State:** User already synced WHOOP during sign-up.
**Expected decision:** `onboarding_step`, `skipStep: "connect_wearable"`, reason logged.

### Test 8 — `action.update_goal` (conflict)
**Signal:** New goal "longevity" conflicts with active goal "weight loss."
**Expected decision:** `goal_update`, `reconciliation.resolution: "ask_user"`.

---

## 11. BUDGET

### 11.1 Latency

| Channel | Hard Ceiling | Target p50 | Target p95 |
|---------|--------------|-----------|-----------|
| voice_jeffrey | 900ms | 400ms | 700ms |
| app_card | 1500ms | 500ms | 1000ms |
| scheduled | 3000ms | 1000ms | 2000ms |

### 11.2 Tokens

Input max: 6,000 tokens (sliced state). Output max: 1,800 tokens (structured JSON).

### 11.3 Cost Guardrail

- Per-user per-day cap: $0.25 of Product Agent spend
- On breach: fall back to Haiku across the board, log, alert

---

## 12. OBSERVABILITY

### 12.1 Events Emitted

- `agent.decision.made` — always, every invocation
- `agent.product.verdict.hold` — when an adjustment is declined, with reason
- `agent.product.verdict.adjust` — when a change is proposed
- `agent.product.withholding` — when memory/signals intentionally suppressed

### 12.2 Metrics

| Metric | Target |
|--------|--------|
| Hold rate on `adjust_protocol` | 60–80% (sanity band) |
| Decision p95 latency | within channel ceiling |
| JSON schema adherence | > 99.5% |
| Brand-layer slot-fill success | > 98% |
| Memory callback usage rate on reflections | 40–70% |

### 12.3 Review Cadence

Product owns a weekly dashboard:
- Hold-rate trend
- Adjustment verdicts distribution
- Top 10 decisions that triggered Brand Filter blocks (likely a Product prompt issue, not a Brand one)

---

## 13. VERSIONING

- System prompt lives in `packages/config/agents/product/system.v1.md` (see §4.3 path mapping)
- Runtime template lives in `packages/config/agents/product/template.v1.md`
- Schema types in `packages/types/agents/ProductAgent.ts` (until `packages/core/` refactor)
- Every change requires Product owner approval + regression on golden test set
- Agent version is emitted on every event for traceability
- **Path convention:** all agent specs use the same directory structure (`packages/config/agents/{name}/`, `packages/types/agents/{Name}Agent.ts`) for consistency across Product, Brand, Data, Engineering, and Growth agents

---

## 14. OUTCOME

When this is live:

- **Every user-facing interaction is backed by a traceable decision**, not a vibes-based LLM response
- **Adjustments are conservative by default** — no whiplash personalization
- **Progressive disclosure works at runtime**, not just in design docs
- **The system acknowledges before it advises** — via memory callbacks
- **Brand Agent has a clean contract** — fill these slots, in this order, for this channel

---

## 15. OWNERSHIP

- **Product (Ron):** decision schemas, prompt, golden test set
- **Engineering:** runtime, JSON schema validation, observability
- **Brand:** reviews slot definitions to ensure they compose into good copy

Every schema change touches Product first. Brand and Engineering consume.

---

## 16. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify decision schema v1.0 | Ron | Yes |
| 2 | Implement Product Agent module in Fastify runtime | Engineering | Yes |
| 3 | Author system prompt v1 + runtime template | Ron + Claude | Yes |
| 4 | Build 8 golden test cases into a regression harness | Engineering | Yes |
| 5 | Calibrate model selection on representative workload | Engineering | Yes |
| 6 | Create `packages/core/` with shared agent interfaces from Orchestrator §8 | Engineering | Yes |
| 7 | Ratify Product → Brand and Data → Product handoff contracts across agent specs | Ron + Engineering | Next |
| 8 | Wire into orchestrator agent graph | Engineering | After Data Agent |
| 9 | Run dry-pass on synthetic user journeys | Ron + Engineering | Before wiring to Brand |

### Immediate (next 72 hours)

1. **Freeze the ProductDecision schema.** Every other agent depends on its stability.
2. **Sign off on the four-questions framework.** This is the agent's internal rubric — every prompt refinement goes through it.
3. **Pick 8 real or synthesized user scenarios** to back-test the golden set. Avoid hypotheticals — real edges beat crafted ones.

---

## 17. OPEN QUESTIONS

1. **Multi-decision turns** — can one turn return multiple decisions (e.g. `goal_update` + `scheduled_review` refresh)? Recommend: no — split into sequential turns.
2. **Decision cache** — do we cache decisions for identical inputs within a session window? Saves tokens but risks staleness.
3. **User override of agent decisions** — when a user disagrees with a `hold`, can they force an adjust path? Recommend: yes, with friction + logged override.
4. **A/B testing surface** — how does the Product Agent expose experiment arms (e.g. different disclosure depths) without branching prompt logic? Recommend: experiment-arm param on context, not prompt.
5. **Clinician co-decision mode** — when `defer_to_clinician` fires, what's the hand-off contract? Needs clinical partner input.

---

*End of spec. v1.1. — Runtime-aligned, ready for engineering review.*
