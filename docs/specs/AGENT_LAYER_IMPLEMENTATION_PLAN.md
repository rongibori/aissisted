# AISSISTED — AGENT LAYER IMPLEMENTATION PLAN

**Date:** 2026-04-16
**Status:** Ready for execution
**Goal:** Wire the multi-agent architecture into the existing Fastify API in 5 PR-sized cuts

---

## CURRENT STATE (verified against real code)

### What exists

| Component | Location | What it does |
|-----------|----------|-------------|
| Fastify API | `apps/api/src/index.ts` | Registers routes, plugins, JWT, rate limiter |
| Jeffrey monolith | `apps/api/src/services/jeffrey.service.ts` | Intent routing + context loading + Claude call + fallback — all in one function |
| Intent parser | `apps/api/src/services/intent.ts` | Haiku-powered classifier (9 intent types) with regex fallback |
| Protocol engine | `apps/api/src/engine/` | Deterministic: evaluator + registry + rules (sleep, inflammation, hormones, energy, cognition) |
| Analysis service | `apps/api/src/services/analysis.service.ts` | Health state computation, compound patterns, domain scoring |
| Trends service | `apps/api/src/services/trends.service.ts` | Rolling averages, slope, trend direction |
| Biomarker ranges | `apps/api/src/engine/biomarker-ranges.ts` | Reference range lookups |
| Chat route | `apps/api/src/routes/chat.ts` | POST /chat → jeffrey.service.chat() |
| DB schema | `packages/db/src/schema.ts` | SQLite via Drizzle: users, health_profiles, biomarkers, protocols, health_signals, health_state_snapshots, biomarker_trends, medications, conditions, supplement_logs, consent_records, audit_log |

### The problem

`jeffrey.service.ts` is a monolith. One 340-line function does:
1. Conversation management
2. Intent parsing
3. Intent-specific side effects (protocol gen, adherence logging, health state check)
4. User context assembly (profile + biomarkers + protocol + health state + trends)
5. Claude API call with system prompt + history
6. Fallback responses

The agent layer decomposes this into typed, testable, auditable pieces.

---

## TARGET STATE

```
POST /chat → chatRoutes → orchestrator.handle(userId, message, conversationId)
                              │
                              ├── 1. intentClassifier.classify(message)
                              ├── 2. stateLoader.getSlice(userId, requiredKeys)
                              ├── 3. planBuilder.plan(intent, context)
                              ├── 4. executor.run(plan)
                              │       ├── data.execute(...)
                              │       ├── product.execute(...)
                              │       ├── engineering.execute(...)
                              │       └── brand.execute(...)
                              ├── 5. safetyGate.inspect(agentOutputs)
                              ├── 6. brandFilter.filter(brandOutput)
                              └── 7. return { reply, conversationId, audit }
```

---

## FILE TREE (new files only)

```
apps/api/src/
  agents/
    types.ts              ← Agent interfaces, AgentOutput, Intent taxonomy
    orchestrator.ts       ← Main entry point, replaces jeffrey.service routing
    plan-builder.ts       ← Intent → AgentGraph
    executor.ts           ← Runs the agent DAG and collects outputs
    state-loader.ts       ← getSlice(userId, keys[]) — typed context reads
    data.ts               ← Wraps analysis + trends into DataAgentOutput
    product.ts            ← Structured decision agent
    engineering.ts        ← Execution validator for side-effectful actions
    brand.ts              ← Terminal renderer for user-facing copy
    safety-gate.ts        ← Deterministic safety checkpoint
    brand-filter.ts       ← Deterministic brand gate (L1)
    growth.ts             ← Async advisory layer for scheduled/lifecycle work
    __tests__/
      orchestrator.test.ts
      data.test.ts
      brand-filter.test.ts

packages/db/src/
  schema.ts              ← ADD: agent_decisions table (audit ledger)
```

---

## THE 5 PRs

### PR 1: Agent Types + State Loader
**Scope:** Foundation. No behavior change. No risk.

**Files:**
- `apps/api/src/agents/types.ts` — Agent interface, output types, intent taxonomy
- `apps/api/src/agents/state-loader.ts` — Replaces ad-hoc context loading in jeffrey.service

**types.ts — Core contract:**

