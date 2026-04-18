# AISSISTED — SAFETY RULE PACK v1

**Version:** v1.1 (Runtime-Aligned)
**Owner:** Clinical + Engineering + Product
**Status:** Production-grade specification, requires clinical sign-off before deployment
**Depends on:** `ORCHESTRATOR_ROUTING_SPEC.md` v1.0 (§10), `PROTOCOL_ENGINE_SPEC.md` v1.1 (§6, §8), `AGENT_DATA_SPEC.md` v1.1
**Blocks:** `action.adjust_protocol` going live, Protocol Engine Stage 3 validation, Safety Gate runtime
**Stack alignment:** Fastify · PostgreSQL (Drizzle) · Redis · AWS
**Clinical sign-off required:** Yes. No rule ships without licensed review.

---

## 0. OPERATING LINE

> *"The system that learns your body must never hurt it."*

Safety is not a feature. It is the foundation everything else is permitted to exist on top of. These rules are the floor. The AI reasons above them. Never through them.

---

## 1. TENSION

A system that generates personalized supplement formulas carries real risk. Interactions with medications. Doses that exceed safety thresholds. Stale data producing confident recommendations. Red flags buried in biomarker values that nobody catches.

Most supplement companies avoid this problem by selling generic products and disclaiming liability. Aissisted cannot. The moment the system says "this was built for you," it accepts responsibility for what "this" contains.

## 2. TRUTH

Safety in Aissisted is **deterministic, not probabilistic**. The Safety Gate and Protocol Engine Stage 1 run rules — not LLM reasoning — against every output before it reaches a user. The LLM is never trusted with safety decisions.

Three non-negotiables:
1. **No rule can be overridden by an agent.** Only a licensed clinician with the right role.
2. **Every rule firing is an event in the ledger.** Full audit trail. Always.
3. **False positives are acceptable. False negatives are not.** Over-caution is a cost. Under-caution is a lawsuit, or worse.

## 3. SHIFT

Treat safety rules as **versioned, structured data** — not code comments, not prompt instructions, not "things we'll check later." They live in YAML, they're loaded at boot, they're hot-reloadable, and they're clinically reviewed on a published cadence.

---

## 4. ARCHITECTURE — WHERE RULES EXECUTE

Safety rules execute at **two checkpoints**, as defined in prior specs:

### Checkpoint 1 — Protocol Engine Stage 1 (Pre-AI)

Runs **before** the AI reasons about ingredient selection. Rules here **exclude ingredients from the candidate pool**. The AI never sees what Stage 1 removes.

Rules at this checkpoint:
- Drug-supplement interactions (Rules 1–2)
- Supplement-supplement interactions (Rule 3)
- Condition contraindications (Rule 4)
- Dosing ceilings (Rule 5)

### Checkpoint 2 — Safety Gate (Post-AI, Pre-Brand)

Runs **after** all agents have produced output, **before** the Brand Filter. Rules here **block, flag, or escalate** the entire response.

Rules at this checkpoint:
- Critical lab value detection (Rule 6)
- Red-flag language / crisis detection (Rule 7)
- Data freshness validation (Rule 8)
- Recommendation-contradiction detection (Rule 9)
- Compound risk pattern detection (Rule 10)

```
┌──────────────────────────────────────────────────────┐
│ PROTOCOL ENGINE                                       │
│                                                      │
│  Stage 1 (Rules 1–5) → Safe candidate pool           │
│  Stage 2 (AI reasoning) → Proposed protocol           │
│  Stage 3 (Validation) → Checks Stage 1 wasn't bypassed│
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│ ORCHESTRATOR PIPELINE                                 │
│                                                      │
│  Agent outputs assembled                              │
│  ↓                                                   │
│  SAFETY GATE (Rules 6–10) → block / flag / pass      │
│  ↓                                                   │
│  Brand Filter → tone / language check                 │
│  ↓                                                   │
│  Responder → user                                     │
└──────────────────────────────────────────────────────┘
```

---

## 5. RULE STRUCTURE

Every rule follows the same schema:

```yaml
rule:
  id: "SAFE-001"
  name: "Human-readable name"
  version: "1.0.0"
  checkpoint: "stage_1" | "safety_gate"
  category: "interaction" | "dosing" | "critical_value" | "red_flag" | "freshness" | "contradiction" | "compound_risk"
  severity: "block" | "flag" | "escalate"
  description: "What this rule checks and why"
  condition: "Structured condition (see §5.1)"
  action:
    on_trigger: "What happens when the rule fires"
    user_impact: "What the user sees (if anything)"
    remediation: "How to resolve"
  evidence: "Clinical basis for this rule"
  reviewed_by: "Clinician name + credential"
  reviewed_at: "ISO8601"
  effective_from: "ISO8601"
  supersedes: null | "SAFE-XXX"
```

### 5.1 Condition Language

Conditions are evaluated by a deterministic engine — no LLM interpretation. Conditions reference:

```typescript
interface SafetyRuleContext {
  // Available at Checkpoint 1 (Stage 1)
  currentMedications: Medication[];
  candidateIngredients: IngredientEntry[];
  userConditions: ConditionAssertion[];
  allergens: string[];
  biologicalSex: string;
  age: number;

  // Available at Checkpoint 2 (Safety Gate)
  proposedProtocol: ProposedProtocol;
  healthSignals: DataSignal[];
  latestBiomarkers: Record<BiomarkerCode, BiomarkerReading>;
  dataFreshness: Record<DataSource, ISO8601>;
  agentOutputs: Record<AgentName, AgentOutput>;
  recentEvents: Event[];             // last 72h
  userUtterance?: string;            // raw input (for red-flag language)
}
```

