# AISSISTED — ORCHESTRATOR ROUTING SPEC

**Version:** v1.0 (Foundational)
**Owner:** Engineering + Product
**Status:** Production-grade specification, ready for engineering handoff
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1
**Blocks:** Jeffrey voice layer, agent deployment, Brand Filter runtime, safety gating
**Current runtime:** Fastify · SQLite/libsql (Drizzle) · Claude API · AWS
**Target stack (planned migration on `feat/postgres-migration`):** PostgreSQL (Drizzle) · Redis · pgvector

---

## 0. OPERATING LINE

> *"The orchestrator is not a router. It is the decision engine of Aissisted."*

The State & Memory layer gives the system a body.
The Orchestrator gives it a mind.

---

## 1. TENSION

A multi-agent system without orchestration logic is five chatbots in a trench coat. Outputs conflict. Tone drifts. Decisions are untraceable. Nothing compounds.

Worse: in health, ambiguity kills trust. Every response must be coherent, safe, and explainable — or the brand is dead on arrival.

## 2. TRUTH

The orchestrator is the **only** component that:

1. Understands intent
2. Decides which agents run
3. Composes their outputs
4. Enforces safety and brand gates
5. Records the decision for audit

Everything else is a specialist. The orchestrator is the general.

## 3. SHIFT

Stop thinking of the orchestrator as a "prompt that routes." Start thinking of it as a **typed state machine** that:

- Receives intent
- Reads a sliced projection from State & Memory
- Executes an agent graph (sequential, parallel, conditional)
- Runs every output through the Brand Filter + Safety Gate
- Writes `agent.decision.made` events to the ledger
- Returns a single, unified response

Agents are pluggable. The orchestrator is the contract.

---

## 4. SYSTEM — ARCHITECTURE OVERVIEW

```
         ┌──────────────────────────────────────────────┐
         │                  INTENT                       │
         │  (user utterance, app action, scheduled job)  │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          INTENT CLASSIFIER                    │
         │  (taxonomy + confidence + PHI detection)      │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          CONTEXT LOADER                       │
         │   getSlice(userId, requiredSliceKeys[])       │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          PLAN BUILDER                         │
         │  intent + context → AgentGraph (DAG)          │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          EXECUTOR                             │
         │  runs agents in sequence/parallel per DAG     │
         │  (Product · Brand · Engineering · Data · Growth) │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          SAFETY GATE                          │
         │  (interactions, dosing, red flags, crisis)    │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          BRAND FILTER                         │
         │  (tone, simplicity, personalization check)    │
         └──────────────────────┬───────────────────────┘
                                │
                                ▼
         ┌──────────────────────────────────────────────┐
         │          RESPONDER                            │
         │  returns unified output + writes audit event  │
         └──────────────────────────────────────────────┘
```

---

## 5. INTENT MODEL

### 5.1 Top-Level Taxonomy

Every incoming intent is classified into exactly one primary class and zero-or-more modifiers.

```typescript
// /packages/core/orchestrator/Intent.ts

export type IntentClass =
  // Informational
  | "question.general"           // "what does cortisol do?"
  | "question.personal"          // "why am I so tired lately?"
  | "question.protocol"          // "why is magnesium in my formula?"

  // Reflective
  | "reflection.mood"            // "I slept badly last night"
  | "reflection.progress"        // "I feel different this week"

  // Action requests
  | "action.update_goal"
  | "action.log_biomarker"
  | "action.sync_device"
  | "action.update_preference"
  | "action.adjust_protocol"

  // Navigation
  | "navigation.show_insights"
  | "navigation.show_protocol"
  | "navigation.show_history"

  // Onboarding / milestones
  | "onboarding.step"
  | "milestone.acknowledged"

  // Safety-critical
  | "safety.symptom_reported"    // always escalates
  | "safety.crisis"              // always escalates, never routed to AI alone

  // System
  | "system.scheduled.review"    // weekly/daily review jobs
  | "system.ingestion.tick";

export interface ClassifiedIntent {
  class: IntentClass;
  modifiers: IntentModifier[];
  confidence: 0 | 1 | 2 | 3;     // 3 = certain, 0 = guessing
  rawInput: string;
  detectedPHI: boolean;
  detectedRedFlags: RedFlag[];   // e.g. chest pain, suicidal ideation
  sessionId: SessionId;
  timestamp: ISO8601;
}

export type IntentModifier =
  | "voice"                      // came through Jeffrey
  | "app"
  | "scheduled"
  | "first_interaction"
  | "requires_recent_labs"
  | "requires_wearable_data";
```