```typescript
// The interface every agent implements
export interface Agent<TInput = AgentContext, TOutput = AgentOutput> {
  name: string;
  version: string;
  requiredSlice: StateSliceKey[];
  execute(input: TInput): Promise<TOutput>;
}

// What every agent returns
export interface AgentOutput {
  agentName: string;
  content: string;           // primary text output
  structured?: unknown;      // typed data (protocol, signals, etc.)
  confidence: number;        // 0-1
  reasoning: string;         // why this output (for audit)
  sideEffects?: SideEffect[];
}

// What the orchestrator passes to agents
export interface AgentContext {
  userId: string;
  intent: ClassifiedIntent;
  state: StateSlice;
  conversationHistory: ConversationMessage[];
  previousAgentOutputs?: AgentOutput[];  // for chained agents
}

// State slice keys — each maps to a data fetch
export type StateSliceKey =
  | "profile"
  | "biomarkers"
  | "protocol"
  | "healthState"
  | "trends"
  | "adherence"
  | "medications"
  | "conditions"
  | "conversations";

// Typed state projection
export interface StateSlice {
  profile?: ProfileData;
  biomarkers?: BiomarkerData[];
  protocol?: ProtocolData;
  healthState?: HealthStateData;
  trends?: TrendData[];
  adherence?: AdherenceData;
  medications?: MedicationData[];
  conditions?: ConditionData[];
}

// Intent taxonomy aligns to ORCHESTRATOR_ROUTING_SPEC.md §5
export type IntentClass =
  | "question.general"
  | "question.personal"
  | "question.protocol"
  | "reflection.mood"
  | "reflection.progress"
  | "action.update_goal"
  | "action.log_biomarker"
  | "action.sync_device"
  | "action.update_preference"
  | "action.adjust_protocol"
  | "navigation.show_insights"
  | "navigation.show_protocol"
  | "navigation.show_history"
  | "onboarding.step"
  | "milestone.acknowledged"
  | "safety.symptom_reported"
  | "safety.crisis"
  | "system.scheduled.review"
  | "system.ingestion.tick";

export interface ClassifiedIntent {
  class: IntentClass;
  confidence: 0 | 1 | 2 | 3;
  modifiers: string[];
  entities: Record<string, unknown>;
  requiresPHIAccess: boolean;
}
```

**state-loader.ts — Typed context reader:**

Extracts the 5 parallel fetches from `jeffrey.service.ts` lines 120-131 into a typed, reusable loader:

```typescript
export async function getStateSlice(
  userId: string,
  keys: StateSliceKey[]
): Promise<StateSlice> {
  // Only fetch what the agent needs — parallel
  const fetchers = new Map<StateSliceKey, () => Promise<unknown>>();
  // ... maps each key to existing service calls
  // getProfile, getLatestBiomarkers, getLatestProtocol, etc.
  
  const results = await Promise.all(
    keys.map(k => fetchers.get(k)?.() ?? Promise.resolve(undefined))
  );
  
  return Object.fromEntries(keys.map((k, i) => [k, results[i]]));
}
```

**Why first:** Everything else depends on these types. This PR is pure additive — zero behavior change, zero risk.

**Tests:** Unit tests for state-loader against real DB.

---

### PR 2: Data Agent (wraps existing engine)
**Scope:** Wrap analysis + engine + trends into the shared Agent interface. No rewrite.

**File:** `apps/api/src/agents/data.ts`

**What it does:**
1. Receives `AgentContext` with `biomarkers`, `healthState`, `trends`, `medications` slices
2. Calls existing services:
   - `analysis.service.ts` → health state computation
   - `engine/evaluator.ts` → protocol scoring
   - `trends.service.ts` → trend analysis
   - `engine/biomarker-ranges.ts` → range status
3. Returns `AgentOutput` with structured signals:

```typescript
interface DataAgentOutput extends AgentOutput {
  structured: {
    signals: HealthSignal[];          // ranked by severity
    domainScores: Record<string, number>;
    trends: TrendSummary[];
    interactionRisks: InteractionRisk[];
    missingData: string[];
    healthMode: string;
    confidence: number;
  };
}
```