### 5.2 Severity Definitions

| Severity | Behavior | User Impact | Override |
|----------|----------|-------------|---------|
| **block** | Suppresses output entirely. Safe fallback substituted. | Sees fallback or remediation. | Clinician only. |
| **flag** | Output passes, but carries a visible caveat. | Sees "talk to your doctor about..." | None needed. |
| **escalate** | Output suppressed. Human review triggered. Response held. | Sees "We're reviewing something for you." | Human reviewer releases. |

---

## 6. THE TEN RULES

---

### RULE 1 — Major Drug-Supplement Interactions

```yaml
id: "SAFE-001"
name: "Major drug-supplement interaction screen"
version: "1.0.0"
checkpoint: "stage_1"
category: "interaction"
severity: "block"
description: >
  Screens every candidate ingredient against the user's reported medications.
  Any interaction rated "major" or "contraindicated" excludes the ingredient
  from the candidate pool. No AI reasoning can override this.
condition:
  for_each: "candidateIngredient"
  check: "candidateIngredient.interactions.drugInteractions"
  match: "any interaction where severity IN ['major', 'contraindicated'] AND drugClass IN user.currentMedications.drugClasses"
  action: "exclude candidateIngredient from pool"
action:
  on_trigger: >
    Ingredient excluded. ExcludedIngredient record created with
    reason: 'drug_interaction_{severity}', evidence: mechanism text,
    overrideable: false (contraindicated) or true (major, clinician only).
  user_impact: >
    User is never shown the excluded ingredient. If asked why it's not
    in their formula, Brand Agent explains: "We checked this against your
    medications and removed it to keep you safe."
  remediation: >
    For 'major': clinician can override with documented rationale.
    For 'contraindicated': no override path. Period.
evidence: >
  Based on Natural Medicines Comprehensive Database interaction ratings,
  FDA safety communications, and published pharmacokinetic studies.
  Key examples: St. John's Wort + SSRIs (serotonin syndrome),
  Vitamin K + warfarin (anticoagulant antagonism),
  5-HTP + SSRIs (serotonin syndrome).
```

**Interaction database source:** Natural Medicines Comprehensive Database (primary), cross-referenced with Lexicomp and FDA MedWatch.

**Update cadence:** Monthly sync. Every update requires clinical sign-off before hot-reload.

---

### RULE 2 — Moderate Drug-Supplement Interactions

```yaml
id: "SAFE-002"
name: "Moderate drug-supplement interaction screen"
version: "1.0.0"
checkpoint: "stage_1"
category: "interaction"
severity: "flag"
description: >
  Screens for moderate interactions. Ingredient is NOT excluded but
  carries a flag. The flag informs dosing decisions in Stage 2 and
  is surfaced to the user as a caveat.
condition:
  for_each: "candidateIngredient"
  check: "candidateIngredient.interactions.drugInteractions"
  match: "any interaction where severity == 'moderate' AND drugClass IN user.currentMedications.drugClasses"
  action: "flag candidateIngredient, reduce dosing ceiling by 50%, add timing separation if applicable"
action:
  on_trigger: >
    CandidateIngredient.dosingRange.max reduced by 50%.
    InteractionWarning added to RulesEngineOutput.
    If mechanism is absorption-based, timing separation note added.
  user_impact: >
    User sees a note: "We've adjusted the dose of [ingredient] because
    of your [medication]. Talk to your doctor if you have questions."
  remediation: >
    Clinician can restore full dosing range with documented approval.
    Timing separation (e.g. "take 2 hours apart") handled by protocol timing field.
evidence: >
  Moderate interactions have clinically meaningful effects that can
  typically be managed with dose adjustment or timing separation.
  Examples: Magnesium + tetracycline antibiotics (chelation, timing separation),
  Calcium + thyroid medications (absorption interference).
```

---

### RULE 3 — Supplement-Supplement Interactions

```yaml
id: "SAFE-003"
name: "Supplement-supplement interaction screen"
version: "1.0.0"
checkpoint: "stage_1"
category: "interaction"
severity: "block"
description: >
  Screens candidate ingredients against EACH OTHER within the proposed pool.
  Some supplements are antagonistic or create compound toxicity risk
  when combined. This rule prevents the AI from selecting conflicting
  ingredients even if each is individually safe.
condition:
  for_each_pair: "candidatePool"
  check: "ingredientA.interactions.supplementInteractions"
  match: "any interaction where targetIngredient == ingredientB.id AND severity IN ['major', 'contraindicated']"
  action: "exclude lower-relevance ingredient from pair"
action:
  on_trigger: >
    Lower-relevance-scored ingredient excluded. If relevance scores are
    equal, the ingredient with stronger evidence base is retained.
    ExcludedIngredient record created with reason: 'supplement_interaction_in_pool'.
  user_impact: "Silent. User never sees the excluded ingredient."
  remediation: "Clinician can override if combination is managed with specific protocol."
evidence: >
  Examples: Iron + Calcium (absorption competition — separate or exclude one),
  Zinc + Copper (competitive absorption at high doses),
  Multiple fat-soluble vitamins at high doses (cumulative toxicity risk).
```

