# AISSISTED — ENGINEERING AGENT SPEC

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Engineering + Product
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.1, `AGENT_PRODUCT_SPEC.md` v1.1, `AGENT_DATA_SPEC.md` v1.1
**Blocks:** Protocol adjustment pipeline, manufacturing handoff, integration orchestration, side-effect sequencing
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS
**Role in agent graph:** invoked on `action.adjust_protocol` (as validator: `Data → Product → Engineering → Brand`), `action.sync_device` (silent), and any intent whose execution has **side effects on external systems**

---

## 0. OPERATING LINE

> *"The Engineering Agent doesn't build. It verifies that the system can execute what was just decided."*

---

## 1. TENSION

The Product Agent can decide to adjust a protocol. The Data Agent can say the biomarkers support it. The Brand Agent can craft a beautiful message. None of them know whether the system can actually **execute** the decision: manufacturing capacity, shipping cadence, integration freshness, data sync state, transaction semantics.

Without a validation layer, the system confidently promises what it cannot deliver. Trust evaporates on the first failed shipment.

## 2. TRUTH

The Engineering Agent is the **execution gatekeeper**. It reads the proposed decision and the current state of every dependent system, then answers one question:

> *"Can we do this now, cleanly, without breaking a downstream promise?"*

Three possible answers:

1. **Yes** — pass through with a structured execution plan
2. **Yes, but** — pass through with compensating actions (delays, notifications, reschedules)
3. **No** — block with specific remediation path

## 3. SHIFT

Stop treating engineering concerns as "bugs after the fact." Bake them into the agent DAG as a **validation node** that runs before any user-facing promise is made.

The Engineering Agent is **deterministic-first** (system checks, integration freshness, transactional feasibility). An LLM layer is used only for novel compositions where rules don't cover the case.

---

## 4. ROLE

### 4.1 In Scope

- **Execution validation** for any decision with side effects (protocol changes, manufacturing triggers, notifications, external API calls)
- **Integration freshness checks** — are WHOOP/Oura/Apple/MyChart data current enough to act on?
- **System-state audits** — manufacturing capacity, shipping lead time, subscription billing status
- **Side-effect sequencing** — given a decision, what ordered list of downstream operations executes it safely?
- **Idempotency enforcement** — generate the idempotency keys that prevent duplicate shipments/charges/events
- **Failure mode identification** — what happens if step 3 of 5 fails? What's the rollback?

### 4.2 Out of Scope

- **Raw biomarker interpretation** → Data Agent
- **User-facing decisions** (what to show, ask, withhold) → Product Agent
- **Final copy** → Brand Agent
- **Growth loops, experimentation** → Growth Agent
- **Writing code** — this agent is a **runtime validator**, not a code-generation tool
- **Safety / interaction checks** → Safety Gate (separate, pre-agent)

### 4.3 Runtime Alignment — Current Repo

Path mapping to the existing monorepo (`~/aissisted`):

| Spec Reference | Planned Path | Notes |
|----------------|-------------|-------|
| Agent interfaces | `packages/domain/agents/` | Shared with other agents |
| Decision schemas | `packages/types/agents/EngineeringAgent.ts` | New file |
| System prompt + template | `packages/config/agents/engineering/` | New directory |
| Runtime module | `apps/api/src/agents/engineering.ts` | Fastify route/service |
| Integration health checks | `apps/api/src/services/integrations/health.ts` | New file, reads from existing `packages/integrations/` |

Existing packages this agent consumes:

- `packages/db/` — Drizzle schema (users, health_profiles, protocols, biomarkers, integrations)
- `packages/integrations/` — Claude API client + external integration wrappers (MyChart, WHOOP, Oura, Apple, manufacturing)
- `packages/config/` — feature flags, env config, operational toggles
- `apps/api/src/routes/integrations.ts` — existing integration route module
- `apps/api/src/scheduler.ts` — background job infrastructure this agent coordinates with

The `packages/core/` namespace used in type samples below is the **target refactor** from `ORCHESTRATOR_ROUTING_SPEC.md` §8.

### 4.4 Boundary Rule

