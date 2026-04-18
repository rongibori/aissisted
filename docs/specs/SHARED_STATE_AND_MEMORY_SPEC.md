# AISSISTED — SHARED STATE & MEMORY LAYER SPEC

**Version:** v1.1 (Execution-aligned)
**Owner:** Engineering + Product
**Status:** Production-grade specification, ready for engineering handoff and aligned to the current Fastify/Postgres stack
**Depends on:** None. This is the foundation.
**Blocks:** Orchestrator routing, all agent behavior, Jeffrey voice layer, personalization engine

---

## 0. OPERATING LINE

> *"We don't provide answers. We build systems that produce them."*

This spec defines the **single source of truth** for every user in the Aissisted system. Every agent, every recommendation, every interaction reads and writes against this layer. Without it, personalization is theater.

---

## 1. TENSION

Aissisted promises: *"The formula is alive. The system is learning. The experience is yours."*

That promise is unkeepable without persistent, structured, versioned user state. Today, most AI products start each conversation from zero. Aissisted cannot. Every interaction must **compound**.

## 2. TRUTH

The moat is not the AI model. The moat is the **accumulated, structured understanding of one individual over time** — and the system's ability to reason against it.

Three failure modes this spec prevents:
1. **Amnesia** — the system forgets who the user is between sessions
2. **Incoherence** — different agents see different versions of the user
3. **Drift** — recommendations lose traceability to the data that produced them

## 3. SHIFT

Treat user state as a **versioned, append-only ledger** — not a mutable database row. Every biomarker reading, every decision, every recommendation is a stamped event. The current state is a projection of that history.

This gives Aissisted:
- **Traceability** — every recommendation traces to source data
- **Explainability** — "why did the system suggest this?" is always answerable
- **Adaptation** — the system can see trajectory, not just snapshots
- **Auditability** — required for HIPAA, clinical credibility, and trust

---

## 4. SYSTEM — ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                          │
│   MyChart (FHIR) · WHOOP · Oura · Apple Health · Manual    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 NORMALIZATION LAYER                         │
│      (units, timezones, canonical identifiers, dedup)       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENT LEDGER                             │
│    Append-only. Immutable. Source of truth for everything.  │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │   HOT    │   │   WARM   │   │   COLD   │
    │  MEMORY  │   │  MEMORY  │   │  MEMORY  │
    │ (Redis)  │   │(Postgres)│   │ (Vector) │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         └──────────────┼──────────────┘
                        ▼
         ┌──────────────────────────────┐
         │    STATE PROJECTION API      │
         │    (typed, versioned read)   │
         └──────────────┬───────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
   ORCHESTRATOR    AGENTS (×5)       JEFFREY
```

**Three memory tiers, one event ledger, one projection API.**

### 4.1 Current Implementation Target

This spec is intended to map directly onto the current Aissisted execution path:
- **API framework:** Fastify remains the runtime boundary for projection reads and validated writes
- **Primary database:** PostgreSQL via Drizzle ORM
- **Hot memory:** Redis for active voice/app sessions and short-lived working state
- **Cold recall:** pgvector in Postgres first; external vector infra only if scale forces it
- **Infrastructure target:** AWS, with HIPAA-grade controls and auditability from day one

---

## 5. THE SHARED STATE SCHEMA

### 5.1 Design Principles

1. **TypeScript-first.** All schemas authored as TS types, validated with Zod, and persisted through Postgres tables plus JSONB projections where appropriate.
2. **Versioned.** Every schema change increments a `schemaVersion` field. Migrations are explicit.
3. **Namespaced.** Each domain owns its slice (`profile.*`, `biometrics.*`, `protocol.*`, `memory.*`).
4. **Temporal.** Every value carries `observedAt`, `ingestedAt`, `source`, `confidence`.
5. **Traceable.** Every derived value carries `derivedFrom: EventId[]`.

### 5.2 Top-Level Structure

```typescript
// /packages/core/state/UserState.ts

export interface UserState {
  schemaVersion: "1.0.0";
  userId: UserId;                 // UUID v7, time-sortable
  createdAt: ISO8601;
  updatedAt: ISO8601;

