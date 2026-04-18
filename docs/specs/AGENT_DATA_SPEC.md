# AISSISTED — DATA AGENT SPEC

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Engineering + Product
**Status:** Production-grade specification, runtime-aligned to verified repo state
**Depends on:** `SHARED_STATE_AND_MEMORY_SPEC.md` v1.1, `ORCHESTRATOR_ROUTING_SPEC.md` v1.0, `BRAND_FILTER_SPEC.md` v1.1
**Blocks:** Product Agent scoring, Brand Agent slot-filling, protocol adjustment pipeline, scheduled review content
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · Claude API · AWS
**Role in agent graph:** invoked on `question.personal`, `reflection.mood` (light), `reflection.progress`, `action.log_biomarker` (silent), `action.adjust_protocol`, `system.scheduled.review`

---

## 0. OPERATING LINE

> *"Numbers don't speak. Signals do."*

The Data Agent converts raw biomarker readings, wearable telemetry, and lab results into **typed, confidence-scored health signals**. It never talks to the user. It talks to other agents.

---

## 1. TENSION

Health data is noisy, multi-dimensional, and accumulates faster than anyone can read. Without a dedicated interpretation layer, two things go wrong: either every agent re-interprets raw numbers independently (conflicting conclusions) or the system parrots lab values verbatim (useless at best, alarming at worst).

The Data Agent absorbs that complexity so that downstream agents — Product, Brand, Engineering — receive clean, ranked, explainable signals.

## 2. TRUTH

The Data Agent is the **signal engine**. It does three things and nothing else:

1. **Interpret** — convert raw readings into clinically meaningful assessments
2. **Score** — rank signals by domain, severity, trend direction, and confidence
3. **Flag** — detect risk patterns (interactions, compound signals, critical values) that require safety escalation

It is the only agent allowed to write `biomarker.interpreted` events to the ledger.

## 3. SHIFT

Treat the Data Agent as a **deterministic-first pipeline** with an optional LLM layer. Most interpretation (range checks, trend math, compound patterns) is deterministic code already in the repo. The LLM is reserved for edge cases: ambiguous trends, novel compound signals, and natural-language explanation generation.

---

## 4. ROLE

### 4.1 In Scope

- Biomarker value interpretation against reference ranges
- Per-domain risk scoring (cardiovascular, metabolic, hormonal, micronutrient, renal, inflammatory)
- Trend computation — 7/30/90-day rolling averages, slope, direction classification
- Compound cross-biomarker signal detection (e.g. cardiovascular critical triad)
- Data freshness and confidence assessment
- Medication-supplement interaction risk flagging
- Missing-data gap identification
- Health mode synthesis (`optimal`, `cardiovascular_risk`, `metabolic_dysfunction`, etc.)

### 4.2 Out of Scope

- **What to show the user** → Product Agent
- **How to say it** → Brand Agent (then Brand Filter)
- **Protocol changes** → Product Agent proposes, Engineering validates
- **Growth / retention signals** → Growth Agent
- **Safety escalation decisions** → Safety Gate (deterministic, consumes Data Agent signals)

### 4.3 Runtime Alignment — Current Repo

The Data Agent wraps existing services that are already implemented:

| Spec Concept | Existing Implementation | Status |
|--------------|------------------------|--------|
| Biomarker interpretation | `apps/api/src/services/analysis.service.ts` | ✅ Implemented |
| Range checking + scoring | `apps/api/src/engine/biomarker-ranges.ts` | ✅ Implemented |
| Trend computation | `apps/api/src/services/trends.service.ts` | ✅ Implemented |
| Compound signal detection | `apps/api/src/services/analysis.service.ts` (COMPOUND_PATTERNS) | ✅ Implemented |
| Domain risk scoring | `scoreDomain()` in analysis.service.ts | ✅ Implemented |
| Health mode classification | `analysis.service.ts` → `HealthMode` | ✅ Implemented |
| Domain types | `packages/domain/src/biomarker.ts` | ✅ Implemented |
| Biomarker CRUD + annotation | `apps/api/src/services/biomarker.service.ts` | ✅ Implemented |
| Agent interface wrapper | `apps/api/src/agents/data.ts` | ⬜ To build |
| LLM explanation layer | — | ⬜ To build |
| Interaction risk database | — | ⬜ To build |