---

### RULE 4 — Condition Contraindications

```yaml
id: "SAFE-004"
name: "Condition-based contraindication screen"
version: "1.0.0"
checkpoint: "stage_1"
category: "interaction"
severity: "block"
description: >
  Screens candidate ingredients against the user's diagnosed or
  self-reported health conditions. Certain ingredients are unsafe
  for specific conditions regardless of dosing.
condition:
  for_each: "candidateIngredient"
  check: "candidateIngredient.interactions.conditionContraindications"
  match: "any contraindication where condition IN user.conditions"
  action: "exclude candidateIngredient from pool"
action:
  on_trigger: >
    Ingredient excluded. ExcludedIngredient record created with
    reason: 'condition_contraindication'.
  user_impact: >
    If asked, Brand Agent explains: "Given your health history,
    we've kept [ingredient] out of your formula."
  remediation: "Clinician override only, with documented rationale."
evidence: >
  Examples:
  - Iron supplementation + hemochromatosis (iron overload)
  - Vitamin K + blood clotting disorders
  - High-dose Vitamin A + liver disease
  - Potassium + chronic kidney disease
  - Iodine + hyperthyroidism
```

**Condition registry:** Mapped to ICD-10 codes where possible, plus common self-reported terms ("high blood pressure" → I10). Fuzzy matching with human review for ambiguous self-reports.

---

### RULE 5 — Absolute Dosing Ceilings

```yaml
id: "SAFE-005"
name: "Absolute dosing ceiling enforcement"
version: "1.0.0"
checkpoint: "stage_1"
category: "dosing"
severity: "block"
description: >
  Enforces absolute maximum doses per ingredient, adjusted for age,
  biological sex, body weight (if available), and concurrent conditions.
  The AI may select any dose BELOW the ceiling. It cannot exceed it.
  The ceiling is never negotiable.
condition:
  for_each: "selectedIngredient in proposedProtocol"
  check: "selectedIngredient.dose > dosingCeiling(ingredientId, userContext)"
  action: "block protocol, require dose reduction"
action:
  on_trigger: >
    Protocol fails Stage 3 validation. Logged as safety incident.
    Protocol Engine re-runs Stage 2 with explicit ceiling constraint.
    If AI exceeds ceiling twice, protocol generation fails and
    escalates to clinical review.
  user_impact: "User never sees an over-dosed protocol."
  remediation: "Protocol Engine auto-corrects on retry. No user action needed."
evidence: >
  Ceilings derived from: FDA Daily Values, Tolerable Upper Intake Levels
  (UL) from National Academies of Sciences, ingredient-specific clinical
  literature, and conservative clinical judgment.
```

**Ceiling registry (examples):**

```yaml
# packages/config/protocol/dosing.v1.yaml

dosing_ceilings:
  vitamin_d3:
    default_iu: 5000
    age_over_70_iu: 4000
    with_hypercalcemia: 0              # contraindicated — handled by Rule 4, but belt + suspenders
    with_kidney_disease_iu: 1000
    pregnancy_iu: 4000
    unit: "IU"
    source: "National Academies UL + conservative clinical guidance"

  vitamin_a_retinol:
    default_iu: 3000
    pregnancy_iu: 2500                 # teratogenicity risk above 10000 IU
    with_liver_disease: 0              # contraindicated
    unit: "IU"
    source: "FDA + NIH ODS"

  iron_elemental:
    default_mg: 45
    with_hemochromatosis: 0
    without_documented_deficiency_mg: 18  # don't supplement iron without lab evidence
    unit: "mg"
    source: "National Academies UL"

  magnesium_glycinate:
    default_mg: 400                    # elemental magnesium equivalent
    with_renal_impairment_mg: 200
    unit: "mg"
    source: "National Academies UL for supplemental magnesium"

  zinc:
    default_mg: 40
    unit: "mg"
    source: "National Academies UL"

  vitamin_c:
    default_mg: 2000
    with_kidney_stones_history_mg: 500
    unit: "mg"
    source: "National Academies UL"

  omega_3_epa_dha:
    default_mg: 3000                   # combined EPA + DHA
    with_anticoagulants_mg: 1000       # bleeding risk — see Rule 2
    unit: "mg"
    source: "FDA GRAS + clinical guidance"

  selenium:
    default_mcg: 400
    unit: "mcg"
    source: "National Academies UL"

  vitamin_b6:
    default_mg: 100
    note: "Peripheral neuropathy risk above 200mg/day long-term"
    unit: "mg"
    source: "National Academies UL + clinical literature"

  folate:
    default_mcg_dfe: 1000
    note: "High-dose folic acid can mask B12 deficiency"
    unit: "mcg DFE"
    source: "National Academies UL"
```

**Ceiling computation:** The engine selects the **most restrictive** ceiling that applies to the user's profile. If multiple conditions apply, the lowest ceiling wins.

---

### RULE 6 — Critical Lab Value Detection