  profile:     ProfileState;      // identity, demographics, goals
  biometrics:  BiometricState;    // labs, wearables, vitals
  lifestyle:   LifestyleState;    // sleep, stress, nutrition, movement
  protocol:    ProtocolState;     // current & historical formulations
  memory:      MemoryState;       // episodic, semantic, preference
  consent:     ConsentState;      // data sharing, integrations, HIPAA
  provenance:  ProvenanceState;   // source tracking for every field
}
```

### 5.3 Profile State

```typescript
export interface ProfileState {
  identity: {
    firstName: string;
    preferredName?: string;       // what Jeffrey calls them
    dateOfBirth: ISO8601Date;
    biologicalSex: "male" | "female" | "intersex";
    genderIdentity?: string;
    timezone: IANATimezone;
    locale: string;
  };
  goals: Goal[];                  // max 3 active, ranked
  archetype?: Archetype;          // "high-performer" | "seeker" | "optimizer" | "believer" | "exhausted"
  onboardedAt: ISO8601;
  engagementTier: "new" | "engaged" | "power" | "dormant";
}

export interface Goal {
  id: GoalId;
  statement: string;              // user's own words, preserved verbatim
  category: GoalCategory;         // "energy" | "sleep" | "clarity" | "longevity" | ...
  priority: 1 | 2 | 3;
  createdAt: ISO8601;
  lastAffirmedAt: ISO8601;        // user confirmed still relevant
  status: "active" | "achieved" | "paused" | "retired";
}
```

### 5.4 Biometric State

```typescript
export interface BiometricState {
  labs: {
    latest: Record<BiomarkerCode, BiomarkerReading>;
    history: BiomarkerReading[];   // full append-only series
    lastSyncedAt: ISO8601 | null;
  };
  wearables: {
    whoop?:   WearableSnapshot;
    oura?:    WearableSnapshot;
    apple?:   WearableSnapshot;
    lastSyncedAt: ISO8601 | null;
  };
  vitals: {
    heightCm?: number;
    weightKg?: number;
    restingHR?: number;
    // ... expandable
  };
}

export interface BiomarkerReading {
  eventId: EventId;                // pointer to event ledger
  code: BiomarkerCode;             // LOINC where possible
  value: number;
  unit: string;                    // canonical SI unit
  referenceRange?: { low: number; high: number };
  observedAt: ISO8601;
  source: DataSource;              // "mychart" | "quest" | "manual" | ...
  confidence: 0 | 1 | 2 | 3;       // 3 = lab-verified, 0 = user-reported
}

export interface WearableSnapshot {
  deviceId: string;
  lastReading: ISO8601;
  metrics: {
    sleepScore?:     TimeSeries<number>;
    hrv?:            TimeSeries<number>;
    recovery?:       TimeSeries<number>;
    strain?:         TimeSeries<number>;
    readiness?:      TimeSeries<number>;
    // ... device-specific
  };
}
```

### 5.5 Lifestyle State

```typescript
export interface LifestyleState {
  sleep:       { averageHours7d: number; qualityTrend: Trend; };
  stress:      { selfReported7d: number; hrvProxy7d: number; };
  nutrition:   { pattern?: NutritionPattern; restrictions: string[]; };
  movement:    { weeklyMinutes: number; type: MovementType[]; };
  substances:  { caffeine?: DailyPattern; alcohol?: WeeklyPattern; };
  // All fields derived from events + user input, never free-text
}
```

### 5.6 Protocol State

```typescript
export interface ProtocolState {
  current: Protocol | null;
  history: Protocol[];
}

export interface Protocol {
  id: ProtocolId;
  version: number;                 // increments on every adjustment
  activeFrom: ISO8601;
  activeTo: ISO8601 | null;        // null = currently active
  ingredients: Ingredient[];
  rationale: ProtocolRationale;    // WHY this formula, for this person, now
  adaptationReason?: string;       // what triggered the change
}

export interface ProtocolRationale {
  drivingBiomarkers: BiomarkerCode[];
  drivingGoals: GoalId[];
  drivingSignals: string[];        // e.g. "7d sleep decline", "elevated CRP"
  generatedBy: AgentName;
  generatedAt: ISO8601;
  evidenceRefs: EvidenceRef[];     // citations for explainability
  derivedFrom: EventId[];          // full provenance chain
}
```

### 5.7 Memory State

**This is the heart of the system.** Three memory types, modeled after human cognition.

```typescript
export interface MemoryState {
  episodic:   EpisodicMemory[];    // discrete events & interactions
  semantic:   SemanticMemory;      // stable facts about the user
  preference: PreferenceMemory;    // how they like to be communicated with
  working:    WorkingMemory;       // current session context
}