**Key principle:** The Data Agent adds NO new logic. It wraps what exists. The `evaluate()`, `getRangeStatus()`, `getLatestHealthState()` functions are already tested and working. The Data Agent just structures their outputs into the `AgentOutput` contract.

**Tests:** Given biomarkers + profile → verify signal output structure and ranking.

---

### PR 3: Safety Gate + Brand Filter
**Scope:** Two lightweight filters that wrap agent outputs before they reach the user.

**safety-gate.ts:**
- Checks interaction risks from Data Agent signals
- Flags critical biomarker values
- Detects crisis language
- Returns `{ pass: boolean, blocked: string[], warnings: string[] }`
- Pure deterministic — no LLM calls

**brand-filter.ts (L1 only for Phase 1):**
- Deterministic rules:
  - Forbidden words: "users", "customers", "revolutionary", "cutting-edge", "cure"
  - No leading with AI ("our AI-powered...")
  - Length budget per channel (chat: 300 tokens, card: 80 tokens)
  - Personalization check: must contain user's name or "your"
  - No unstructured lists in voice responses
- Returns `{ pass: boolean, score: number, violations: string[] }`
- L2 (LLM-scored) deferred to Phase 2

**Why together:** Both are small, pure functions that take text → return verdict. No state, no side effects. Easy to test in isolation.

**Tests:** Snapshot tests: given text → expected violations.

---

### PR 4: Plan Builder + Executor + Orchestrator
**Scope:** The brain. Replaces jeffrey.service routing logic with the v1.1 agent DAG and terminal Brand rendering.

**plan-builder.ts — Intent → Agent Graph:**

```typescript
// Maps intent classes to declarative execution plans
const INTENT_PLANS: Record<IntentClass, AgentPlan> = {
  "question.general": {
    agents: ["brand"],
    parallel: false,
  },
  "question.personal": {
    agents: ["data", "brand"],
    parallel: false,
  },
  "question.protocol": {
    agents: ["product", "brand"],
    parallel: false,
  },
  "reflection.progress": {
    agents: ["data", "product", "brand"],
    parallel: false,
  },
  "action.adjust_protocol": {
    agents: ["data", "product", "engineering", "brand"],
    parallel: false,
    sideEffects: ["persistProtocol", "scheduleFollowup"],
  },
  "onboarding.step": {
    agents: ["product", "brand"],
    parallel: false,
  },
  "system.scheduled.review": {
    agents: ["data", "product", "brand"],
    parallel: false,
  },
};
```

**executor.ts — Runs the plan:**

```typescript
export async function executePlan(
  plan: AgentPlan,
  context: AgentContext,
  agents: Map<string, Agent>
): Promise<AgentOutput[]> {
  if (plan.parallel) {
    return Promise.all(
      plan.agents.map(name => agents.get(name)!.execute(context))
    );
  }
  // Sequential with output chaining
  const outputs: AgentOutput[] = [];
  for (const name of plan.agents) {
    const result = await agents.get(name)!.execute({
      ...context,
      previousAgentOutputs: outputs,
    });
    outputs.push(result);
  }
  return outputs;
}
```

**orchestrator.ts — The entry point:**

Replaces `jeffrey.service.chat()`:

```typescript
export async function handleMessage(
  userId: string,
  message: string,
  conversationId?: string
): Promise<OrchestratorResult> {
  // 1. Conversation management (reuses conversation.service)
  const conversation = await getOrCreateConversation(userId, conversationId);

  // 2. Classify intent (reuses intent.ts, maps to the orchestrator taxonomy)
  const intent = await classifyIntent(message);

  // 3. Save user message
  await addMessage(conversation.id, "user", message, intent.class);

  // 4. Build plan
  const plan = buildPlan(intent);

  // 5. Load only required state
  const requiredSlices = getRequiredSlices(plan);
  const state = await getStateSlice(userId, requiredSlices);

  // 6. Execute agents
  const context: AgentContext = { userId, intent, state, conversationHistory: [] };
  const agentOutputs = await executePlan(plan, context, agentRegistry);

  // 7. Safety gate over structured outputs
  const safetyResult = safetyGate(agentOutputs, { intent, state });

  // 8. Extract terminal Brand output (or safe fallback)
  const rendered = getTerminalBrandOutput(agentOutputs, safetyResult);

  // 9. Brand filter
  const brandResult = brandFilter(rendered, { intent, channel: "app_card" });

  // 10. Save + return
  await addMessage(conversation.id, "assistant", brandResult.text);
  await logDecision(userId, intent, agentOutputs, brandResult);

  return {
    reply: brandResult.text,
    conversationId: conversation.id,
    intent: intent.class,
  };
}
```