```yaml
id: "SAFE-006"
name: "Critical lab value detection"
version: "1.0.0"
checkpoint: "safety_gate"
category: "critical_value"
severity: "escalate"
description: >
  Detects lab values that fall into critical ranges requiring immediate
  medical attention. When triggered, all AI-generated responses are
  suppressed and the user is directed to contact a healthcare provider.
  Aissisted does not diagnose or treat — it escalates.
condition:
  for_each: "biomarker in latestBiomarkers"
  check: "biomarker.value outside criticalRange(biomarker.code)"
  action: "escalate immediately"
action:
  on_trigger: >
    All agent outputs suppressed for this request. User receives a
    safety-gated message: "One of your recent lab values needs attention
    from your healthcare provider. Please reach out to your doctor."
    Event 'safety.critical_value.detected' written to ledger with full details.
    If clinician dashboard exists, alert queued.
  user_impact: >
    User sees an escalation message. No protocol adjustment. No supplement
    recommendations in this session until cleared.
  remediation: >
    User contacts their provider. System holds safety flag until:
    (a) new lab results show resolution, or
    (b) clinician clears the flag via dashboard.
evidence: >
  Critical ranges aligned with CLIA-defined critical values and
  common clinical laboratory alert thresholds.
```

**Critical value thresholds (examples):**

```yaml
# packages/config/safety/critical_values.v1.yaml

critical_ranges:
  potassium:
    low: 3.0       # mEq/L — hypokalemia risk
    high: 5.5      # mEq/L — hyperkalemia / cardiac risk
    unit: "mEq/L"

  sodium:
    low: 125        # mEq/L
    high: 155       # mEq/L
    unit: "mEq/L"

  glucose_fasting:
    low: 50         # mg/dL — hypoglycemia
    high: 400       # mg/dL — diabetic emergency
    unit: "mg/dL"

  calcium_total:
    low: 6.5        # mg/dL
    high: 13.0      # mg/dL — hypercalcemia emergency
    unit: "mg/dL"

  creatinine:
    high: 10.0      # mg/dL — severe renal impairment
    unit: "mg/dL"

  hemoglobin:
    low_male: 7.0   # g/dL — severe anemia
    low_female: 7.0
    high: 20.0
    unit: "g/dL"

  tsh:
    low: 0.1        # mIU/L — severe hyperthyroidism
    high: 20.0      # mIU/L — severe hypothyroidism
    unit: "mIU/L"

  alt:
    high: 500       # U/L — acute liver injury
    unit: "U/L"

  inr:
    high: 5.0       # bleeding risk
    unit: "ratio"
    note: "Especially critical for users on anticoagulants (cross-ref Rule 1)"
```

**Threshold governance:** These thresholds are conservative — intentionally wider than clinical panic values to catch near-critical states early. Clinical review may tighten or loosen specific values.

---

### RULE 7 — Red-Flag Language / Crisis Detection

```yaml
id: "SAFE-007"
name: "Red-flag language and crisis detection"
version: "1.0.0"
checkpoint: "safety_gate"
category: "red_flag"
severity: "escalate"
description: >
  Detects language in user input that indicates a medical emergency,
  mental health crisis, or acute symptom requiring immediate human
  intervention. This rule is DETERMINISTIC — regex and keyword matching,
  never LLM inference. Speed and reliability over nuance.
condition:
  check: "userUtterance matches any pattern in red_flag_patterns"
  action: "escalate immediately"
action:
  on_trigger: >
    All agent outputs suppressed. User receives a safety-gated message
    with appropriate resources. Event 'safety.red_flag.detected' written
    to ledger. If pattern is crisis-category, include crisis resource
    information.
  user_impact: >
    Crisis: "If you're in immediate danger, please call 911 or go to your
    nearest emergency room. You can also reach the 988 Suicide & Crisis
    Lifeline by calling or texting 988."
    Medical emergency: "This sounds like something that needs your doctor
    right away. Please reach out to your healthcare provider."
    Acute symptom: "I want to make sure you're safe. Please contact your
    healthcare provider about what you're experiencing."
  remediation: "System holds until next session or clinician clearance."
evidence: >
  Pattern list developed from clinical triage protocols, crisis
  intervention guidelines, and FDA adverse event reporting language.
```

**Pattern registry:**

```yaml
# packages/config/safety/red_flags.v1.yaml

patterns:
  crisis:
    # Mental health crisis
    - pattern: "\\b(suicid|kill myself|end my life|want to die|don't want to live)\\b"
      case_insensitive: true
    - pattern: "\\b(self[- ]harm|cutting myself|hurt myself)\\b"
      case_insensitive: true

  medical_emergency:
    # Cardiac
    - pattern: "\\b(chest pain|chest tightness|heart attack|can't breathe|difficulty breathing)\\b"
      case_insensitive: true
    # Neurological
    - pattern: "\\b(sudden numbness|sudden weakness|slurred speech|worst headache|sudden vision loss)\\b"
      case_insensitive: true
    # Allergic
    - pattern: "\\b(anaphylax|throat (is )?swelling|can't swallow|tongue (is )?swelling)\\b"
      case_insensitive: true
    # Hemorrhagic
    - pattern: "\\b(vomiting blood|blood in (my )?stool|uncontrolled bleeding|coughing (up )?blood)\\b"
      case_insensitive: true

  acute_symptom:
    # Supplement-related adverse
    - pattern: "\\b(severe rash|hives all over|swelling after taking|allergic reaction to (my )?supplement)\\b"
      case_insensitive: true
    - pattern: "\\b(liver pain|jaundice|yellow (skin|eyes)|dark urine after taking)\\b"
      case_insensitive: true
    - pattern: "\\b(kidney (pain|stone)|blood in (my )?urine)\\b"
      case_insensitive: true
    - pattern: "\\b(seizure|passed out|lost consciousness|fainting)\\b"
      case_insensitive: true
```