### 5.2 Classification Implementation

- **Primary model:** small fine-tuned classifier (Claude Haiku or equivalent) for latency + cost
- **Fallback:** Claude Sonnet when confidence < 2
- **Red-flag detection:** **deterministic keyword + regex layer**, never left to the LLM alone. Any hit forces `safety.*` class regardless of primary classification.
- **Latency budget:** < 150ms for app, < 80ms for voice (Jeffrey cannot pause)

### 5.3 Confidence Handling

| Confidence | Behavior |
|------------|----------|
| 3 | Proceed without clarification |
| 2 | Proceed but include a confirmation in response ("Just to make sure I understood…") |
| 1 | Ask one clarifying question before routing |
| 0 | Default to a safe fallback: "Can you tell me a bit more?" |

---

## 6. ROUTING DECISION TABLE

The routing logic is **declarative, not prompted**. The orchestrator loads this table at boot and applies it deterministically.

| Intent Class | Required Slice | Agent Graph | Safety | Brand Filter |
|--------------|---------------|-------------|--------|--------------|
| `question.general` | `profile` | `Brand` only | — | full |
| `question.personal` | `profile`, `memory`, `biometrics` | `Data → Brand` | interactions | full |
| `question.protocol` | `profile`, `protocol`, `memory` | `Product → Brand` | — | full |
| `reflection.mood` | `profile`, `memory`, `lifestyle` | `Data(light) ∥ Brand` | red-flag scan | full |
| `reflection.progress` | `profile`, `memory`, `biometrics`, `protocol` | `Data → Product → Brand` | interactions | full |
| `action.update_goal` | `profile`, `memory` | `Product → Brand` | — | full |
| `action.log_biomarker` | `biometrics`, `provenance` | `Data` (silent) | reference-range scan | minimal |
| `action.adjust_protocol` | ALL | `Data → Product → Engineering(validate) → Brand` | **full safety pipeline** | full |
| `navigation.*` | `profile` | `Brand` only | — | full |
| `onboarding.step` | `profile` | `Product → Brand` | — | full |
| `safety.symptom_reported` | `profile`, `biometrics` | **Safety escalation** (not AI) | full | human-only |
| `safety.crisis` | `profile` | **Immediate human escalation** | full | crisis protocol |
| `system.scheduled.review` | ALL | `Data → Product → Brand` | interactions | full |

**Rule:** If a new intent class is introduced, this table is the only place it gets registered. No code paths, no conditionals scattered across agents.

---

## 7. COMPOSITION PATTERNS

### 7.1 The Three Patterns

Every agent graph is expressed as a DAG composed of three primitives:

**Sequential** (`→`): Output of A feeds into B.
Use when: one agent's output is the input for the next (e.g., `Data → Brand`).

**Parallel** (`∥`): A and B run simultaneously; results merge.
Use when: agents operate on the same input independently and their outputs compose cleanly (e.g., `Data ∥ Growth` for a weekly review).

**Conditional** (`?`): Branch is taken only if a predicate holds.
Use when: downstream work depends on upstream findings (e.g., `Data ? (anomaly) → Safety`).

### 7.2 Graph Representation

```typescript
export type AgentGraph =
  | { kind: "leaf"; agent: AgentName }
  | { kind: "sequence"; nodes: AgentGraph[] }
  | { kind: "parallel"; nodes: AgentGraph[] }
  | { kind: "conditional"; predicate: Predicate; then: AgentGraph; else?: AgentGraph };

// Example: adjust_protocol
const adjustProtocolGraph: AgentGraph = {
  kind: "sequence",
  nodes: [
    { kind: "leaf", agent: "data" },
    { kind: "leaf", agent: "product" },
    {
      kind: "conditional",
      predicate: { kind: "hasInteractionRisk" },
      then: { kind: "leaf", agent: "safety" },
      else: { kind: "leaf", agent: "brand" },
    },
  ],
};
```