**Key insight:** Unlike other agents, the Data Agent is ~70% implemented. The remaining work is (a) wrapping existing services in the `Agent<TInput, TOutput>` interface from `ORCHESTRATOR_ROUTING_SPEC.md` §8, (b) adding the LLM explanation layer, and (c) building the interaction risk module.

### 4.4 Boundary Rule

The Data Agent produces **signals**, not **decisions**. When it detects a worsening trend, it reports `signalType: "trend_worsening"` with severity and confidence. It does **not** decide whether to adjust the protocol, notify the user, or hold. That's the Product Agent's job.

---

## 5. INPUT — REQUIRED STATE SLICE

```typescript
const dataAgent: Agent = {
  name: "data",
  version: "1.0.0",
  requiredSlice: ["biometrics", "protocol"],
  // conditional additions based on intent (see §5.2)
};
```

### 5.1 Always Loaded

- `biometrics.latest` — most recent values per biomarker
- `biometrics.history` — time-series per biomarker (sliding window, default 90d)
- `protocol.current` — active supplements/dosing (needed for interaction checks)

### 5.2 Conditionally Loaded (by intent class)

| Intent | Additional Slice | Mode |
|--------|------------------|------|
| `question.personal` | `profile.identity`, `memory.semantic.traits` | Full |
| `reflection.mood` | `profile.identity` | Light |
| `reflection.progress` | `profile.goals`, `memory.episodic[-30d]` | Full |
| `action.log_biomarker` | `provenance` | Silent |
| `action.adjust_protocol` | ALL | Full |
| `system.scheduled.review` | `profile.goals`, `memory.episodic[-7d]` | Full |

### 5.3 Execution Modes

The Data Agent operates in three modes, determined by the orchestrator at invocation:

| Mode | Token Budget | Latency | LLM | Use Case |
|------|-------------|---------|-----|----------|
| **Silent** | 0 (no LLM) | < 100ms | None | `action.log_biomarker` — deterministic pipeline only |
| **Light** | 300 tok | < 200ms | Haiku | `reflection.mood` — range check + single-line signal |
| **Full** | 1200 tok | < 600ms | Sonnet | All other intents — full interpretation + explanation |

---

## 6. OUTPUT — THE DataAgentOutput CONTRACT

```typescript
// /packages/types/agents/DataAgent.ts (target path per §4.3)

export interface DataAgentOutput extends AgentOutput {
  agent: "data";
  kind: "structured";
  content: DataInterpretation;
}

export interface DataInterpretation {
  healthState: HealthStateSummary;
  signals: RankedSignal[];
  freshness: FreshnessReport;
  interactionFlags: InteractionFlag[];
  missingData: string[];
}

export interface HealthStateSummary {
  mode: HealthMode;
  confidenceScore: number;      // 0–1, derived from data coverage
  domainScores: DomainScores;   // per-domain 0–1 risk
}

export interface RankedSignal {
  rank: number;                 // 1 = most important
  signal: ActiveSignal;         // reuses existing ActiveSignal type
  confidence: 0 | 1 | 2 | 3;
  explanation?: string;         // LLM-generated, only in Full mode
  derivation: SignalDerivation; // provenance chain
}

export interface SignalDerivation {
  method: "deterministic" | "llm_assisted" | "compound_pattern";
  sourceReadings: Array<{
    biomarkerName: string;
    value: number;
    unit: string;
    measuredAt: ISO8601;
    source: "lab" | "wearable" | "manual" | "derived";
  }>;
  rangeRef: string;             // which range definition was used
  trendWindow?: "7d" | "30d" | "90d";
}

export interface FreshnessReport {
  overall: "current" | "aging" | "stale";
  perBiomarker: Array<{
    name: string;
    lastMeasured: ISO8601;
    freshnessStatus: "current" | "aging" | "stale";
    daysOld: number;
  }>;
  staleCriticalCount: number;   // how many critical-path biomarkers are stale
}

export interface InteractionFlag {
  severity: "caution" | "contraindicated" | "requires_clinical_review";
  supplement: string;
  interactsWith: string;        // medication or other supplement
  mechanism: string;
  source: string;               // e.g. "NIH ODS", "Lexicomp"
  recommendation: "hold" | "reduce" | "monitor" | "stop_and_refer";
}
```