export interface EpisodicMemory {
  id: MemoryId;
  type: "interaction" | "reflection" | "milestone" | "adjustment";
  summary: string;                 // one line, human-readable
  detail: string;                  // full context
  salience: 1 | 2 | 3 | 4 | 5;     // how important to remember
  embedding: VectorRef;            // pointer to vector store
  occurredAt: ISO8601;
  relatedEventIds: EventId[];
}

export interface SemanticMemory {
  traits: Record<string, TraitAssertion>;   // "sensitive to caffeine"
  conditions: ConditionAssertion[];         // diagnosed or self-reported
  history: HistoryAssertion[];              // past interventions that worked/didn't
}

export interface PreferenceMemory {
  communication: {
    tone: "minimal" | "supportive" | "directive";
    detailLevel: "brief" | "balanced" | "scientific";
    checkInCadence: "daily" | "weekly" | "monthly";
    preferredChannel: "voice" | "app" | "email";
  };
  interaction: {
    preferredTimeOfDay?: TimeOfDay;
    questionsWelcome: boolean;
  };
}

export interface WorkingMemory {
  // Ephemeral — cleared after session timeout
  sessionId: SessionId;
  currentIntent?: string;
  pendingQuestions: string[];
  recentTurns: ConversationTurn[];
  expiresAt: ISO8601;
}
```

### 5.8 Consent & Provenance

```typescript
export interface ConsentState {
  hipaaAuthorization: ConsentRecord;
  integrations: Record<IntegrationName, ConsentRecord>;
  dataSharing: {
    researchOptIn: boolean;
    marketingOptIn: boolean;
  };
}

export interface ConsentRecord {
  granted: boolean;
  grantedAt: ISO8601 | null;
  revokedAt: ISO8601 | null;
  scope: string[];
  documentVersion: string;         // which ToS/BAA they agreed to
}

export interface ProvenanceState {
  // Every field in UserState has a corresponding provenance entry
  // keyed by JSONPath. Example: "$.biometrics.labs.latest.LDL.value"
  [jsonPath: string]: {
    sourceEventId: EventId;
    writtenBy: AgentName | "system" | "user";
    writtenAt: ISO8601;
  };
}
```

---

## 6. THE EVENT LEDGER

### 6.1 Why an Event Ledger?

A mutable state row tells you *what is true now*. An event ledger tells you *everything that was ever observed*, in order. For a system that must adapt, trace, and audit — mutable-only fails. Always.

### 6.2 Event Schema

```typescript
export interface Event<T = unknown> {
  eventId: EventId;              // UUID v7 (time-sortable)
  userId: UserId;
  type: EventType;               // discriminator
  payload: T;                    // typed per eventType
  source: DataSource;
  observedAt: ISO8601;           // when it happened in the real world
  ingestedAt: ISO8601;           // when we received it
  idempotencyKey: string;        // dedup identical ingestions
  schemaVersion: string;
}

export type EventType =
  | "biomarker.observed"
  | "wearable.snapshot.recorded"
  | "protocol.generated"
  | "protocol.adjusted"
  | "protocol.consumed"
  | "interaction.completed"
  | "reflection.submitted"
  | "consent.granted"
  | "consent.revoked"
  | "goal.set"
  | "goal.updated"
  | "agent.decision.made";       // for auditability