If the Engineering Agent's validation requires **new information** (e.g. "is the user's WHOOP currently syncing?"), it reads from integration-state services — it does not re-request from Data Agent. The Data Agent interprets data; the Engineering Agent checks whether data (and systems) are healthy.

---

## 5. INPUT — REQUIRED STATE SLICE

```typescript
// Declared in AgentRegistry:
const engineeringAgent: Agent = {
  name: "engineering",
  version: "1.0.0",
  requiredSlice: ["profile", "protocol", "consent", "provenance"],
  // plus live integration state — see §5.3
};
```

### 5.1 Always Loaded (from `StateProjectionAPI`)

- `profile.identity` — userId, timezone
- `profile.engagementTier` — affects urgency handling
- `protocol.current` — what is active now
- `protocol.history[-1]` — what was active before
- `consent.integrations` — which integrations the user has authorized
- `provenance` — slices needed to check data freshness

### 5.2 Input from Upstream Agents

The Engineering Agent almost always runs **after** Product (and usually after Data). It receives:

```typescript
interface EngineeringAgentInput extends AgentInput {
  upstreamOutputs: {
    data?: DataAgentOutput;
    product: ProductAgentOutput;   // always required — validation requires a proposed decision
  };
}
```

### 5.3 Live Integration State (side-loaded, not from state slice)

This agent reads **real-time integration health**, not warm memory projections:

```typescript
interface IntegrationHealthSnapshot {
  whoop?:   IntegrationHealth;
  oura?:    IntegrationHealth;
  apple?:   IntegrationHealth;
  mychart?: IntegrationHealth;
  manufacturing: ManufacturingCapacity;
  shipping: ShippingState;
  billing: BillingState;
}

interface IntegrationHealth {
  connected: boolean;
  lastSuccessfulSync: ISO8601 | null;
  tokenExpiresAt: ISO8601 | null;
  recentFailureCount7d: number;
  latestErrorCode?: string;
}

interface ManufacturingCapacity {
  earliestShipDate: ISO8601Date;
  currentQueueDepth: number;
  blackoutPeriods: DateRange[];
}
```

**Rule:** Integration health is read via a dedicated service (`apps/api/src/services/integrations/health.ts`), not through the state slice. This keeps the projection clean and prevents staleness in operational decisions.

---

## 6. OUTPUT — VALIDATION + EXECUTION PLAN

```typescript
// packages/types/agents/EngineeringAgent.ts

export interface EngineeringAgentOutput extends AgentOutput {
  agent: "engineering";
  kind: "structured";
  content: EngineeringValidation;
}

export interface EngineeringValidation {
  verdict: "pass" | "pass_with_compensations" | "block";
  validatedDecision: ProductDecision;        // the Product Agent's decision, echoed
  executionPlan?: ExecutionPlan;             // present on pass*
  compensations?: CompensatingAction[];      // present on pass_with_compensations
  blockReason?: BlockReason;                 // present on block
  remediation?: Remediation;                 // how to unblock
  sideEffects: SideEffect[];                 // every downstream write this will cause
  idempotencyKeys: Record<string, string>;   // keys for each side effect
  rollbackPlan: RollbackStep[];              // what reverses each side effect
}

export interface ExecutionPlan {
  steps: ExecutionStep[];                    // ordered
  totalEstimatedLatencyMs: number;
  requiresUserConfirmation: boolean;
  scheduledFor?: ISO8601;                    // null = execute now
}

export interface ExecutionStep {
  order: number;
  kind: ExecutionStepKind;
  target: ExecutionTarget;
  payload: unknown;
  dependsOnStepOrders: number[];
  retryPolicy: RetryPolicy;
  timeoutMs: number;
}

export type ExecutionStepKind =
  | "append_event"
  | "persist_protocol"
  | "trigger_manufacturing"
  | "update_subscription"
  | "schedule_followup"
  | "refresh_integration"
  | "notify_user"                   // the Brand Agent output, queued
  | "schedule_lab_draw";

export interface CompensatingAction {
  reason: CompensationReason;        // why the compensation is needed
  action: CompensationKind;          // what to do instead / additionally
  impactOnUser: "invisible" | "delayed_message" | "requires_notice";
}

export type CompensationReason =
  | "manufacturing_blackout"
  | "integration_stale"
  | "payment_on_hold"
  | "recent_duplicate_action"
  | "shipping_cutoff_passed";

export interface BlockReason {
  code: BlockCode;
  detail: string;                    // structured enough for Brand Agent to render
  unblocksIn?: ISO8601;              // when this will naturally resolve, if applicable
}

export type BlockCode =
  | "integration_disconnected"
  | "missing_required_consent"
  | "ledger_idempotency_violation"
  | "manufacturing_capacity_exhausted"
  | "billing_state_invalid"
  | "stale_data_beyond_threshold"
  | "conflicting_in_flight_change";

export interface Remediation {
  userActionRequired?: UserAction;
  systemActionRequired?: SystemAction;
  estimatedResolutionTimeMs?: number;
}

export interface SideEffect {
  kind: "event_append" | "db_write" | "external_call" | "scheduled_job";
  target: string;                    // table name, service name, etc.
  reversible: boolean;
  reversalStepOrder?: number;        // links to rollbackPlan
}

export interface RollbackStep {
  order: number;
  action: string;
  requiresHumanApproval: boolean;    // some rollbacks can't be automated (already-shipped bottle)
}
```