### 7.3 Execution Semantics

- **Timeouts are per node.** Default 5s. Voice overrides to 2s.
- **Failure handling:** a failed leaf triggers the node's fallback (see §10). Graph execution continues only if the node is marked `optional`.
- **State isolation:** every agent receives a **read-only** copy of its slice. Agents cannot mutate shared state. They can only propose events through the `StateProjectionAPI.appendEvent` method on the orchestrator's behalf.

---

## 8. AGENT I/O CONTRACT

Every agent — regardless of domain — implements the same interface.

```typescript
// /packages/core/orchestrator/Agent.ts

export interface Agent<TInput = AgentInput, TOutput = AgentOutput> {
  name: AgentName;
  version: string;
  requiredSlice: (keyof UserState)[];
  invoke(input: TInput, ctx: AgentContext): Promise<TOutput>;
}

export interface AgentContext {
  userId: UserId;
  sessionId: SessionId;
  state: Readonly<Partial<UserState>>;   // sliced
  memory: MemoryReader;                  // read-only cold memory access
  requestId: RequestId;                  // for tracing
  budget: { maxTokens: number; maxLatencyMs: number };
}

export interface AgentInput {
  intent: ClassifiedIntent;
  upstreamOutputs: Record<AgentName, AgentOutput>;
}

export interface AgentOutput {
  agent: AgentName;
  kind: "text" | "structured" | "event_proposal" | "no_op";
  content: unknown;                      // typed per agent
  proposedEvents: Event[];               // appended by orchestrator, not agent
  confidence: 0 | 1 | 2 | 3;
  reasoning?: string;                    // for explainability + audit
  tokensUsed: number;
  latencyMs: number;
}
```

**Rule:** Agents are pure functions of `(input, context) → output`. No side effects. No direct writes. No hidden state.

---

## 9. BRAND FILTER — THE RUNTIME GATE

The Brand Filter is **not** the Brand Agent. It is a final, deterministic check that runs after every user-facing output.

### 9.1 The Filter

```typescript
export interface BrandFilterResult {
  passed: boolean;
  score: 0 | 1 | 2 | 3 | 4 | 5;
  failures: BrandFilterFailure[];
  revisedOutput?: string;   // if auto-revision is enabled
}

export type BrandFilterFailure =
  | "too_generic"
  | "too_clinical"
  | "too_long"
  | "uses_forbidden_word"
  | "missing_personalization"
  | "not_premium_tone"
  | "leads_with_ai"
  | "corporate_voice";
```

### 9.2 Checks (Deterministic First, LLM Second)

**Deterministic (fast, always runs):**
- Forbidden-word list: `users`, `customers`, `revolutionary`, `cutting-edge`, `miracle`, `cure`
- Max length per context (voice: 40 words, app card: 80 words, email: 200 words)
- Personalization markers: output must reference user's name, goal, or recent data at least once

**LLM-scored (when deterministic passes):**
- Tone check: does it feel "calm, clear, certain"?
- Individual-first: does it read as written for one person?
- Specificity: does it avoid generic statements?

### 9.3 Failure Modes

| Severity | Action |
|----------|--------|
| Minor (score ≥ 3) | Log, pass through |
| Moderate (score 2) | Auto-revise via Brand Agent, one attempt |
| Severe (score ≤ 1) | Block output, log, return safe fallback |

**Rule:** The Brand Filter has a **latency budget of 200ms** for deterministic checks. The LLM-scored layer runs asynchronously for retrospective learning unless it's an adjust_protocol path, where it runs inline.

---

## 10. SAFETY GATE

This runs **before** the Brand Filter, and it is **non-negotiable**.

### 10.1 Checks

