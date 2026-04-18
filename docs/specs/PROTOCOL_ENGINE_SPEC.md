# AISSISTED — PROTOCOL ENGINE SPEC

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Product + Engineering + Clinical
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.1, `AGENT_DATA_SPEC.md` v1.1, `AGENT_PRODUCT_SPEC.md` v1.1, `AGENT_ENGINEERING_SPEC.md` v1.1
**Blocks:** First protocol generation, protocol adjustment pipeline, manufacturing handoff, Jeffrey protocol explanation, explainability UX
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS

---

## 0. OPERATING LINE

> *"We learn your body. Then we build what it needs."*

The Protocol Engine is the IP. Everything else — agents, orchestrator, memory, brand — exists to feed this system and deliver its output. This is where personalization stops being a promise and becomes a formula.

---

## 1. TENSION

The supplement industry runs on two models: static (everyone gets the same thing) and quiz-based (a 10-question survey picks from 8 pre-built SKUs). Neither learns. Neither adapts. Neither can explain why.

Aissisted rejects both.

The promise is a formula that is **generated for one person, from their actual biology, and evolves as they do**. That promise lives or dies in this engine.

## 2. TRUTH

A protocol is not a list of ingredients. A protocol is a **decision chain** that connects:

1. What the body is showing (biomarkers, wearables, lifestyle)
2. What the person wants (goals)
3. What the evidence supports (clinical literature)
4. What is safe (interaction checks, dosing limits)
5. What has worked or not worked before (longitudinal memory)

Into one output: a versioned, explainable, manufacturable formula.

Every link in that chain must be traceable. Break any link, and the formula becomes a guess wearing the costume of science.

## 3. SHIFT

Treat the Protocol Engine as a **three-stage pipeline**:

1. **Deterministic rules** — reference ranges, interaction databases, dosing ceilings, contraindications. These are non-negotiable guardrails. They run first.
2. **AI reasoning** — given what the rules allow, select the optimal ingredient set and dosing for this individual, this moment, these goals. This is where Claude reasons.
3. **Validation** — the proposed protocol is checked against the Safety Gate, verified by the Engineering Agent for manufacturability, and its rationale is structured for explainability.

The rules never yield to the AI. The AI reasons within the space the rules permit.

---