### 6.1 Why This Shape

- **`validatedDecision` is echoed** — guarantees Brand Agent renders *exactly* what was validated, never a drift.
- **Every side effect is declared** — no hidden writes, full audit.
- **Idempotency is the agent's responsibility** — never the caller's.
- **Rollback is planned up front** — if step 3 of 5 fails, steps 1–2 have named reversal actions.

---

## 7. PROMPT ARCHITECTURE

### 7.1 Deterministic-First Pipeline

The agent is **80% deterministic code, 20% LLM**:

```
┌────────────────────────────────────────┐
│ 1. Load integration health snapshot    │  deterministic
├────────────────────────────────────────┤
│ 2. Run rule pack against decision      │  deterministic
│    - integration freshness             │
│    - consent coverage                  │
│    - manufacturing capacity            │
│    - billing state                     │
│    - idempotency (check recent ledger) │
│    - shipping cutoffs                  │
├────────────────────────────────────────┤
│ 3. If all rules pass → build plan      │  deterministic
├────────────────────────────────────────┤
│ 4. If composite/novel case →           │  LLM
│    Claude Sonnet for plan synthesis    │
├────────────────────────────────────────┤
│ 5. Validate plan shape + return        │  deterministic (Zod)
└────────────────────────────────────────┘
```

### 7.2 System Prompt (LLM Path Only)

```
You are the Engineering Agent for Aissisted.

You are a RUNTIME VALIDATOR. You do not write code. You do not design UX.
You answer one question:

  "Can the system execute this decision cleanly, right now, without
   breaking a downstream promise?"

You have three possible verdicts:
  - pass
  - pass_with_compensations
  - block

You must produce:
  - A structured execution plan (if pass)
  - A set of compensations (if pass_with_compensations)
  - A block reason + remediation (if block)
  - Named side effects with idempotency keys
  - A rollback plan

PRINCIPLES:
1. Block is acceptable. Silent failure is not.
2. Every side effect is declared, logged, reversible (where physically possible).
3. Idempotency is never the caller's job. Generate keys here.
4. If a decision would require executing the same side effect twice within
   a short window, treat it as a duplicate — block with remediation.
5. If you need information you don't have, block with a precise
   "integration_refresh_required" remediation.

RETURN FORMAT:
Always return a valid EngineeringValidation JSON object.
No prose. No apology. No summary.
```

### 7.3 Runtime Template

```
INTENT: {intent.class}
PROPOSED DECISION: {productAgentOutput}
DATA SIGNALS (if present): {dataAgentOutput}

USER PROFILE SLICE: {profileSlice}
CURRENT PROTOCOL: {protocolCurrent}
CONSENT STATE: {consentState}
INTEGRATION HEALTH: {integrationHealthSnapshot}
MANUFACTURING STATE: {manufacturingCapacity}
BILLING STATE: {billingState}
RECENT IN-FLIGHT EVENTS (last 72h): {recentEvents}

Return an EngineeringValidation JSON object.
```