### 6.1 Reused Types

The following types already exist in the repo and are consumed verbatim:

- `ActiveSignal` — from `apps/api/src/services/analysis.service.ts`
- `DomainScores` — from `apps/api/src/services/analysis.service.ts`
- `HealthMode` — from `apps/api/src/services/analysis.service.ts`
- `BiomarkerTrendRecord` — from `apps/api/src/services/trends.service.ts`
- `BiomarkerCategory`, `BiomarkerDirection`, `BiomarkerValue` — from `packages/domain/src/biomarker.ts`

These types move to `packages/types/` as the canonical source once `packages/core/` is created (see Product Agent Spec §4.3).

### 6.2 Signal Ranking Algorithm

Signals are ranked by a composite score:

```
rank_score = severity_weight × confidence × recency_decay × domain_priority
```

| Factor | Weights |
|--------|---------|
| `severity_weight` | critical=1.0, warn=0.6, info=0.2 |
| `confidence` | 3→1.0, 2→0.75, 1→0.4, 0→0.1 |
| `recency_decay` | 1.0 if <7d, 0.8 if 7–30d, 0.5 if 30–90d, 0.2 if >90d |
| `domain_priority` | Contextual — higher when domain aligns with user's active goals |

Top-N signals returned (default N=5, max N=10). Product Agent consumes the top-ranked signals; lower-ranked are available on pull.

---

## 7. THE DETERMINISTIC PIPELINE

The Data Agent's core is a deterministic pipeline — no LLM required. This is already implemented across the existing services.

### 7.1 Pipeline Steps

```
  Raw readings (biomarkers table)
        │
        ▼
  ┌──────────────────────────┐
  │ 1. RANGE CHECK           │  biomarker-ranges.ts
  │    value → status         │  (optimal/low/high/critical)
  │    value → risk score     │  scoreBiomarker()
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 2. TREND COMPUTATION     │  trends.service.ts
  │    7/30/90d averages      │  computeBiomarkerTrends()
  │    slope per 30d          │  linearRegression()
  │    direction class        │  classifyTrend()
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 3. SIGNAL DETECTION      │  analysis.service.ts
  │    deficiency/excess      │  detectSignals()
  │    trend_worsening/       │
  │    trend_improving        │
  │    critical_value         │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 4. COMPOUND PATTERNS     │  analysis.service.ts
  │    cardiovascular triad   │  COMPOUND_PATTERNS[]
  │    prediabetes pattern    │
  │    metabolic syndrome     │
  │    thyroid dysregulation  │
  │    iron deficiency anemia │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 5. DOMAIN SCORING        │  scoreDomain()
  │    per-domain 0–1 risk    │
  │    → HealthMode synthesis │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 6. CONFIDENCE ASSESSMENT │  KEY_LABS_FOR_CONFIDENCE
  │    data coverage check    │  12 key labs scored
  │    freshness per marker   │
  └──────────┬───────────────┘
             │
             ▼
  ┌──────────────────────────┐
  │ 7. RANKING + OUTPUT      │  rank_score formula
  │    top-N signals          │  DataAgentOutput
  └──────────────────────────┘
```