```

### 6.3 Storage

- **Primary store:** Postgres, partitioned by `userId`, indexed on `(userId, observedAt)`.
- **Retention:** Forever. These events are the legal record.
- **Write path:** Only the ingestion service and orchestrator can write.
- **Read path:** Everything reads through the **State Projection API**, never raw events.

---

## 7. THE MEMORY LAYER — THREE TIERS

| Tier | Latency | Store | TTL | Purpose |
|------|---------|-------|-----|---------|
| **Hot** | < 10ms | Redis | Session (≤24h) | Working memory, conversation turns, active intent |
| **Warm** | < 100ms | Postgres (JSONB) | Forever | Projected UserState, recent episodic, preferences |
| **Cold** | < 500ms | Vector DB (Pinecone or pgvector) | Forever | Embedded episodic memory, semantic search |

### 7.1 Hot Memory (Redis)

- **What:** Current session working memory, pending intents, rate-limit counters
- **Keyed as:** `session:{userId}:{sessionId}`
- **Why Redis:** Sub-10ms for voice interactions (Jeffrey cannot pause to think)
- **Cleared:** On session end or 24h timeout

### 7.2 Warm Memory (Postgres JSONB)

- **What:** The latest projection of `UserState`, plus recent episodic entries (last 90 days)
- **Keyed as:** `user_state.{userId}` (one row per user)
- **Why Postgres:** Transactional integrity, relational queries, JSONB flexibility, row-level security for HIPAA
- **Rebuilt:** From event ledger on schema migration or data repair

### 7.3 Cold Memory (Vector DB)

- **What:** Embedded episodic memories, reflections, interaction summaries
- **Keyed as:** `{userId}:{memoryId}`
- **Why vector:** Semantic retrieval — "when did the user last mention brain fog?"
- **Indexed by:** embedding + metadata (`type`, `salience`, `occurredAt`, `userId`)
- **Recommended:** pgvector inside the same Postgres cluster (fewer moving parts until scale forces otherwise)

### 7.4 Memory Decay Model

```
Salience 5 (milestones)           → never decayed
Salience 4 (meaningful events)    → never decayed
Salience 3 (standard interactions)→ retained full for 90d, summarized after
Salience 2 (low-importance)       → retained 30d, summarized after
Salience 1 (trivial)              → retained 7d, discarded after
```

Summarization is triggered by a background job, never inline.

---

## 8. THE STATE PROJECTION API

### 8.1 Contract

**Every agent reads through this API. No agent touches raw events or raw DB rows.**

```typescript
// /packages/core/state/StateProjection.ts

export interface StateProjectionAPI {
  // Read the current projected state (warm memory)
  getState(userId: UserId): Promise<UserState>;

  // Read a sliced view (for token efficiency in agent prompts)
  getSlice<K extends keyof UserState>(
    userId: UserId,
    keys: K[]
  ): Promise<Pick<UserState, K>>;

  // Semantic memory search (cold memory)
  searchMemory(
    userId: UserId,
    query: string,
    filters?: MemoryFilter
  ): Promise<EpisodicMemory[]>;

  // Get a state snapshot at a specific moment in time (from event ledger)
  getStateAt(userId: UserId, timestamp: ISO8601): Promise<UserState>;

  // Append an event (only allowed path for writes)
  appendEvent<T>(event: Event<T>): Promise<EventId>;

  // Session working memory
  getSession(sessionId: SessionId): Promise<WorkingMemory>;
  updateSession(sessionId: SessionId, patch: Partial<WorkingMemory>): Promise<void>;
}
```

### 8.2 Agent Access Patterns

```typescript
// Orchestrator at the start of a request:
const slice = await state.getSlice(userId, [
  "profile",
  "memory",
  "biometrics",      // only if intent requires
]);

// Jeffrey retrieving context for voice turn:
const working = await state.getSession(sessionId);
const relevant = await state.searchMemory(userId, userUtterance, { topK: 5 });