**Migration strategy:** The orchestrator initially calls all the same underlying services as `jeffrey.service.ts`. The chat route switches from `chat()` to `handleMessage()` behind a feature flag:

```typescript
// In chat route:
const handler = config.useAgentLayer ? handleMessage : chat;
const result = await handler(sub, message, conversationId);
```

**Tests:** Integration test: message → orchestrator → response (mocking Claude API).

---

### PR 5: Audit Ledger + Wiring
**Scope:** Observability. Add agent_decisions table, wire feature flag, deprecate jeffrey.service.

**Schema addition:**

```typescript
export const agentDecisions = sqliteTable("agent_decisions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  conversationId: text("conversation_id"),
  intentCategory: text("intent_category").notNull(),
  intentConfidence: real("intent_confidence").notNull(),
  agentsExecuted: text("agents_executed").notNull(),      // JSON array
  agentOutputs: text("agent_outputs").notNull(),           // JSON
  brandFilterScore: real("brand_filter_score"),
  brandFilterViolations: text("brand_filter_violations"),  // JSON array
  safetyGatePass: integer("safety_gate_pass", { mode: "boolean" }),
  totalLatencyMs: integer("total_latency_ms"),
  createdAt: text("created_at").notNull(),
});
```

**Config addition:**

```typescript
// config.ts
useAgentLayer: process.env.USE_AGENT_LAYER === "true",
```

**Wiring:**
1. Chat route uses feature flag to switch handlers
2. Both paths return the same response shape
3. `jeffrey.service.ts` stays — it's the fallback
4. Agent layer is opt-in until verified

---

## DATA MODEL IMPACT

| Table | Change | Risk |
|-------|--------|------|
| `agent_decisions` | NEW | None — additive |
| All existing tables | NO CHANGE | Zero risk |

The agent layer reads from existing tables through existing services. It writes only to `agent_decisions` (new) and `messages` (existing). No schema migration risk.

---

## EXECUTION ORDER

```
Week 1:  PR 1 (types + state loader)  → PR 2 (data agent)
Week 2:  PR 3 (safety + brand filter) → PR 4 (orchestrator)
Week 3:  PR 5 (audit + wiring)        → Integration testing
```

Each PR is independently mergeable. Each leaves the system in a working state. The feature flag in PR 5 means you can ship to prod with the agent layer off, then flip it on per-user.

---

## WHAT THIS DOES NOT INCLUDE (Phase 2)

- Growth Agent async advisory paths — introduced after the core real-time flow is stable
- Brand Filter L2 (LLM scoring) — Phase 1 keeps filtering deterministic-first
- Redis hot memory — Phase 2 adds low-latency session state for voice performance
- Vector memory (pgvector) — Phase 2 for semantic recall and retrieval
- Event ledger (append-only) — Phase 2, after Postgres migration
- Full PostgreSQL migration — parallel infrastructure work, not coupled to first agent cutover

---

## DECISION LOG

| Decision | Rationale |
|----------|-----------|
| Keep jeffrey.service.ts as fallback | Zero-risk deployment. Feature flag rollback in seconds. |
| SQLite stays for Phase 1 | The first cut is a routing/runtime refactor; infra migration should remain decoupled. |
| Data Agent wraps, doesn't rewrite | 70% of the logic exists. Rewriting introduces bugs. |
| Product + Brand ship as constrained agents | Their schemas are already defined; keeping them in Phase 1 preserves the orchestrator contract and avoids a second routing rewrite. |
| Engineering Agent validates side effects before user promises | Execution feasibility must be checked before any adjustment copy is delivered. |
| Brand Filter L1 only | Deterministic rules catch most voice drift. LLM scoring can be layered in after latency is characterized. |
| Audit table, not event ledger | Phase 1 needs observability, not CQRS. Event sourcing lands with the Postgres track. |