### 7.2 Existing Compound Patterns

Already implemented in `analysis.service.ts`:

| Pattern Key | Components | Severity | Trigger |
|-------------|-----------|----------|---------|
| `cardiovascular_composite` | LDL + CRP | warn | LDL>130 ∧ CRP>2 |
| `cardiovascular_critical_triad` | LDL + CRP + triglycerides | critical | LDL>190 ∧ CRP>3 ∧ TG>200 |
| `dyslipidemia_combined` | LDL + triglycerides | warn | LDL>160 ∧ TG>200 |
| `prediabetes_pattern` | glucose + HbA1c | warn | glucose>100 ∧ HbA1c>5.7 |
| `metabolic_syndrome_cluster` | glucose + TG + HDL | warn | glucose>100 ∧ TG>150 ∧ HDL<40 |
| `thyroid_dysregulation` | TSH + free T4 | warn | TSH out [0.4,4] ∧ T4 out [0.8,1.5] |
| `iron_deficiency_anemia` | ferritin + hemoglobin | warn | both low |

### 7.3 Key Labs for Confidence

The confidence score is based on coverage of 12 key labs: glucose, HbA1c, LDL, HDL, triglycerides, vitamin D, B12, CRP, testosterone, TSH, creatinine, ferritin. Confidence thresholds:

| Coverage | Confidence |
|----------|-----------|
| ≥10/12 key labs present and < 90 days old | 3 |
| ≥7/12 key labs present and < 180 days old | 2 |
| ≥4/12 key labs present | 1 |
| <4/12 key labs present | 0 |

---

## 8. THE LLM LAYER (TO BUILD)

The LLM layer is optional and runs only in **Full** mode. It does not replace the deterministic pipeline — it augments it.

### 8.1 When the LLM Fires

| Trigger | Purpose |
|---------|---------|
| Compound signal detected | Generate a natural-language `explanation` for the compound pattern |
| Ambiguous trend (confidence < 2) | Assess whether the trend is noise or meaningful |
| Novel combination not in COMPOUND_PATTERNS | Detect emerging patterns the rules don't cover yet |
| `question.personal` intent | Generate a user-context-aware explanation of their data |

### 8.2 Prompt Architecture

```
SYSTEM:
You are the Data Agent for Aissisted. You interpret biomarker signals.

You receive:
- Deterministic analysis results (range checks, trends, compound signals)
- User context (goals, relevant history)

You produce:
- Brief explanations for detected signals (1–2 sentences max)
- Confidence assessment for ambiguous trends
- Novel pattern detection

You do NOT:
- Make recommendations
- Decide what to show the user
- Write user-facing copy
- Comment on anything outside the data

RETURN FORMAT:
JSON matching DataLLMOutput schema. No prose.
```

```typescript
interface DataLLMOutput {
  signalExplanations: Array<{
    signalKey: string;
    explanation: string;     // 1–2 sentences
    confidenceAdjustment?: -1 | 0 | 1;  // LLM can nudge confidence
  }>;
  novelPatterns: Array<{
    components: string[];
    hypothesis: string;
    confidence: 0 | 1 | 2;
    suggestAddToRules: boolean;
  }>;
}
```

### 8.3 Model Selection

| Trigger | Model | Budget |
|---------|-------|--------|
| Signal explanation | Haiku 4.5 | 200ms / 300 tok |
| Ambiguous trend | Sonnet 4.6 | 400ms / 600 tok |
| Novel pattern detection | Sonnet 4.6 | 500ms / 800 tok |

**Rule:** The LLM never overrides a deterministic result. It can adjust confidence by ±1 and add explanations, but the underlying signal stands.

---

## 9. INTERACTION RISK MODULE (TO BUILD)

### 9.1 Architecture

Supplement-medication and supplement-supplement interaction checking is a deterministic rules engine, not LLM-based.