### 7.4 Model Selection

| Case | Primary | Fallback | Budget |
|------|---------|----------|--------|
| Standard adjust_protocol | **deterministic rules only** | — | 40ms / 0 tok |
| Composite compensations needed | Sonnet 4.6 | Opus 4.6 | 800ms / 1200 tok |
| Novel integration pattern | Sonnet 4.6 | Opus 4.6 | 1000ms / 1500 tok |
| `action.sync_device` | deterministic only | — | 20ms / 0 tok |

**Rule:** If deterministic rules produce a confident verdict, the LLM is not invoked. Cost and latency stay low for the common path.

---

## 8. VALIDATION PATTERNS

### 8.1 The Six Deterministic Checks

Every proposed decision runs through these in order. First failure determines verdict.

1. **Consent** — does the user's consent state cover every integration this decision touches?
2. **Integration freshness** — is every required data source synced within threshold?
3. **Idempotency** — has a materially identical decision been executed in the last 72h?
4. **Manufacturing capacity** — can the proposed ship date be met?
5. **Billing state** — is the subscription active and payment method valid?
6. **Conflicting in-flight** — is there a pending protocol change still processing?

### 8.2 Freshness Thresholds (Deterministic Registry)

```yaml
# config/agents/engineering/freshness.v1.yaml
freshness_thresholds:
  biomarker_labs: "90d"
  whoop_recovery: "48h"
  oura_readiness: "48h"
  apple_activity: "72h"
  mychart_records: "30d"
  manufacturing_snapshot: "5m"
  billing_state: "1h"
```

Stale beyond threshold → `block` with `stale_data_beyond_threshold` + remediation that triggers a refresh.

### 8.3 Compensation Catalog

Common `pass_with_compensations` patterns:

| Reason | Compensation | User Impact |
|--------|--------------|-------------|
| Manufacturing blackout | Delay ship date to next open window | `delayed_message` |
| Integration stale (non-critical) | Proceed + schedule refresh job | `invisible` |
| Shipping cutoff passed today | Execute at next cutoff | `invisible` |
| Payment retry pending | Hold execution 24h, retry billing first | `requires_notice` |
| Recent duplicate suspected | Require user confirmation | `requires_notice` |

### 8.4 Block-with-Remediation Patterns

Blocks never dead-end. Every block carries a **remediation**:

- **User action required** — "Reconnect WHOOP" / "Update payment method"
- **System action required** — "Retry integration sync (auto-scheduled)"
- **Temporal** — "Unblocks at {unblocksIn}"

The Brand Agent renders the remediation in-voice; never the raw block code.

### 8.5 Idempotency Key Pattern

```
{userId}:{decisionKind}:{contentHash}:{windowedTimestamp}
```

Where `windowedTimestamp` is rounded to the nearest hour for long-horizon decisions (protocol adjustments) and to the nearest 15 minutes for faster ones. Two decisions within the same window with the same content produce the same key — a dedup hit.

---

## 9. INTEGRATION

### 9.1 With the Orchestrator

Engineering Agent is a leaf node invoked per the routing table in `ORCHESTRATOR_ROUTING_SPEC.md` §6. Most common graph:

```
action.adjust_protocol:  Data → Product → Engineering(validate) → Brand
```

If Engineering returns `block`, the orchestrator:
- Skips the Brand Agent entirely
- Substitutes a safe fallback + remediation copy
- Logs `agent.engineering.blocked` with the full validation object
- Does not append any events proposed by Product

If Engineering returns `pass_with_compensations`, the orchestrator:
- Passes the validation (including compensations) to Brand Agent
- Brand Agent renders compensations into voice ("Your formula is updating — first shipment arrives Tuesday")
- Events append per the execution plan

If Engineering returns `pass`, execution proceeds as planned.

### 9.2 With the State API

Engineering Agent is **read-mostly** but proposes events:

- `agent.decision.made` — always (audit)
- `agent.engineering.blocked` — on block, with full validation
- Events from the `ExecutionPlan.steps[].kind === "append_event"` entries — orchestrator appends these after validation

It **never writes directly**. The orchestrator holds the write pen.