**Rules:**
- Patterns are word-boundary anchored to reduce false positives
- Crisis patterns trigger the strongest escalation — with external resources
- Medical emergency patterns suppress + direct to healthcare provider
- Acute symptom patterns suppress + direct to provider with softer language
- **No LLM in the detection path.** Speed and determinism are mandatory.
- **False positive rate target:** < 5%. Acceptable cost for zero false negatives.

---

### RULE 8 — Data Freshness Validation

```yaml
id: "SAFE-008"
name: "Data freshness validation"
version: "1.0.0"
checkpoint: "safety_gate"
category: "freshness"
severity: "flag"
description: >
  Validates that every data source used by the current recommendation
  is within its freshness threshold. Stale data produces a visible
  caveat — never a silent pass. For critical paths (protocol adjustment),
  severity escalates to 'block'.
condition:
  for_each: "dataSource used in proposedProtocol.rationale.drivingSignals"
  check: "dataSource.lastSync > freshnessThreshold(dataSource.type)"
  action: "flag if stale (informational paths) or block if stale (protocol adjustment)"
action:
  on_trigger: >
    Flag path: output passes with a caveat appended by Brand Agent:
    "This is based on data from [N days] ago. For more accurate
    guidance, sync your [device] or update your labs."
    Block path: protocol adjustment halted. Remediation triggers
    data refresh or directs user to sync.
  user_impact: "Sees a freshness caveat or a sync prompt."
  remediation: "Sync device, upload new labs, or acknowledge stale data."
evidence: >
  Stale biomarker data can lead to inappropriate supplementation.
  Example: recommending iron based on 6-month-old labs when current
  ferritin may have normalized.
```

**Freshness thresholds (from Engineering Agent spec §8.2):**

```yaml
freshness_thresholds:
  biomarker_labs: "90d"              # labs older than 90d are stale for protocol decisions
  whoop_recovery: "48h"
  oura_readiness: "48h"
  apple_activity: "72h"
  mychart_records: "30d"
  user_self_report: "14d"            # self-reported conditions / medications
```

**Severity escalation:**

| Context | Severity |
|---------|----------|
| `question.personal` with stale data | flag |
| `reflection.progress` with stale data | flag |
| `action.adjust_protocol` with stale data | **block** |
| `system.scheduled.review` with stale data | flag + note in review |

---

### RULE 9 — Recommendation-Contradiction Detection

```yaml
id: "SAFE-009"
name: "Recommendation contradicts recent biomarkers"
version: "1.0.0"
checkpoint: "safety_gate"
category: "contradiction"
severity: "block"
description: >
  Detects when a proposed protocol recommendation directly contradicts
  what the user's most recent biomarkers show. The system should never
  recommend MORE of something the user already has too much of, or
  LESS of something critically low.
condition:
  for_each: "ingredient in proposedProtocol.ingredients"
  check: "contradiction_rules(ingredient, latestBiomarkers)"
  match: >
    ingredient targets a biomarker that is ALREADY above optimal range
    AND the ingredient's primary mechanism would INCREASE that biomarker
    OR
    ingredient was REMOVED but the target biomarker is CRITICALLY LOW
    and declining
  action: "block protocol"
action:
  on_trigger: >
    Protocol blocked. Event 'safety.contradiction.detected' written
    with specific ingredient + biomarker pair. Protocol Engine must
    re-run Stage 2 with the contradiction flagged as a hard constraint.
  user_impact: "User never sees the contradictory recommendation."
  remediation: "Automatic re-generation with contradiction constraint."
evidence: >
  Examples:
  - Recommending iron when ferritin > 300 ng/mL (iron overload territory)
  - Recommending vitamin D at high dose when 25(OH)D > 80 ng/mL
  - Recommending calcium when total calcium is already high-normal + vitamin D is high
  - Removing B12 when serum B12 < 200 pg/mL and declining
```

**Contradiction pairs (v1):**

```yaml
# packages/config/safety/contradictions.v1.yaml

contradiction_rules:
  - ingredient_targets: "iron"
    biomarker: "ferritin"
    contradiction_when: "ferritin > 200"     # ng/mL — reduce threshold for safety margin
    mechanism: "Iron supplementation raises ferritin"
    action: "block"

  - ingredient_targets: "vitamin_d"
    biomarker: "25_oh_d"
    contradiction_when: "25_oh_d > 80"       # ng/mL
    mechanism: "Vitamin D supplementation raises serum 25(OH)D"
    action: "block"

  - ingredient_targets: "calcium"
    biomarker: "calcium_total"
    contradiction_when: "calcium_total > 10.2"  # mg/dL
    mechanism: "Calcium supplementation raises serum calcium"
    action: "block"

  - ingredient_targets: "potassium"
    biomarker: "potassium"
    contradiction_when: "potassium > 5.0"    # mEq/L
    mechanism: "Potassium supplementation raises serum potassium"
    action: "block"

  - ingredient_targets: "iodine"
    biomarker: "tsh"
    contradiction_when: "tsh < 0.5"          # mIU/L — hyperthyroid territory
    mechanism: "Iodine can exacerbate hyperthyroidism"
    action: "block"

  # Removal contradictions
  - ingredient_removed: "vitamin_b12"
    biomarker: "b12"
    contradiction_when: "b12 < 300 AND b12_trend == 'declining'"
    mechanism: "Removing B12 when levels are low and dropping"
    action: "block"

  - ingredient_removed: "iron"
    biomarker: "ferritin"
    contradiction_when: "ferritin < 30 AND ferritin_trend == 'declining'"
    mechanism: "Removing iron when stores are depleted and dropping"
    action: "block"
```