```typescript
// /apps/api/src/engine/interaction-rules.ts

interface InteractionRule {
  id: string;
  supplement: string;         // e.g. "magnesium_glycinate"
  interactsWith: string;      // e.g. "levothyroxine"
  interactionType: "absorption" | "amplification" | "antagonism" | "metabolism";
  severity: "caution" | "contraindicated" | "requires_clinical_review";
  mechanism: string;
  timing?: string;            // e.g. "take 4h apart"
  source: string;
  recommendation: "hold" | "reduce" | "monitor" | "stop_and_refer";
}

function checkInteractions(
  currentSupplements: Supplement[],
  reportedMedications: Medication[]
): InteractionFlag[];
```

### 9.2 Data Sources

- NIH Office of Dietary Supplements fact sheets
- Natural Medicines Comprehensive Database
- Lexicomp / Clinical Pharmacology interactions (via structured data export, not API)

### 9.3 Integration with Safety Gate

Every `InteractionFlag` with severity `contraindicated` or `requires_clinical_review` is forwarded to the Safety Gate (per `ORCHESTRATOR_ROUTING_SPEC.md` §10). The Safety Gate can block the entire response.

Interaction flags are emitted as proposed events:

```typescript
{
  type: "safety.interaction.detected",
  payload: {
    supplement: "magnesium_glycinate",
    interactsWith: "ciprofloxacin",
    severity: "contraindicated",
    recommendation: "stop_and_refer"
  }
}
```

---

## 10. INTEGRATION

### 10.1 With the Orchestrator

The Data Agent is invoked per the routing decision table (`ORCHESTRATOR_ROUTING_SPEC.md` §6):

```typescript
const output = await dataAgent.invoke(
  { intent, upstreamOutputs: {} },   // Data Agent is always first in graph
  { userId, sessionId, state, memory, requestId, budget }
);
```

In silent mode (`action.log_biomarker`), the orchestrator skips Brand Filter and returns a minimal acknowledgment.

### 10.2 With the Product Agent

The Data Agent's output is the Product Agent's primary input:

```typescript
// Product Agent receives:
{
  upstreamOutputs: {
    data: dataAgentOutput   // typed as DataAgentOutput
  }
}
```

Product Agent consumes `signals[]`, `healthState`, and `freshness` to make decisions about what to surface, explain, or withhold.

### 10.3 With the State API

The Data Agent is **read-only** against `StateProjectionAPI` for user state. It **proposes** events for the orchestrator to append:

- `biomarker.interpreted` — always, after every full interpretation run
- `safety.interaction.detected` — when interaction risks are found
- `data.freshness.stale` — when critical biomarkers exceed freshness thresholds

### 10.4 With the Safety Gate

The Data Agent feeds the Safety Gate two ways:

1. **InteractionFlags** — forwarded directly for safety evaluation
2. **Critical signals** — any signal with `severity: "critical"` is tagged for safety inspection

The Safety Gate's interaction check (§10.1 in orchestrator spec) consumes Data Agent output, not raw biomarker data.

---

## 11. GOLDEN TEST CASES

### Test 1 — `action.log_biomarker` (silent)
**Input:** User logs vitamin D = 18 ng/mL
**Expected:** Silent mode. Signal `vitamin_d_ng_ml_low` emitted, `severity: "warn"`, `signalType: "deficiency"`. No LLM. `biomarker.interpreted` event proposed.

### Test 2 — `question.personal` (full)
**Input:** "Am I at risk for heart disease?" + LDL=145, CRP=2.5, TG=180
**Expected:** Full mode. `cardiovascular_composite` compound signal fired (`severity: "warn"`). LLM generates explanation. Signals ranked with cardiovascular composite at rank 1.

### Test 3 — `reflection.progress` (trend detection)
**Input:** 14-day improving HRV trend, 30-day stable glucose
**Expected:** `trend_improving` signal for HRV, no signal for glucose (stable = no signal). Freshness report included.