### 9.3 With the Safety Gate

Engineering runs **after** Product but **before** the Safety Gate (per orchestrator spec, Safety is the final gate before Brand Filter). If Engineering passes a decision but Safety later flags it, the full response collapses to a safe fallback — and Engineering's planned side effects are **not executed** (the orchestrator gates event appends on the full pipeline succeeding).

### 9.4 With External Integrations

Engineering does not call external APIs directly. It **reads integration health** via the health service, then **declares** the external calls in its execution plan. The orchestrator's executor performs the actual calls, with retries, backoff, and logging.

This keeps the agent pure: same input → same plan. No side effects inside the agent itself.

---

## 10. GOLDEN TEST CASES

Eight cases across verdict types. Each becomes a regression fixture.

### Test 1 — Clean pass
**Input:** `adjust_minor` decision, all integrations fresh, manufacturing open, billing active.
**Expected:** `verdict: "pass"`, execution plan with 4 ordered steps (append protocol event, persist, trigger manufacturing, queue notification), idempotency keys generated, rollback plan defined.

### Test 2 — Integration stale
**Input:** `adjust_minor` decision. WHOOP last sync 72h ago (threshold 48h).
**Expected:** `verdict: "block"`, `blockCode: "stale_data_beyond_threshold"`, remediation triggers WHOOP refresh job + retry window of 1h.

### Test 3 — Consent missing
**Input:** Decision references a MyChart biomarker but user revoked MyChart consent 2 weeks ago.
**Expected:** `verdict: "block"`, `blockCode: "missing_required_consent"`, remediation = "reconnect_mychart" user action.

### Test 4 — Manufacturing blackout
**Input:** `adjust_major` with proposed ship date inside blackout window.
**Expected:** `verdict: "pass_with_compensations"`, compensation delays ship to next open window, `impactOnUser: "delayed_message"`.

### Test 5 — Idempotency violation
**Input:** Identical `adjust_minor` decision to one executed 4h ago.
**Expected:** `verdict: "block"`, `blockCode: "ledger_idempotency_violation"`, remediation = require user confirmation to force.

### Test 6 — Conflicting in-flight change
**Input:** A protocol adjustment from 2h ago is still processing through manufacturing.
**Expected:** `verdict: "block"`, `blockCode: "conflicting_in_flight_change"`, `unblocksIn` = estimated completion of in-flight.

### Test 7 — Silent sync (`action.sync_device`)
**Input:** WHOOP sync request, token valid, last sync 30m ago.
**Expected:** `verdict: "pass"`, minimal plan: one `refresh_integration` step, no user-facing notification.

### Test 8 — Billing retry pending
**Input:** Decision valid, but payment method retry scheduled in 12h.
**Expected:** `verdict: "pass_with_compensations"`, compensation holds execution until billing resolves, `impactOnUser: "requires_notice"`.

---

## 11. BUDGET

### 11.1 Latency

| Path | Hard Ceiling | Target p50 | Target p95 |
|------|--------------|-----------|-----------|
| Deterministic-only | 80ms | 25ms | 60ms |
| LLM-path (compensations) | 1500ms | 700ms | 1200ms |
| LLM-path (novel) | 2000ms | 900ms | 1500ms |

### 11.2 Tokens

Input max: 8,000 tokens (includes integration snapshot, recent events). Output max: 2,000 tokens (structured JSON).

### 11.3 Cost Guardrail

- Per-user per-day cap: $0.15 (most invocations are deterministic — free)
- LLM-path breach: degrade to deterministic-only, log, alert
- Aggregate cap per 5-min window per user: 3 LLM invocations

---

## 12. OBSERVABILITY

### 12.1 Events Emitted

- `agent.decision.made` — always
- `agent.engineering.verdict` — with verdict, check_results, latencyMs
- `agent.engineering.blocked` — on block, with full validation object
- `agent.engineering.compensation_applied` — on pass_with_compensations
- `agent.engineering.rule_fired` — per deterministic rule that changed verdict

### 12.2 Metrics