1. **Red flag scan** — crisis language, chest pain, suicidal ideation, anaphylaxis indicators
2. **Interaction check** — any proposed supplement against current medications (from labs + user input)
3. **Dosing bounds** — every dose within established safe ranges
4. **Contradicting recent labs** — don't recommend iron if ferritin is high, etc.
5. **Recency check** — any data older than its freshness threshold flags a "stale data" warning instead of a confident recommendation

### 10.2 Outcomes

| Finding | Outcome |
|---------|---------|
| Red flag | Immediate escalation to human-in-the-loop. AI response suppressed. |
| Interaction risk | Block recommendation. Return explainable caution + escalation path. |
| Dose out of range | Block. Require clinician override. |
| Contradiction | Block. Require data refresh or clinician override. |
| Stale data | Allow, but mark output with freshness caveat. |

### 10.3 Implementation

- **Deterministic rules engine** (not LLM-reasoned)
- Rules live in a versioned YAML registry
- Every fired rule generates a `safety.rule.fired` event in the ledger
- Safety events **cannot** be overridden by any agent; only a human reviewer with the right role can release the hold

---

## 11. OBSERVABILITY & AUDIT

Every orchestrator execution produces a structured trace.

```typescript
export interface OrchestratorTrace {
  requestId: RequestId;
  userId: UserId;
  sessionId: SessionId;
  intent: ClassifiedIntent;
  graph: AgentGraph;
  nodeResults: Array<{
    agent: AgentName;
    startedAt: ISO8601;
    completedAt: ISO8601;
    outcome: "ok" | "timeout" | "error" | "skipped";
    tokensUsed: number;
    error?: string;
  }>;
  safetyGate: { passed: boolean; firedRules: string[] };
  brandFilter: BrandFilterResult;
  finalOutput: string | null;
  totalLatencyMs: number;
}
```

### 11.1 Storage

- **Hot path:** the trace is attached to a `agent.decision.made` event in the event ledger
- **Cold path:** full traces streamed to CloudWatch Logs + queryable in OpenSearch
- **Retention:** 2 years for PHI-adjacent traces (HIPAA minimum 6 for some artifacts — align with Legal)

### 11.2 Key Metrics to Track

| Metric | Target |
|--------|--------|
| Intent classification accuracy | > 92% |
| Intent → agent-graph p95 latency (app) | < 400ms |
| Intent → agent-graph p95 latency (voice) | < 1.2s |
| Brand Filter pass rate on first attempt | > 85% |
| Safety gate false-positive rate | < 5% |
| Safety gate false-negative rate | 0 (paged incident if ever > 0) |

---

## 12. ERROR HANDLING & FALLBACKS

### 12.1 Graceful Degradation Ladder

1. **Preferred agent fails** → retry with same agent (1×)
2. **Retry fails** → run with smaller context slice
3. **Still fails** → fall back to Brand-only response using cached memory
4. **Brand-only fails** → return curated static fallback: *"Something went quiet on my side. Try again in a moment."*

### 12.2 Silent-Fail Prevention

Every failure writes a `agent.failure` event. Three failures for the same user in 10 minutes triggers:
- A degraded-mode banner in the app
- A page to the on-call engineer
- A suppression of scheduled jobs for that user until cleared

### 12.3 Idempotency

Every orchestrator request carries a client-supplied `requestId`. Duplicate `requestId`s return the cached result. This matters for voice — Jeffrey retries are common.

---

## 13. JEFFREY INTERFACE (VOICE LAYER)

Jeffrey is a **consumer** of the orchestrator, not a peer.

### 13.1 Contract

```typescript
// Jeffrey's turn-level flow:
const turnResult = await orchestrator.handle({
  userId,
  sessionId,
  rawInput: transcribedUtterance,
  channel: "voice",
  budget: { maxLatencyMs: 1200, maxTokens: 400 },
});

// Jeffrey handles TTS + barge-in + interruption locally.
// The orchestrator returns text. Jeffrey voices it.
```

### 13.2 Voice-Specific Constraints