---

### RULE 10 — Compound Risk Pattern Detection

```yaml
id: "SAFE-010"
name: "Compound risk pattern detection"
version: "1.0.0"
checkpoint: "safety_gate"
category: "compound_risk"
severity: "escalate"
description: >
  Detects multi-signal patterns that individually might be acceptable
  but together indicate elevated health risk requiring human review.
  These are not single-biomarker alerts — they're system-level patterns
  that emerge from combining signals.
condition:
  check: "compound_patterns(healthSignals, latestBiomarkers, proposedProtocol)"
  match: "any defined compound pattern"
  action: "escalate for clinical review"
action:
  on_trigger: >
    Protocol held. Event 'safety.compound_risk.detected' written.
    If clinician dashboard exists, pattern flagged for review with
    all contributing signals. Response to user is held until review
    or timeout (24h → safe fallback).
  user_impact: >
    "We noticed something in your data that we want a healthcare
    professional to review. Your formula update is on hold until
    that's done."
  remediation: "Clinician reviews and clears or adjusts."
evidence: >
  Compound patterns are derived from clinical risk scoring models
  and multi-factor risk assessment literature.
```

**Compound patterns (v1):**

```yaml
# packages/config/safety/compound_patterns.v1.yaml

compound_patterns:
  cardiovascular_triad:
    name: "Cardiovascular risk cluster"
    signals:
      - "LDL > 160 mg/dL"
      - "hsCRP > 3 mg/L"
      - "homocysteine > 15 µmol/L"
    minimum_signals: 2                # any 2 of 3 triggers
    action: "escalate"
    note: "Combined inflammatory + lipid + vascular markers suggest elevated CV risk"

  metabolic_syndrome_cluster:
    name: "Metabolic syndrome indicators"
    signals:
      - "fasting_glucose > 100 mg/dL"
      - "triglycerides > 150 mg/dL"
      - "HDL < 40 mg/dL (M) or < 50 mg/dL (F)"
      - "waist_circumference elevated (if available)"
    minimum_signals: 3
    action: "escalate"
    note: "Multiple metabolic markers suggest systemic metabolic dysfunction"

  hepatotoxicity_risk:
    name: "Liver stress pattern"
    signals:
      - "ALT > 2x upper normal"
      - "AST > 2x upper normal"
      - "GGT elevated"
    minimum_signals: 2
    action: "escalate"
    additional_rule: "If pattern detected, exclude all hepatotoxic supplements (kava, high-dose niacin, green tea extract at high doses)"

  renal_risk:
    name: "Kidney stress pattern"
    signals:
      - "eGFR < 60 mL/min"
      - "creatinine trending up over 90d"
      - "BUN/creatinine ratio elevated"
    minimum_signals: 2
    action: "escalate"
    additional_rule: "Reduce dosing ceilings for renally-cleared supplements by 50%"

  thyroid_volatility:
    name: "Thyroid instability"
    signals:
      - "TSH changed > 50% in 90d"
      - "Free T4 outside range"
    minimum_signals: 2
    action: "escalate"
    additional_rule: "Exclude iodine, selenium adjustments until stable"
```

---

## 7. RULE EXECUTION ENGINE

### 7.1 Implementation

```typescript
// packages/domain/safety/SafetyEngine.ts

export interface SafetyEngine {
  evaluateStage1(context: Stage1Context): Promise<Stage1Result>;
  evaluateGate(context: GateContext): Promise<GateResult>;
}

export interface Stage1Result {
  candidatePool: CandidateIngredient[];
  excluded: ExcludedIngredient[];
  warnings: InteractionWarning[];
  rulesFired: RuleFiring[];
}

export interface GateResult {
  verdict: "pass" | "flag" | "block" | "escalate";
  rulesFired: RuleFiring[];
  caveats: string[];                      // for flag-severity rules
  blockReasons: BlockReason[];
  escalationDetails?: EscalationDetail;
}

export interface RuleFiring {
  ruleId: string;
  ruleName: string;
  ruleVersion: string;
  severity: "block" | "flag" | "escalate";
  detail: string;
  firedAt: ISO8601;
  context: Record<string, unknown>;       // what triggered it (for audit)
}
```

### 7.2 Execution Order

**Checkpoint 1 (Stage 1):** Rules 1 → 2 → 3 → 4 → 5 (sequential, each narrows the pool)

**Checkpoint 2 (Safety Gate):** Rules 6 → 7 → 8 → 9 → 10 (all run; highest severity wins)

### 7.3 Severity Resolution

When multiple rules fire at the Gate:
- If any rule fires at `escalate` → verdict is `escalate`
- If any rule fires at `block` (and none escalate) → verdict is `block`
- If any rule fires at `flag` (and none block/escalate) → verdict is `flag` with caveats appended
- If no rules fire → verdict is `pass`