| Metric | Target |
|--------|--------|
| Deterministic-path hit rate | > 90% |
| Block rate (of all adjust_protocol) | 5–15% (sanity band) |
| Pass_with_compensations rate | 10–25% |
| LLM-path p95 latency | within channel ceiling |
| Rollback invocations per 1000 executions | < 2 |
| Silent-sync success rate | > 98% |

### 12.3 Review Cadence

Engineering owns a weekly dashboard:
- Verdict distribution
- Top blocking reasons (drives remediation copy improvements)
- Compensation frequency (drives scheduling/capacity investments)
- Integration freshness trends (drives refresh-job cadence)
- Idempotency collision rate (drives UI guardrails)

---

## 13. VERSIONING

- System prompt lives in `packages/config/agents/engineering/system.v1.md`
- Runtime template lives in `packages/config/agents/engineering/template.v1.md`
- Rule packs in `packages/config/agents/engineering/rules/*.v1.yaml`
- Schema types in `packages/types/agents/EngineeringAgent.ts`
- Freshness thresholds in `packages/config/agents/engineering/freshness.v1.yaml`
- Every change requires Engineering owner approval + regression on golden test set
- Agent version emitted on every event for traceability

---

## 14. OUTCOME

When this is live:

- **No user-facing promise is made that the system cannot keep.**
- **Every side effect is declared, keyed, and reversible where physically possible.**
- **Blocks are precise and remedial** — "reconnect WHOOP," not "something went wrong."
- **Compensations are native** — a blackout becomes a Tuesday shipment, not a broken promise.
- **The common path is free** — 90%+ of validations never touch an LLM.
- **Audit is complete** — every decision, every check, every side effect traceable in the ledger.

---

## 15. OWNERSHIP

- **Engineering:** rule packs, freshness thresholds, execution plan shape, runtime
- **Product:** decision shape Engineering validates (defined in Product Agent spec)
- **Brand:** renders block reasons and compensations — does not write its own

Every schema change touches Engineering first. Product and Brand consume.

---

## 16. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify `EngineeringValidation` schema v1.0 | Ron + Engineering | Yes |
| 2 | Implement deterministic rule pack (6 checks) | Engineering | Yes |
| 3 | Build integration health service (`apps/api/src/services/integrations/health.ts`) | Engineering | Yes |
| 4 | Author `freshness.v1.yaml` with Product + Clinical input | Ron + Engineering + Clinical | Yes |
| 5 | Author idempotency key generator + ledger lookup | Engineering | Yes |
| 6 | Build 8 golden test cases into regression harness | Engineering | Yes |
| 7 | Draft Growth Agent spec (final agent) | Ron + Claude | Next |
| 8 | Wire into orchestrator agent graph post-Data, pre-Brand | Engineering | After Growth Agent |
| 9 | Dry-run on synthetic adjustment scenarios | Ron + Engineering | Before Brand wiring |

### Immediate (next 72 hours)

1. **Freeze the `EngineeringValidation` schema.** The verdict + plan + rollback shape is the contract every downstream system depends on.
2. **Pick freshness thresholds.** These are clinical + product calls. Wrong thresholds = false blocks or unsafe passes.
3. **Define the compensation catalog v1.** The five listed here are the start. Additions require Engineering + Product + Brand sign-off.

---

## 17. OPEN QUESTIONS

1. **Rollback for already-shipped bottles** — is there any automated path, or is every post-ship rollback a human customer-ops ticket? Recommend: human-ticket for now, structured handoff.
2. **LLM-path escalation** — which novel compositions actually need an LLM, vs. being added to the rule pack? Recommend: ship deterministic-only v1, add LLM path only when a specific case recurs ≥ 3 times.
3. **Cross-user manufacturing contention** — when capacity is tight, who gets the next slot? Engagement tier? FIFO? Recommend: FIFO + engagement-tier tiebreaker.
4. **Integration refresh budget** — can we auto-trigger refresh jobs from blocks, or must the user do it? Recommend: auto-refresh for token-refresh-only paths; user-prompt for reconnects.
5. **Partial plan execution** — if step 3 of 5 fails, do we surface a partial state to Brand Agent or roll back fully? Recommend: roll back fully for v1; revisit when failure patterns are observable.

---

*End of spec. v1.1. — Runtime-aligned, ready for engineering review.*