### Test 4 — `action.adjust_protocol` (interaction flag)
**Input:** User reports starting levothyroxine. Current protocol includes calcium and magnesium.
**Expected:** Two `InteractionFlag`s: calcium + levothyroxine (absorption, `contraindicated`), magnesium + levothyroxine (absorption, `caution`, "take 4h apart"). Safety event proposed.

### Test 5 — `system.scheduled.review` (confidence gating)
**Input:** Only 3/12 key labs present, oldest is 200 days old.
**Expected:** `confidenceScore: 0`, `freshness.overall: "stale"`, `missingData` lists 9 missing labs. Health mode = `data_insufficient`.

### Test 6 — `reflection.mood` (light mode)
**Input:** "I've been feeling exhausted" + ferritin=12, B12=180
**Expected:** Light mode. `ferritin_ng_ml_low` (deficiency, warn), `b12_pg_ml_low` (deficiency, info). No compound pattern. No LLM explanation (light mode).

### Test 7 — `action.adjust_protocol` (critical triad)
**Input:** LDL=210, CRP=4.1, TG=250
**Expected:** `cardiovascular_critical_triad` compound signal (`severity: "critical"`). Signal escalated to Safety Gate. `recommendation: "stop_and_refer"` or equivalent critical response.

### Test 8 — Novel compound (LLM detection)
**Input:** Elevated homocysteine + low B12 + low folate (not in COMPOUND_PATTERNS yet)
**Expected:** Full mode. Deterministic signals for each individual biomarker. LLM detects novel compound pattern → `novelPatterns[0].hypothesis: "methylation cycle dysfunction"`, `suggestAddToRules: true`.

---

## 12. BUDGET

### 12.1 Latency by Mode

| Mode | Hard Ceiling | Target p50 | Target p95 |
|------|-------------|-----------|-----------|
| Silent | 150ms | 30ms | 80ms |
| Light | 300ms | 100ms | 200ms |
| Full | 800ms | 300ms | 600ms |

### 12.2 Tokens

| Mode | Input Max | Output Max |
|------|----------|-----------|
| Silent | 0 | 0 |
| Light | 2,000 | 300 |
| Full | 6,000 | 1,200 |

### 12.3 Cost Guardrail

- Per-user per-day cap: $0.15 of Data Agent spend (lower than Product Agent — most work is deterministic)
- On breach: disable LLM layer, run deterministic-only for remainder of day
- Alert threshold: 80% of cap

---

## 13. OBSERVABILITY

### 13.1 Events Emitted

- `biomarker.interpreted` — always on full/light runs
- `safety.interaction.detected` — when interaction risks found
- `data.freshness.stale` — critical biomarker exceeded freshness threshold
- `agent.data.novel_pattern` — when LLM detects a new compound signal

### 13.2 Metrics

| Metric | Target |
|--------|--------|
| Silent mode p95 latency | < 80ms |
| Full mode p95 latency | < 600ms |
| Deterministic pipeline coverage | > 95% of all signals (LLM is marginal) |
| Critical signal detection rate | 100% (deterministic, no misses) |
| Compound pattern precision | > 90% (verified against clinical review) |
| Stale data detection accuracy | 100% (deterministic threshold) |
| LLM explanation coherence (human eval, monthly) | > 4.0 / 5.0 |

### 13.3 Review Cadence

Engineering + Product weekly:
- Signal distribution by domain and severity
- Stale-data frequency across user base
- Novel pattern proposals from LLM (candidates for new COMPOUND_PATTERNS rules)
- Interaction flag firing rate
- Deterministic-vs-LLM signal ratio (should stay > 95:5)

---

## 14. VERSIONING

- Biomarker range definitions in `apps/api/src/engine/biomarker-ranges.ts` (existing)
- Compound patterns in `apps/api/src/services/analysis.service.ts` (existing, move to `packages/config/agents/data/` as agent matures)
- Interaction rules in `apps/api/src/engine/interaction-rules.ts` (to build)
- Agent wrapper in `apps/api/src/agents/data.ts` (to build)
- Schema types in `packages/types/agents/DataAgent.ts` (to build)
- LLM prompt in `packages/config/agents/data/system.v1.md` (to build)
- Every range/pattern/rule change requires engineering review + regression on golden test set
- Agent version emitted on every event for traceability