## 4. SYSTEM — ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────────┐
│                     INPUTS                                    │
│                                                              │
│  DataAgentOutput        UserState.profile.goals              │
│  (health signals,       (ranked, active)                     │
│   confidence scores,                                          │
│   anomalies, trends)    UserState.protocol.history            │
│                         (what worked, what didn't)            │
│                                                              │
│  UserState.memory.semantic                                    │
│  (traits, conditions, history assertions)                     │
│                                                              │
│  UserState.lifestyle                                          │
│  (sleep, stress, movement, substances)                       │
└────────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│              STAGE 1 — DETERMINISTIC RULES                   │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  1.1  Contraindication check                 │            │
│  │  1.2  Drug-supplement interaction screen     │            │
│  │  1.3  Supplement-supplement interaction screen│            │
│  │  1.4  Dosing ceiling enforcement             │            │
│  │  1.5  Allergen / restriction filter          │            │
│  │  1.6  Candidate ingredient pool generation   │            │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  Output: SafeIngredientPool + constraints                    │
└────────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│              STAGE 2 — AI REASONING                          │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  2.1  Goal → signal → ingredient mapping     │            │
│  │  2.2  Dose optimization within ceiling       │            │
│  │  2.3  Synergy scoring (compound benefit)     │            │
│  │  2.4  Longitudinal memory weighting          │            │
│  │  2.5  Protocol rationale generation          │            │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  Output: ProposedProtocol + ProtocolRationale                │
└────────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────┐
│              STAGE 3 — VALIDATION                            │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  3.1  Safety Gate (per ORCHESTRATOR spec §10)│            │
│  │  3.2  Engineering Agent (manufacturability,  │            │
│  │       shipping, execution plan)              │            │
│  │  3.3  Explainability check (every ingredient │            │
│  │       has a rationale with derivedFrom[])    │            │
│  │  3.4  Diff against previous protocol version │            │
│  └──────────────────────────────────────────────┘            │
│                                                              │
│  Output: ValidatedProtocol (or blocked with reason)          │
└──────────────────────────────────────────────────────────────┘
```

**Three stages. Rules first. AI second. Validation third. No shortcuts.**

---

## 5. THE INGREDIENT MODEL

### 5.1 Ingredient Registry

Every ingredient Aissisted can formulate lives in a versioned, clinically-reviewed registry.

```typescript
// packages/types/protocol/Ingredient.ts

export interface IngredientEntry {
  id: IngredientId;
  name: string;                             // "Magnesium Glycinate"
  category: IngredientCategory;
  forms: IngredientForm[];                  // glycinate, citrate, oxide, etc.
  preferredForm: IngredientForm;
  dosing: DosingProfile;
  interactions: InteractionProfile;
  evidence: EvidenceProfile;
  contraindications: Contraindication[];
  allergenFlags: string[];
  manufacturingConstraints: ManufacturingConstraint;
  status: "active" | "under_review" | "deprecated";
  lastReviewedAt: ISO8601;
  reviewedBy: ClinicalReviewerId;
}

export interface DosingProfile {
  unit: string;                             // "mg", "mcg", "IU"
  minimumEffectiveDose: number;
  optimalRangeLow: number;
  optimalRangeHigh: number;
  absoluteCeiling: number;                  // never exceed, regardless of AI reasoning
  timingPreference: "morning" | "evening" | "with_food" | "empty_stomach" | "split" | "flexible";
  loadingDoseSupported: boolean;
  loadingDoseMax?: number;
  loadingDurationDays?: number;
}

export interface InteractionProfile {
  drugInteractions: DrugInteraction[];
  supplementInteractions: SupplementInteraction[];
  conditionContraindications: ConditionContraindication[];
}

export interface DrugInteraction {
  drugClass: string;                        // "SSRIs", "Blood thinners", "Statins"
  drugNames: string[];
  severity: "minor" | "moderate" | "major" | "contraindicated";
  mechanism: string;
  action: "reduce_dose" | "monitor" | "avoid" | "contraindicated";
  evidenceLevel: "strong" | "moderate" | "theoretical";
}

export interface EvidenceProfile {
  primaryIndications: Indication[];
  evidenceLevel: "strong" | "moderate" | "emerging" | "traditional";
  keyStudies: StudyRef[];                   // for explainability
  mechanismOfAction: string;                // one sentence, plain language
}

export type IngredientCategory =
  | "vitamin"
  | "mineral"
  | "amino_acid"
  | "adaptogen"
  | "probiotic"
  | "enzyme"
  | "fatty_acid"
  | "botanical"
  | "peptide"
  | "other";
```

### 5.2 Registry Storage & Governance

- **Storage:** PostgreSQL table (`ingredients`), versioned rows
- **Schema:** Drizzle model in `packages/db/schema/ingredients.ts`
- **Updates:** Every ingredient change requires clinical review sign-off
- **Versioning:** Each ingredient carries a `registryVersion` — the protocol records which version was used at generation time
- **Cadence:** Full registry review quarterly, interaction databases synced monthly

### 5.3 The Candidate Pool

Stage 1 produces a **safe candidate pool** — the subset of all active ingredients that are:
1. Not contraindicated for this user
2. Not interacting with their known medications
3. Not restricted by their allergens/dietary constraints
4. Not interacting dangerously with each other in the proposed set

The AI (Stage 2) selects from this pool only. It cannot add ingredients that Stage 1 excluded.

---

## 6. STAGE 1 — DETERMINISTIC RULES ENGINE

### 6.1 Implementation

```typescript
// packages/domain/protocol/RulesEngine.ts

export interface RulesEngineInput {
  healthSignals: DataSignal[];
  userProfile: Pick<UserState, "profile" | "lifestyle" | "memory">;
  currentMedications: Medication[];         // from memory.semantic.conditions + manual input
  allergensAndRestrictions: string[];
  previousProtocol: Protocol | null;
}

export interface RulesEngineOutput {
  candidatePool: CandidateIngredient[];
  excludedIngredients: ExcludedIngredient[];
  dosingCeilings: Record<IngredientId, number>;
  interactionWarnings: InteractionWarning[];
  hardConstraints: HardConstraint[];
}

export interface CandidateIngredient {
  ingredient: IngredientEntry;
  relevanceScore: number;                   // 0–1, deterministic scoring based on signal match
  primarySignals: DataSignal[];             // which health signals make this relevant
  dosingRange: { min: number; max: number }; // safe range for this specific user
  form: IngredientForm;                     // preferred form, adjusted for interactions
}

export interface ExcludedIngredient {
  ingredientId: IngredientId;
  reason: ExclusionReason;
  evidence: string;
  overrideable: boolean;                    // only by clinician, never by AI
}

export type ExclusionReason =
  | "drug_interaction_major"
  | "drug_interaction_contraindicated"
  | "condition_contraindication"
  | "allergen_match"
  | "dietary_restriction"
  | "supplement_interaction_in_pool"
  | "user_reported_adverse_reaction";
```

### 6.2 Rule Execution Order

1. **Load ingredient registry** (cached, hot-reloaded on version change)
2. **Screen medications** — check every active ingredient against user's medication list
3. **Screen conditions** — check against diagnosed/self-reported conditions
4. **Screen allergens** — check against user's allergen + dietary restriction list
5. **Generate initial candidate pool** — all non-excluded ingredients
6. **Screen supplement-supplement interactions** — within the candidate pool itself
7. **Compute per-ingredient dosing ceilings** — based on interactions, body weight (if available), age, biological sex
8. **Score relevance** — deterministic mapping of health signals to ingredient indications
9. **Rank candidates** by relevance score

### 6.3 Rule Registry

```yaml
# packages/config/protocol/interaction_rules.v1.yaml
# Example entries:

drug_interactions:
  - ingredient: "st_johns_wort"
    drug_class: "SSRIs"
    severity: "contraindicated"
    action: "exclude"
    mechanism: "Serotonin syndrome risk via CYP3A4 induction"
    evidence_level: "strong"

  - ingredient: "vitamin_k"
    drug_class: "anticoagulants"
    severity: "major"
    action: "exclude"
    mechanism: "Antagonizes warfarin/coumadin anticoagulant effect"
    evidence_level: "strong"

  - ingredient: "magnesium"
    drug_class: "antibiotics_tetracycline"
    severity: "moderate"
    action: "timing_separation"
    mechanism: "Chelation reduces absorption"
    note: "Separate by 2 hours"
    evidence_level: "strong"

dosing_ceilings:
  vitamin_d:
    default: 5000         # IU
    with_hypercalcemia: 0 # contraindicated
    age_over_70: 4000

  magnesium_glycinate:
    default: 400          # mg elemental
    with_renal_impairment: 200
```

### 6.4 The Safety Non-Negotiable

**No ingredient excluded by Stage 1 can be included by Stage 2.** The AI reasons within the safe space. It does not negotiate with guardrails.

If the AI proposes an ingredient not in the candidate pool, the protocol fails validation at Stage 3 and the engine restarts with a logged error. This should never happen in production (the prompt is constrained), but the guard exists.

---

## 7. STAGE 2 — AI REASONING

### 7.1 What the AI Does

Given:
- A safe candidate pool with relevance scores and dosing ranges
- The user's ranked goals
- The user's health signals with confidence and trend direction
- The user's longitudinal memory (what worked, what didn't, how long on current protocol)
- The previous protocol (if any)

The AI:
1. **Selects ingredients** from the candidate pool that best serve the user's goals, weighted by signal strength and confidence
2. **Sets doses** within the allowed range, optimizing for efficacy within safety bounds
3. **Scores synergies** — ingredient combinations that compound benefit (e.g. Vitamin D + K2 for calcium metabolism)
4. **Weights memory** — ingredients that previously correlated with positive outcomes get a boost; those correlated with adverse reactions or no improvement get penalized
5. **Generates rationale** — a structured chain linking every ingredient to the signals, goals, and evidence that justified its inclusion

### 7.2 System Prompt

```
You are the Protocol Reasoning Engine for Aissisted.

You select supplement ingredients and doses for ONE SPECIFIC INDIVIDUAL
based on their biology, goals, and history.

INPUTS YOU RECEIVE:
- A SAFE CANDIDATE POOL of ingredients (pre-screened for interactions, contraindications, allergens). You may ONLY select from this pool.
- Health signals with confidence scores and trend direction
- The user's ranked goals
- Longitudinal memory: what has worked, what hasn't, adverse reactions
- The previous protocol (if any) with its tenure and outcomes

YOUR JOB:
1. SELECT ingredients from the candidate pool (max {maxIngredients})
2. SET a dose for each within the provided safe range
3. ASSIGN timing (morning/evening/with food/split)
4. SCORE synergies between selected ingredients
5. GENERATE a structured rationale for EVERY ingredient

PRINCIPLES:
1. Fewer ingredients at effective doses > many ingredients at token doses
2. Address the highest-priority goal first, then layer
3. Respect confidence: high-confidence signals drive selection; low-confidence signals inform but don't determine
4. Stability bias: if the current protocol is working (positive signals), prefer minor adjustments over wholesale changes
5. Memory matters: a user who previously reported stomach issues with iron should not receive iron without a changed form + explicit rationale
6. Every ingredient must have a reason. "General wellness" is not a reason.

CONSTRAINTS:
- You may ONLY select ingredients present in the candidate pool
- You may NOT exceed the dosing ceiling for any ingredient
- Max {maxIngredients} ingredients per protocol
- If you lack confidence to select, return fewer ingredients with a reasoning note — never pad

RETURN FORMAT:
Return a valid ProposedProtocol JSON object. No prose outside the JSON.
```

### 7.3 Runtime Template

```
USER CONTEXT:
  Name: {preferredName}
  Age: {age}
  Biological Sex: {biologicalSex}
  Active Goals (ranked):
    {goalsJSON}

HEALTH SIGNALS (from Data Agent):
  {healthSignalsJSON}

SAFE CANDIDATE POOL ({candidateCount} ingredients):
  {candidatePoolJSON}

LONGITUDINAL MEMORY:
  Protocol history: {protocolHistoryJSON}
  Known adverse reactions: {adverseReactionsJSON}
  What has worked: {positiveHistoryJSON}
  Current protocol tenure: {tenureDays} days
  Current protocol outcomes: {outcomeSummary}

LIFESTYLE CONTEXT:
  {lifestyleJSON}

PREVIOUS PROTOCOL (if adjusting):
  {previousProtocolJSON}
  Adjustment reason: {adjustmentReason}

Return a ProposedProtocol JSON object.
```

### 7.4 Output Schema

```typescript
// packages/types/protocol/ProposedProtocol.ts

export interface ProposedProtocol {
  ingredients: SelectedIngredient[];
  totalIngredientCount: number;
  generationMode: "initial" | "adjustment" | "rebuild";
  confidenceLevel: 0 | 1 | 2 | 3;
  rationale: ProtocolRationale;
  diffFromPrevious?: ProtocolDiff;
}

export interface SelectedIngredient {
  ingredientId: IngredientId;
  name: string;
  form: IngredientForm;
  dose: number;
  unit: string;
  timing: IngredientTiming;
  rationale: IngredientRationale;
  synergyWith: IngredientId[];              // other ingredients this compounds with
  registryVersion: string;                  // locks the evidence snapshot
}

export interface IngredientRationale {
  primaryGoal: GoalId;                      // which user goal this serves
  drivingSignals: SignalRef[];              // which health signals justified it
  evidenceRefs: StudyRef[];                 // clinical evidence
  mechanismSummary: string;                 // one sentence, plain language
  memoryInfluence?: {
    direction: "boosted" | "penalized" | "neutral";
    reason: string;                         // "previously effective" | "adverse reaction reported"
    memoryEventIds: EventId[];
  };
  confidenceInSelection: 0 | 1 | 2 | 3;
  doseJustification: string;               // why this specific dose, not just "within range"
}

export interface ProtocolDiff {
  added: SelectedIngredient[];
  removed: { ingredientId: IngredientId; reason: string }[];
  doseChanged: { ingredientId: IngredientId; oldDose: number; newDose: number; reason: string }[];
  formChanged: { ingredientId: IngredientId; oldForm: string; newForm: string; reason: string }[];
  unchanged: IngredientId[];
  stabilityScore: number;                   // 0–1, how much changed (0 = identical, 1 = complete rebuild)
}
```

### 7.5 Model Selection

| Mode | Primary | Fallback | Budget |
|------|---------|----------|--------|
| Initial protocol generation | **Sonnet 4.6** | Opus 4.6 | 3000ms / 3000 tok |
| Minor adjustment | Sonnet 4.6 | Opus 4.6 | 2000ms / 2000 tok |
| Major adjustment / rebuild | **Opus 4.6** | — | 5000ms / 4000 tok |

**Rule:** Protocol generation is the highest-stakes decision in the system. This is where model quality matters most. Opus for rebuilds. Sonnet minimum for everything else. Haiku never touches this path.

---

## 8. STAGE 3 — VALIDATION

### 8.1 Validation Checks (Sequential)

1. **Pool integrity** — every selected ingredient exists in the candidate pool from Stage 1. Zero tolerance.
2. **Dosing bounds** — every dose is within the computed ceiling. Zero tolerance.
3. **Rationale completeness** — every ingredient has `primaryGoal`, `drivingSignals[]`, `evidenceRefs[]`, `mechanismSummary`, and `doseJustification`. No blanks.
4. **Provenance chain** — every `drivingSignal` traces to a `DataSignal` from the Data Agent, which traces to an `EventId` in the ledger. Full chain.
5. **Safety Gate** — per `ORCHESTRATOR_ROUTING_SPEC.md` §10. Interaction checks, dose validation, red flags, freshness.
6. **Engineering Agent validation** — per `AGENT_ENGINEERING_SPEC.md`. Manufacturing capacity, shipping, billing, idempotency.
7. **Diff sanity** — if `generationMode: "adjustment"`, the `stabilityScore` is checked:
   - Minor adjustment: stabilityScore must be < 0.3 (at most 30% changed)
   - Major adjustment: stabilityScore can be up to 0.7
   - Rebuild: no limit, but flagged for user confirmation
8. **Explainability audit** — can the system answer "Why did Aissisted recommend this?" for every ingredient? If any ingredient lacks a complete rationale chain, validation fails.

### 8.2 Validation Outcome

```typescript
export interface ProtocolValidation {
  verdict: "approved" | "revision_required" | "blocked";
  protocol: ProposedProtocol;               // echoed
  checks: ValidationCheck[];
  safetyGateResult: SafetyGateResult;
  engineeringValidation: EngineeringValidation;
  explainabilityScore: number;              // 0–1, ratio of fully-traced ingredients
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail?: string;
}
```

### 8.3 Failure Modes

| Failure | Action |
|---------|--------|
| Ingredient not in pool | Hard block. Log critical error. Never retry AI — the prompt is broken. |
| Dose exceeds ceiling | Hard block. Log as safety incident. |
| Missing rationale field | Revision required. Re-run Stage 2 with explicit "complete all rationale fields" directive. One retry. |
| Safety Gate block | Hard block. Escalate per Safety Gate rules. |
| Engineering block | Block with remediation per Engineering Agent spec. |
| Stability score exceeded | Revision required. Downgrade from "minor" to "major" or require user confirmation. |

---

## 9. ADAPTATION — WHEN AND HOW PROTOCOLS EVOLVE

### 9.1 Trigger Types

Protocols evolve. The question is: when, and how much?

| Trigger | Source | Default Action | Stability Expectation |
|---------|--------|---------------|----------------------|
| New lab results ingested | Data Agent | Evaluate for adjustment | Minor unless signal shift is large |
| Wearable trend shift (14d+) | Data Agent | Evaluate for adjustment | Minor |
| User reports adverse reaction | User input | Immediate evaluation | May be major |
| Goal change | Product Agent | Evaluate for adjustment | Minor to major |
| Protocol tenure > 90d | Scheduler | Scheduled review | Confirm or minor adjust |
| New medication reported | User input | Immediate re-screen (Stage 1) | May force removals |
| Significant lifestyle change | User input / wearable | Evaluate | Minor |

### 9.2 Adaptation Philosophy

1. **Stability is a feature.** The default is *hold*. Change requires justification.
2. **Minor adjustments are preferred.** Dose changes > ingredient swaps > additions > removals.
3. **No whiplash.** Minimum 14 days between non-emergency adjustments. The body needs time to respond.
4. **User sees the why.** Every adjustment carries an explanation the Brand Agent can render: "Your HRV improved 12% this month. We've increased magnesium slightly to support that trend."
5. **History doesn't repeat.** If an ingredient was removed for adverse reaction, it doesn't come back without a changed form + explicit rationale.

### 9.3 The 14-Day Cooldown

```typescript
const MINIMUM_ADJUSTMENT_INTERVAL_DAYS = 14;

// Exception conditions:
const COOLDOWN_OVERRIDES = [
  "new_medication_reported",
  "adverse_reaction_reported",
  "critical_lab_value",
  "clinician_override"
];
```

If a non-emergency adjustment is attempted within 14 days of the last, the Product Agent's `hold` verdict takes precedence. The Protocol Engine logs `protocol.adjustment.cooldown_enforced`.

### 9.4 Version Chain

Every protocol is versioned:

```
Protocol v1 (initial) → v2 (30d review, dose adjustment) → v3 (new lab data, ingredient added) → ...
```

The version chain is the longitudinal record. It answers: "How has this person's formula evolved, and why?"

---

## 10. EXPLAINABILITY — THE FULL CHAIN

### 10.1 The Chain

For any ingredient in any protocol, the system can produce:

```
User asks: "Why is magnesium in my formula?"

→ Protocol.ingredients[magnesium].rationale
  → primaryGoal: "energy_stability" (Goal #1)
  → drivingSignals: ["HRV_7d_declining", "sleep_quality_down_14d"]
    → HRV_7d_declining traces to EventId: evt_2026_04_10_whoop_snapshot
    → sleep_quality_down_14d traces to EventId: evt_2026_04_09_oura_snapshot
  → evidenceRefs: [
      { study: "Abbasi et al. 2012", finding: "Mg supplementation improved sleep quality in elderly" },
      { study: "Held et al. 2002", finding: "Mg glycinate demonstrated superior bioavailability" }
    ]
  → mechanismSummary: "Magnesium supports GABA receptor activity and parasympathetic tone, both linked to sleep quality and HRV stability."
  → doseJustification: "320mg chosen: above minimum effective dose (200mg), below your ceiling (400mg), aligned with evidence for sleep outcomes."
  → memoryInfluence: {
      direction: "boosted",
      reason: "Mg was in your previous protocol (v2) and correlated with your sleep improvement in March"
    }
```

### 10.2 Depth Levels

Progressive disclosure (aligned with Product Agent spec §8.2):

- **Depth 1 (headline):** "Magnesium supports your sleep and recovery."
- **Depth 2 (rationale):** "Your HRV has been dipping and sleep quality dropped this month. Magnesium supports both — and it worked well for you last time."
- **Depth 3 (science):** Full mechanism + study references + dose justification.

Brand Agent renders each depth. The Protocol Engine provides all three levels in the rationale structure.

---

## 11. MANUFACTURING HANDOFF

### 11.1 The Handoff Object

When a protocol is approved, it produces a manufacturing specification:

```typescript
export interface ManufacturingSpec {
  protocolId: ProtocolId;
  protocolVersion: number;
  userId: UserId;
  ingredients: ManufacturingIngredient[];
  formFactor: "capsule" | "powder" | "liquid";   // v1: single form factor
  servingSize: number;
  servingsPerUnit: number;
  labelCopy: LabelSpec;
  shippingPriority: "standard" | "expedited";
  idempotencyKey: string;
}

export interface ManufacturingIngredient {
  ingredientId: IngredientId;
  name: string;
  form: IngredientForm;
  dosePerServing: number;
  unit: string;
  rawMaterialCode?: string;                  // maps to manufacturing inventory
}

export interface LabelSpec {
  userName: string;                          // personalized label
  protocolVersion: number;
  generatedAt: ISO8601;
  supplementFacts: SupplementFactsPanel;     // FDA-compliant facts panel data
}
```

### 11.2 Manufacturing Constraints

The ingredient registry (§5.1) includes `ManufacturingConstraint` per ingredient:

- Minimum batch quantity compatibility
- Stability / shelf life
- Incompatible combinations in the same capsule (physical, not pharmacological)
- Temperature sensitivity

If a proposed protocol violates manufacturing constraints, the Engineering Agent's validation catches it and blocks with remediation.

---

## 12. INTEGRATION WITH AGENT SYSTEM

### 12.1 Where the Protocol Engine Sits

The Protocol Engine is **not an agent**. It is a **service** invoked by the orchestrator when a protocol generation or adjustment is needed.

```
Orchestrator receives action.adjust_protocol
  → Data Agent (interpret signals)
  → Product Agent (decide: hold / adjust_minor / adjust_major / defer)
  → IF verdict != hold:
      → Protocol Engine (generate/adjust)
      → Engineering Agent (validate execution plan)
      → Safety Gate
      → Brand Filter
      → Brand Agent (render rationale + announcement)
```

### 12.2 API

```typescript
// packages/domain/protocol/ProtocolEngine.ts

export interface ProtocolEngine {
  generate(input: ProtocolGenerationInput): Promise<ProtocolGenerationResult>;
  adjust(input: ProtocolAdjustmentInput): Promise<ProtocolGenerationResult>;
}

export interface ProtocolGenerationInput {
  userId: UserId;
  healthSignals: DataSignal[];
  userState: Pick<UserState, "profile" | "lifestyle" | "memory" | "protocol" | "consent">;
  mode: "initial" | "adjustment" | "rebuild";
  adjustmentReason?: string;
  productDecision?: ProductDecision;         // the Product Agent's verdict
  requestId: RequestId;
}

export interface ProtocolGenerationResult {
  protocol: ProposedProtocol;
  rulesEngineOutput: RulesEngineOutput;      // full Stage 1 output for audit
  validation: ProtocolValidation;
  manufacturingSpec?: ManufacturingSpec;      // present if approved
  events: Event[];                           // proposed ledger writes
}
```

### 12.3 Events Written

- `protocol.generation.started` — with mode, input snapshot
- `protocol.rules.evaluated` — Stage 1 results (candidate pool, exclusions)
- `protocol.ai.reasoning.completed` — Stage 2 results (selected ingredients, rationale)
- `protocol.validation.completed` — Stage 3 results (verdict, check results)
- `protocol.generated` — final approved protocol (if approved)
- `protocol.adjusted` — with diff from previous (if adjustment)
- `protocol.blocked` — if validation fails, with reason
- `protocol.manufacturing.queued` — when handoff completes

---

## 13. RUNTIME ALIGNMENT

### 13.1 Path Mapping

| Component | Planned Path | Notes |
|-----------|-------------|-------|
| Rules Engine | `packages/domain/protocol/RulesEngine.ts` | Deterministic, no LLM |
| AI Reasoning | `packages/domain/protocol/AIReasoner.ts` | Claude client call |
| Validator | `packages/domain/protocol/Validator.ts` | Orchestrates Stage 3 checks |
| Engine API | `packages/domain/protocol/ProtocolEngine.ts` | Public interface |
| Types | `packages/types/protocol/*.ts` | All protocol schemas |
| Ingredient registry | `packages/config/protocol/ingredients.v1.yaml` + DB | YAML → seed → Postgres |
| Interaction rules | `packages/config/protocol/interaction_rules.v1.yaml` | Hot-reloadable |
| Dosing ceilings | `packages/config/protocol/dosing.v1.yaml` | Hot-reloadable |
| System prompt | `packages/config/protocol/reasoning_prompt.v1.md` | Versioned |
| Runtime mount | `apps/api/src/services/protocol.ts` | Fastify service, called by orchestrator |

### 13.2 Existing Code

The current `apps/api/src/routes/protocol.ts` and `apps/api/src/services/` directory will be refactored to consume the Protocol Engine service rather than inline protocol logic.

---

## 14. GOLDEN TEST CASES

### Test 1 — Initial generation (healthy baseline)
**Input:** 35M, goal: energy, signals: vitamin D low (28 ng/mL), HRV stable, sleep 7h avg. No medications.
**Expected:** Protocol includes vitamin D3 (2000–4000 IU), magnesium glycinate (300mg), possibly B-complex. Rationale traces to vitamin D lab value + energy goal. 4–6 ingredients max.

### Test 2 — Drug interaction exclusion
**Input:** Same as Test 1, but user takes warfarin.
**Expected:** Vitamin K excluded (drug_interaction_contraindicated). Vitamin E limited. Fish oil flagged as moderate interaction. Rationale notes exclusions explicitly.

### Test 3 — Adverse reaction memory
**Input:** User previously reported GI distress with iron bisglycinate (memory event exists).
**Expected:** Iron excluded OR form changed to iron polysaccharide complex with explicit rationale: "Changed form due to your previous experience."

### Test 4 — Minor adjustment (14d+ tenure)
**Input:** Current protocol 30 days old. New labs show improved vitamin D (now 42 ng/mL). HRV improved.
**Expected:** Vitamin D dose reduced. stabilityScore < 0.2. Diff shows one dose change, no additions/removals.

### Test 5 — Cooldown enforcement
**Input:** Adjustment attempted 8 days after last adjustment. No emergency trigger.
**Expected:** Protocol Engine returns `protocol.adjustment.cooldown_enforced`. No generation attempted.

### Test 6 — Major adjustment (new medication)
**Input:** User reports starting an SSRI. Current protocol includes 5-HTP and St. John's Wort.
**Expected:** Both excluded by Stage 1 (serotonin syndrome risk). Protocol regenerated without them. stabilityScore > 0.3. Rationale explains: "Removed due to interaction with your new medication."

### Test 7 — Goal change
**Input:** User changes primary goal from "energy" to "sleep." Current protocol optimized for energy.
**Expected:** Ingredient selection shifts toward sleep-supporting compounds. Some energy-specific ingredients retained if they also support sleep (e.g. magnesium). Rationale clearly links changes to new goal.

### Test 8 — Rebuild (90d review)
**Input:** Protocol v3, 90 days old. Multiple new lab results. Significant lifestyle changes (started exercising regularly, sleep improved).
**Expected:** Full rebuild. stabilityScore may be high. User confirmation required. Comprehensive rationale covering everything that changed and why.

---

## 15. BUDGET

### 15.1 Latency

| Mode | Hard Ceiling | Target p50 | Target p95 |
|------|--------------|-----------|-----------|
| Stage 1 (deterministic) | 200ms | 50ms | 120ms |
| Stage 2 (AI reasoning) | 5000ms | 2000ms | 4000ms |
| Stage 3 (validation) | 2000ms | 500ms | 1500ms |
| Full pipeline | 8000ms | 3000ms | 6000ms |

Protocol generation is **not a real-time voice interaction**. It runs async or during dedicated "your formula is being built" UX moments. Latency ceilings are generous by design.

### 15.2 Tokens

Stage 2 input max: 10,000 tokens (candidate pool + context). Output max: 4,000 tokens (protocol + rationale).

### 15.3 Cost

- Per protocol generation: ~$0.10–0.30 (Sonnet) or ~$0.30–0.80 (Opus for rebuilds)
- Per user per month (assuming 1 generation + 1 adjustment): ~$0.30–0.60
- Clinical review of ingredient registry: external cost, not model cost

---

## 16. OBSERVABILITY

### 16.1 Metrics

| Metric | Target |
|--------|--------|
| Stage 1 exclusion rate (ingredients screened out) | Tracked, no target (depends on medications) |
| Stage 2 ingredient selection confidence avg | > 2.0 |
| Stage 3 first-pass validation rate | > 90% |
| Rationale completeness score | 100% (hard requirement) |
| Cooldown enforcement rate | Tracked |
| Stability score distribution on adjustments | Peak at 0.1–0.2 (minor changes dominate) |
| Protocol generation failure rate | < 2% |
| Average ingredients per protocol | 5–8 (tracked for creep) |

### 16.2 Dashboards

- **Clinical:** Ingredient selection frequency, dose distributions, interaction exclusion patterns
- **Product:** Adaptation frequency, stability scores, goal-to-ingredient mapping coverage
- **Engineering:** Pipeline latency, validation failure causes, manufacturing handoff success rate

---

## 17. OUTCOME

When this is live:

- **Every formula is traceable.** "Why this ingredient, at this dose, for this person?" — always answerable, down to the event that drove it.
- **Safety is structural.** The AI cannot bypass interaction checks. Dosing ceilings are deterministic walls, not suggestions.
- **Adaptation is controlled.** 14-day cooldowns, stability scoring, and hold-before-adjust bias prevent whiplash. The body needs time. The system respects that.
- **The formula evolves.** New labs, new wearable data, new goals — the protocol responds. Not reactively. Methodically.
- **Manufacturing is automated.** Approved protocol → spec → queue → personalized label → ship. No manual handoff.

This is the moat. Not the agents. Not the brand. The ability to generate, explain, adapt, and manufacture a formula that is provably built for one person.

---

## 18. OWNERSHIP

- **Clinical:** Ingredient registry, interaction rules, dosing ceilings, evidence review
- **Product:** Adaptation triggers, goal-to-signal mapping, explainability depth
- **Engineering:** Pipeline runtime, validation, manufacturing integration, observability
- **Brand:** Renders rationale (does not generate it)

---

## 19. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify ingredient registry v1 (initial ingredient set + clinical review) | Clinical + Ron | Yes |
| 2 | Author interaction rules YAML v1 | Clinical + Engineering | Yes |
| 3 | Author dosing ceilings YAML v1 | Clinical | Yes |
| 4 | Implement Stage 1 Rules Engine (deterministic) | Engineering | Yes |
| 5 | Implement Stage 2 AI Reasoning with prompt v1 | Engineering | Yes |
| 6 | Implement Stage 3 Validator (wires Safety Gate + Engineering Agent) | Engineering | Yes |
| 7 | Build manufacturing spec generator + handoff | Engineering + Ops | Yes |
| 8 | Calibrate on 20 synthetic user profiles (golden test set) | Product + Clinical | Yes |
| 9 | Ratify Safety Rule Pack v1 against protocol validator requirements | Ron + Clinical + Engineering | Next |
| 10 | Ratify Jeffrey Voice Layer spec against protocol explanation and handoff requirements | Ron + Product + Engineering | Next-2 |

### Immediate (next 72 hours)

1. **Decide the initial ingredient set.** How many ingredients in v1? 30? 50? 100? Determines registry scope and clinical review timeline.
2. **Identify the clinical review partner.** Interaction rules and dosing ceilings require licensed sign-off. This is the critical-path external dependency.
3. **Lock the manufacturing partner.** The `ManufacturingSpec` handoff format depends on their API / intake process.

---

## 20. OPEN QUESTIONS

1. **Ingredient count v1** — starting with 30–50 well-evidenced ingredients vs. 100+ broader set? Recommend: 30–50 with strong evidence. Quality > breadth.
2. **Form factor v1** — capsules only, or also powder/liquid? Affects manufacturing and the `ManufacturingSpec`. Recommend: capsules only for v1.
3. **Proprietary blends** — does Aissisted disclose exact doses on the label (full transparency) or use proprietary blend labeling? Brand principle says transparency. Recommend: full disclosure.
4. **Clinician override path** — can a licensed clinician (via a future clinician dashboard) override Stage 1 exclusions? Recommend: yes, with full audit trail, but defer until clinician dashboard ships.
5. **Real-time vs. batch generation** — does protocol generation happen in real-time during onboarding, or is it queued and delivered async? Recommend: async with a "building your formula" UX moment. 6-second wait is fine if the experience communicates what's happening.
6. **Refill cadence** — 30-day supply standard? Affects `servingsPerUnit` and subscription billing cadence. Growth Agent needs this for lifecycle calculations.
7. **Third-party lab testing** — does every manufactured batch get independent lab verification? Recommend: yes. Non-negotiable for credibility.

---

*End of spec. v1.1. — Runtime-aligned, ready for engineering + clinical review.*