- Max 40 words per output (enforced by Brand Filter)
- No tables, no bullet lists (Brand Filter strips them)
- No URLs spoken (referred to as "I sent it to your app")
- Latency budget is **ruthless**: any node that exceeds its slice is killed

---

## 14. IMPLEMENTATION PLAN (ALIGNED TO CURRENT STACK)

| Layer | Tech | Notes |
|-------|------|-------|
| Orchestrator runtime | Fastify plugin/module | Same runtime boundary as State API |
| Intent classifier | Haiku (primary), Sonnet (fallback) | Claude API, BAA required |
| Red-flag detector | Deterministic regex/keyword | No LLM in the path |
| Agent graph executor | TypeScript state machine | XState or hand-rolled |
| Context loader | Calls `StateProjectionAPI.getSlice` | Typed per intent class |
| Safety gate | YAML rules engine | Versioned, audited |
| Brand filter | Deterministic + Claude call | Inline for critical paths |
| Tracing | CloudWatch + OpenSearch | Linked to event ledger |
| Secrets & BAAs | AWS Secrets Manager | Rotate quarterly |

### 14.1 Build Order

1. Intent schema + classifier skeleton (mock LLM)
2. Routing table + plan builder (pure function, fully unit-tested)
3. Agent I/O contract + a no-op "echo" agent
4. Executor (sequence first, then parallel, then conditional)
5. Safety gate (start with 10 critical rules)
6. Brand Filter (deterministic layer first)
7. Tracing + audit event writer
8. Real agents plugged in one at a time
9. Jeffrey wiring last

---

## 15. OUTCOME

When this ships:

- **Every response is traceable.** Open any interaction in CloudWatch, see the intent, the graph, the agents, the gates.
- **Safety is structural.** A junior engineer cannot accidentally ship a path that bypasses the Safety Gate.
- **Brand is enforced at runtime.** The Brand Filter is a compiler for tone.
- **Agents are swappable.** Upgrade the Data Agent. Replace a model. Nothing else breaks.
- **Latency is owned.** Voice works. App works. Batch jobs don't starve interactive traffic.

That is the bar. Below it, Aissisted feels like every other AI app.

---

## 16. OWNERSHIP

This spec is the contract between the brand and the engine. Once ratified, no feature reaches a user without passing through it.

If an agent can't fit this contract, the agent is wrong — not the contract.

---

## 17. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify routing table v1.0 with Product + Engineering | Ron | Yes |
| 2 | Stand up orchestrator skeleton inside the Fastify runtime | Engineering | Yes |
| 3 | Implement intent classifier (Haiku) + red-flag detector | Engineering | Yes |
| 4 | Author first 10 safety rules with clinical review | Product + Clinical | Yes |
| 5 | Implement deterministic Brand Filter layer | Engineering | Yes |
| 6 | Draft Brand Filter full spec (LLM-scored layer, auto-revision) | Ron + Claude | Next |
| 7 | Draft Agent specs (Product, Brand, Data, Engineering, Growth) | Ron + Claude | Next-2 |
| 8 | Load test — 500 concurrent voice sessions, measure p95 | Engineering | Before launch |

### Immediate (next 72 hours)

1. **Approve the routing table.** Every future decision about who handles what routes through this table.
2. **Lock the intent taxonomy.** Adding classes later is fine. Renaming or removing is costly.
3. **Decide on the clinical review partner.** The safety rules require a licensed clinician to sign off before they go live.

---

## 18. OPEN QUESTIONS

1. **Clinician-in-the-loop threshold** — what confidence level triggers human review vs. automated response? This is a product + legal call.
2. **Offline/degraded mode** — when the orchestrator can't reach the LLM provider, what does Jeffrey say? What does the app show?
3. **Multi-intent utterances** — "I feel tired and also can I see my labs?" — do we split or ask? Recommend: classify primary, queue secondary.
4. **Agent cost accounting** — per-user per-day LLM spend cap? Required to prevent runaway costs on power users.
5. **Model provider strategy** — Anthropic primary, OpenAI fallback? Or dual-run for critical paths? Affects BAA count and latency budget.

---

*End of spec. v1.0. — Ready for engineering review.*