---

## 15. OUTCOME

When this is live:

- **Raw biomarker data never reaches the user uninterpreted** — every number passes through range check, trend analysis, and signal ranking before surfacing
- **Clinical compound patterns are codified and testable** — not left to LLM improvisation
- **Interaction risks are caught deterministically** — zero reliance on LLM reasoning for safety-critical checks
- **Data quality is explicit** — freshness and confidence scores propagate to every downstream agent, preventing confident-sounding answers built on stale data
- **The LLM adds nuance, not structure** — explanations and novel pattern detection are valuable but optional; the system works without them

---

## 16. OWNERSHIP

- **Engineering:** deterministic pipeline, range definitions, compound patterns, interaction rules, performance
- **Product (Ron):** signal ranking weights, freshness thresholds, confidence bands, golden test set
- **Clinical (when onboarded):** range definition review, interaction rule validation, compound pattern sign-off

Engineering owns the code. Product owns the behavior. Clinical owns the medical accuracy.

---

## 17. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Ratify DataAgentOutput schema | Ron + Engineering | Yes |
| 2 | Build Agent interface wrapper around existing services | Engineering | Yes |
| 3 | Implement signal ranking algorithm (§6.2) | Engineering | Yes |
| 4 | Build FreshnessReport computation | Engineering | Yes |
| 5 | Build interaction rules engine (§9) | Engineering | Yes — blocks safety |
| 6 | Author LLM prompt v1 for explanation layer | Ron + Claude | No |
| 7 | Build 8 golden test cases into regression harness | Engineering | Yes |
| 8 | Wire Data Agent into orchestrator graph | Engineering | After Product Agent wired |
| 9 | Seed interaction rule database (top 50 supplement-medication pairs) | Clinical + Engineering | Before production |
| 10 | Draft Brand Agent spec (next deliverable) | Ron + Claude | Next |

### Immediate (next 72 hours)

1. **Freeze DataAgentOutput and RankedSignal schemas.** Product Agent already depends on this contract.
2. **Build the thin Agent wrapper** — most logic is in `analysis.service.ts` and `trends.service.ts`. The wrapper is ~100 lines: load state slice, run pipeline, format output, propose events.
3. **Implement the ranking formula** — currently signals are unranked. Adding `rank_score` is the single biggest improvement.

---

## 18. OPEN QUESTIONS

1. **Wearable data integration** — WHOOP/Oura/Apple Health data arrives as time-series, not lab-style point values. Does it flow through the same pipeline or a parallel one? Recommend: same pipeline with a `source: "wearable"` flag and adjusted freshness thresholds (wearable data is always "current").
2. **Historical re-interpretation** — when range definitions or compound patterns change, do we re-run the pipeline on historical data? Recommend: yes, on next `system.scheduled.review`, not retroactively for all users at once.
3. **Explainability depth** — how much derivation detail do we store in the ledger? Full `SignalDerivation` is verbose but auditable. Recommend: full derivation in ledger, summary in Redis hot cache.
4. **Confidence calibration** — the coverage-based confidence (§7.3) is a proxy. Should we calibrate against actual prediction accuracy once we have outcome data? Recommend: yes, post-launch.
5. **Multi-lab normalization** — different labs report different reference ranges. Do we normalize to our ranges or preserve lab-specific ranges? Recommend: normalize to Aissisted ranges (§7.1) with original lab range stored in provenance.
6. **Interaction rule licensing** — Lexicomp and Natural Medicines DB require commercial licenses. Budget and timeline TBD.

---

*End of spec. v1.1. — Runtime-aligned, ready for engineering review.*