---

## 8. GOLDEN TEST CASES

### Test 1 — SAFE-001: St. John's Wort + SSRI
**Input:** User takes sertraline (SSRI). St. John's Wort is in ingredient registry.
**Expected:** St. John's Wort excluded with reason `drug_interaction_contraindicated`. Not overrideable.

### Test 2 — SAFE-002: Magnesium + Tetracycline
**Input:** User takes doxycycline. Magnesium in candidate pool.
**Expected:** Magnesium flagged, dosing ceiling reduced 50%, timing separation note: "Take 2 hours apart."

### Test 3 — SAFE-005: Vitamin D ceiling
**Input:** AI proposes 8000 IU Vitamin D for a 45-year-old with no conditions.
**Expected:** Protocol blocked at Stage 3 validation. Ceiling is 5000 IU. Re-run.

### Test 4 — SAFE-006: Critical potassium
**Input:** Latest labs show potassium 5.8 mEq/L.
**Expected:** Escalation. All outputs suppressed. User directed to provider. Protocol held.

### Test 5 — SAFE-007: Crisis language
**Input:** User says "I don't want to live anymore."
**Expected:** Escalation. All outputs suppressed. Crisis resources surfaced (988 Lifeline).

### Test 6 — SAFE-007: False positive resilience
**Input:** User says "I don't want to live without knowing what my labs mean."
**Expected:** Pattern fires on "don't want to live" — acceptable false positive. Escalation triggers. (False positive rate tracked; pattern may be refined, but safety > convenience.)

### Test 7 — SAFE-008: Stale labs + protocol adjustment
**Input:** Labs are 95 days old. User requests protocol adjustment.
**Expected:** Blocked. Freshness threshold for labs is 90d. User prompted to sync.

### Test 8 — SAFE-009: Iron recommended when ferritin high
**Input:** AI proposes iron supplement. Latest ferritin is 280 ng/mL.
**Expected:** Protocol blocked. Contradiction: iron raises ferritin, user's ferritin already elevated.

### Test 9 — SAFE-010: Cardiovascular triad
**Input:** LDL 175 mg/dL, hsCRP 4.2 mg/L, homocysteine normal.
**Expected:** Two of three cardiovascular triad signals present. Escalation triggered. Protocol held for clinical review.

### Test 10 — Clean pass
**Input:** Healthy 30-year-old, no medications, no conditions, all labs in range, data fresh.
**Expected:** All rules pass. No firings. Verdict: pass. Protocol proceeds.

---

## 9. GOVERNANCE

### 9.1 Who Approves Rules

| Action | Approver |
|--------|----------|
| New rule added | Clinical lead + Engineering lead |
| Rule threshold changed | Clinical lead |
| Rule severity changed | Clinical lead + Product |
| Rule deprecated | Clinical lead + Engineering lead |
| Interaction database update | Clinical lead |
| Compound pattern added | Clinical lead |
| Emergency hotfix (critical safety) | Any clinical reviewer, post-hoc review within 48h |

### 9.2 Review Cadence

| Asset | Cadence |
|-------|---------|
| Full rule pack review | Quarterly |
| Interaction database sync | Monthly |
| Critical value thresholds | Bi-annually |
| Red-flag pattern library | Quarterly |
| Compound patterns | Quarterly |
| Dosing ceilings | Bi-annually or on new clinical evidence |

### 9.3 Versioning

- Every YAML file carries `schemaVersion` and `rulesetVersion`
- Every rule carries its own `version` field
- Rule changes are tracked in git with clinical reviewer as co-author
- The Safety Engine emits `safety.rules.version` on boot and on hot-reload
- Historic rule versions preserved indefinitely for audit

### 9.4 Incident Response

If a safety rule **should have fired but didn't** (false negative):

1. **Severity 0 — Critical.** Paged immediately.
2. Rule gap identified within 4 hours.
3. Hotfix rule deployed within 24 hours (clinical emergency approval).
4. Root cause analysis within 72 hours.
5. All affected users reviewed. Protocol holds issued if necessary.
6. Post-incident report filed and retained.

---

## 10. OBSERVABILITY

### 10.1 Events

Every rule firing writes to the event ledger:

- `safety.rule.fired` — ruleId, severity, detail, context
- `safety.gate.verdict` — aggregate verdict, all firings
- `safety.critical_value.detected` — Rule 6 specific
- `safety.red_flag.detected` — Rule 7 specific
- `safety.compound_risk.detected` — Rule 10 specific
- `safety.escalation.created` — when escalation is triggered
- `safety.escalation.resolved` — when clinician clears

### 10.2 Metrics

| Metric | Target |
|--------|--------|
| Rule evaluation p95 latency (Stage 1) | < 50ms |
| Rule evaluation p95 latency (Gate) | < 30ms |
| False positive rate (Rule 7) | < 5% |
| False negative rate (all rules) | **0** — paged incident if > 0 |
| Escalation resolution time p50 | < 12h |
| Escalation resolution time p95 | < 24h |
| Block rate (Stage 1) | Tracked, no target |
| Block rate (Safety Gate) | < 3% of all requests |
| Interaction database currency | < 30d since last sync |

### 10.3 Dashboards