// Protocol engine generating a formula:
const full = await state.getState(userId);
const protocol = await generate(full);
await state.appendEvent({
  type: "protocol.generated",
  payload: { protocol, rationale: protocol.rationale },
  // ...
});
```

**Rule:** Every agent receives only the slice it needs. Nothing more. Token economy + security blast radius.

### 8.3 Projection Lifecycle

1. **Append event** to the ledger as the only write primitive.
2. **Project current state** into warm memory immediately after validation.
3. **Patch hot session memory** only if an active session exists.
4. **Embed salient episodes asynchronously** into cold memory.
5. **Mark dirty + replay** from the ledger if projection fails or schemas change.

This keeps the system deterministic: if the projection is ever questioned, it can be rebuilt from history without guesswork.

---

## 9. WRITE DISCIPLINE

### 9.1 Who Can Write What

| Writer | Allowed Events |
|--------|----------------|
| Ingestion service | `biomarker.observed`, `wearable.snapshot.recorded` |
| User (via app) | `goal.set`, `reflection.submitted`, `consent.*` |
| Data Agent | `biomarker.interpreted` (derived) |
| Product Agent | `interaction.completed` |
| Protocol Engine | `protocol.generated`, `protocol.adjusted` |
| Orchestrator | `agent.decision.made` |

### 9.2 Rules

1. **No agent mutates state directly.** Agents propose events; the ingestion gateway validates and appends.
2. **Every event passes the Brand Filter before surfacing to the user.** Filter failures are logged but do not block ledger writes.
3. **Rollback = new event, not deletion.** An event is the historical truth that it was once believed. Corrections are `*.retracted` events.
4. **Idempotency is mandatory.** Every writer provides an `idempotencyKey`. Duplicate ingestion is a no-op.

---

## 10. SAFETY, COMPLIANCE, EXPLAINABILITY

Aissisted touches PHI. Treat this spec as HIPAA-bound from day one.

### 10.1 Baseline Requirements

- **Encryption at rest** (AES-256) and **in transit** (TLS 1.3). Mandatory.
- **Row-level security** in Postgres keyed on `userId`. No cross-tenant queries possible at the DB layer.
- **Audit log** of every read of PHI — who, what, when, why.
- **BAAs** with every vendor touching state, including the model provider, cloud host, and any vector or cache infrastructure.
- **Data residency** configurable per-user. Default US.
- **User-initiated export & deletion** — GDPR- and HIPAA-compliant. Deletion cascades to vector store and backups within 30 days.

### 10.2 Explainability Contract

**Every protocol, recommendation, or nudge must be queryable as:**

> "Why did Aissisted recommend this?"

The system must return:
1. Driving biomarkers + their values
2. Driving goals
3. Driving lifestyle signals
4. Evidence references
5. Confidence score
6. Data freshness (how old is each input)

This is not optional. It is the difference between Aissisted and every other supplement company.

### 10.3 Do-Not-Harm Gate

A separate safety layer (not covered in this spec, but required adjacent) runs before any recommendation reaches the user:
- No drug-supplement interactions left unchecked
- No dosing outside established ranges
- No recommendations contradicted by recent labs
- Red flags (abnormal labs, crisis signals) escalate out of the AI flow, not through it

---

## 11. OUTCOME

When this is built:

- **Every agent sees one user, consistently.** No more incoherence.
- **Every recommendation is traceable to its source data.** No more black-box personalization.
- **The system compounds.** Each interaction makes the next one smarter.
- **Compliance is structural, not bolted on.** Audits become reports, not scrambles.
- **Jeffrey can speak with memory.** "Last week you mentioned sleep was better — are we still on the right track?"

That is the minimum bar. Anything less breaks the brand promise.

---

## 12. OWNERSHIP

This spec is not an engineering artifact. It is the **definition of what it means to be a user of Aissisted**. Every product decision from this point forward answers to it.

If a feature cannot be expressed as a read or write against this schema, the feature is outside the system.

---

## 13. NEXT STEPS (EXECUTION)

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify schema v1.1 with Engineering + Product | Ron | Yes |
| 2 | Stand up Postgres + Redis + pgvector on AWS (HIPAA-eligible) | Engineering | Yes |
| 3 | Implement `StateProjectionAPI` as a typed shared service exposed through Fastify-compatible modules/plugins | Engineering | Yes |
| 4 | Build event ingestion gateway + idempotency | Engineering | Yes |
| 5 | Migrate existing user data (if any) to event-sourced model | Engineering | — |
| 6 | Ratify Orchestrator routing spec against state-slice contracts and event shapes | Ron + Engineering | Next |
| 7 | Sign BAAs with every vendor touching state | Legal | Yes before launch |
| 8 | Ratify Brand Filter runtime gate against projection and audit requirements | Ron + Engineering | Next-2 |

### Immediate (next 72 hours)

1. **Approve schema v1.1** or redline it. Nothing else ships until this is frozen.
2. **Lock the store stack.** Recommendation: **AWS-hosted PostgreSQL + pgvector + Redis**, with Drizzle and application-level validation already aligned to the current codebase.
3. **Decide on BAA sequencing.** You cannot ingest real PHI until BAAs are signed. Engineering can build against synthetic data in parallel.

---

## 14. OPEN QUESTIONS (FLAGGED FOR DECISION)

1. **Lab source of truth** — MyChart/FHIR via SMART only, or also direct-to-consumer (Quest, Labcorp, Everlywell)? Affects `DataSource` enum and ingestion priority.
2. **Genomic data** — in scope for v1, or deferred? Major schema implication.
3. **Multi-user households** — ever? Affects `userId` ownership model.
4. **On-device memory** — any local state on iOS/Web, or server-only? Affects Jeffrey latency strategy.
5. **Retention after account closure** — delete immediately, or hold per HIPAA 6-year rule? Legal call.

---

*End of spec. v1.1. — Ready for engineering review.*