- **Clinical:** Rule firing frequency by rule, escalation queue, resolution times, false-positive review
- **Engineering:** Latency, error rates, rule version currency
- **Product:** Block/flag impact on user flows, freshness prompt frequency

---

## 11. RUNTIME ALIGNMENT

### 11.1 Path Mapping

| Component | Planned Path | Notes |
|-----------|-------------|-------|
| Safety Engine | `packages/domain/safety/SafetyEngine.ts` | Core engine |
| Rule evaluators | `packages/domain/safety/rules/` | One file per rule category |
| Rule YAML registries | `packages/config/safety/` | Hot-reloadable |
| Types | `packages/types/safety/*.ts` | All safety schemas |
| Runtime mount | `apps/api/src/agents/safety-gate.ts` | Deterministic checkpoint in the orchestrator flow |
| Interaction database | `packages/config/protocol/interaction_rules.v1.yaml` + DB | Cross-referenced with Protocol Engine |
| Dosing ceilings | `packages/config/protocol/dosing.v1.yaml` | Shared with Protocol Engine Stage 1 |

### 11.2 Shared Assets

The Safety Rule Pack shares data with the Protocol Engine:
- `interaction_rules.v1.yaml` — used by Stage 1 and re-checked by the Protocol Engine validator as a belt-and-suspenders safeguard
- `dosing.v1.yaml` — used by Stage 1 and re-checked by the Protocol Engine validator before a protocol can pass
- `critical_values.v1.yaml` — Safety Gate only
- `red_flags.v1.yaml` — Safety Gate only
- `contradictions.v1.yaml` — Safety Gate only
- `compound_patterns.v1.yaml` — Safety Gate only

---

## 12. OUTCOME

When this is live:

- **No unsafe ingredient combination reaches a user.** Drug interactions, condition contraindications, and supplement conflicts are screened deterministically before the AI ever reasons.
- **No dose exceeds established limits.** Ceilings are walls, not suggestions. The AI reasons below them.
- **Critical lab values trigger immediate escalation.** The system does not play doctor. It escalates.
- **Crisis language is caught in milliseconds.** Deterministic regex, not LLM inference. Speed and reliability.
- **Stale data produces visible caveats, not silent assumptions.** The user knows when their data is old.
- **Compound risk patterns are detected.** Individual signals that are acceptable alone but dangerous together get caught.
- **Every rule firing is auditable.** Full event trail, versioned rules, clinical sign-off chain.

This is the floor. Everything else stands on it.

---

## 13. OWNERSHIP

- **Clinical:** Rule content, thresholds, interaction database, evidence review, sign-off authority
- **Engineering:** Engine runtime, YAML parsing, hot-reload, observability, latency
- **Product:** User-facing impact of flags/blocks, remediation UX, escalation flow design
- **Brand:** Renders safety messages — never writes them

---

## 14. NEXT STEPS

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Identify and sign clinical review partner | Ron | Yes — blocks everything |
| 2 | Clinical review of all 10 rules + thresholds | Clinical partner | Yes |
| 3 | Implement Safety Engine (deterministic, no LLM) | Engineering | Yes |
| 4 | Load interaction database v1 | Clinical + Engineering | Yes |
| 5 | Load dosing ceilings v1 | Clinical + Engineering | Yes |
| 6 | Build regression harness for 10 golden test cases | Engineering | Yes |
| 7 | Wire Stage 1 into Protocol Engine | Engineering | Yes |
| 8 | Wire Safety Gate into Orchestrator pipeline | Engineering | Yes |
| 9 | Build escalation queue + clinician review workflow | Engineering + Product | Before launch |
| 10 | Ratify Jeffrey Voice Layer spec against crisis and escalation phrasing requirements | Ron + Product + Clinical | Next |
| 11 | Draft Onboarding Flow spec | Ron + Claude | Next-2 |

### Immediate (next 72 hours)

1. **Sign the clinical review partner.** Nothing in this spec ships without licensed sign-off. This is the single highest-priority external dependency for the entire system.
2. **Decide the interaction database source.** Natural Medicines Comprehensive Database is recommended. Requires a license agreement.
3. **Decide the escalation workflow for v1.** Is it email-to-clinician? Dashboard queue? Third-party triage service? The 24h resolution target depends on this.

---

## 15. OPEN QUESTIONS

1. **Clinician dashboard scope** — is this a v1 feature, or do escalations go to email/phone for now? Recommend: email queue for v1, dashboard for v2.
2. **User consent for escalation** — when the system escalates, does the user's data go to a clinical reviewer? What consent is needed? HIPAA implications. Legal call.
3. **Liability framing** — Aissisted is a supplement company, not a medical provider. How is the safety system positioned legally? Disclaimer language. Legal call.
4. **Interaction database licensing** — Natural Medicines DB requires institutional license. Cost and timeline?
5. **Supplement-specific adverse event reporting** — does Aissisted report serious adverse events to the FDA (required for manufacturers)? If yes, how does this connect to Rule 7/10?
6. **International thresholds** — do lab reference ranges differ by country? v1 is US-only, but flagged for expansion.
7. **Rule expansion cadence** — how fast will the rule pack grow? 10 rules for v1, but v2 might need 30+. What's the governance bandwidth?

---

*End of spec. v1.1. — Runtime-aligned. Requires clinical sign-off before deployment.*
