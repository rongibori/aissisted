# JOURNAL & ANALYTICS — SPEC v1

**Status:** Draft for ratification.
**Owner:** Ron + Cowork (drafts) → engineering (Phase 2/3 implementation).
**Date:** 2026-04-30.
**Phase placement:** Phase 2 (basic structured journal + schema groundwork) → Phase 3 (voice-first journaling + Analytics v1) → Phase 4 (Analytics v2 with causal inference).
**Dependencies:** `BETA_LAUNCH_PLAN_v1`, `JEFFREY_VOICE_LAYER_SPEC` §11, `SECURITY_AND_COMPLIANCE_V1`, `LAB_INGESTION_SPEC` (forthcoming).

---

## 0. EXECUTIVE SUMMARY

The journal and the analytics aren't two features — they're **one product loop**, and that loop is the actual product. Everything else (eval suite, voice modal, onboarding, AWS infra) is plumbing for it.

**The loop:**

```
Jeffrey checks in (voice modal, ~60s)
      ↓
User reflects (journal: adherence + symptom + free-text)
      ↓
Wearable + lab + journal data fuse via canonical signal layer
      ↓
Analytics surfaces what's actually working (causal attribution per intervention)
      ↓
Jeffrey proposes 30-day protocol adjustment
      ↓
User adheres
      ↓
[cycle repeats]
```

**Strategic outcome:** the loop is the retention engine. DTC supplement attrition between months 3 and 6 is the industry's graveyard — users churn because they can't *feel* whether the protocol is working. The analytics + journal combo is the mirror that reflects results back to them. The voice modal makes daily journaling frictionless. The causal inference makes the analytics not just observational but explanatory.

**Strategic moat:** every other supplement company is selling SKUs. Aissisted is running an N-of-1 platform on top of a canonical data layer. WHOOP is uni-modal (wearable only). We are multi-modal — wearable + labs + journal + adherence + EHR — and that fusion enables analytics WHOOP structurally cannot build: lab biomarker overlay on biometric trends, protocol attribution with confidence scores, predictive forecasting, counterfactual sliders.

**Wearable strategy (locked per Ron):** WHOOP, Oura, Apple Watch are interchangeable signal sources at the data layer; some signals fuse across multiple devices when complementary. The user is never device-locked.

---

## 1. STRATEGIC FRAMING

### 1.1 Why this is the product, not a feature

Three observations drive the design:

1. **Subjective signal beats objective signal for retention.** Users don't churn because their HRV is flat — they churn because they don't *feel* different. The journal is where subjective change is captured; the analytics is where it's connected to the objective data so the user can finally see the pattern.

2. **Adherence data is the unlock for everything else.** Without knowing whether the user took the protocol, every analysis is a guess. The journal must capture adherence as a first-class signal, not a side feature.

3. **Causal inference requires labeled interventions.** Aissisted has a structural advantage no other supplement company has: every protocol change is a labeled, dated, controlled intervention. With pre/post windows + confounder adjustment, we can answer the only question that matters: *what's actually working for this user?* No competitor can answer this because they're not running the platform on the data layer.

### 1.2 What WHOOP can't do (the analytics differentiation surface)

| Surface | WHOOP | Oura | Apple | **Aissisted** |
|---|---|---|---|---|
| HRV / sleep / recovery trend | ✅ | ✅ | ✅ | ✅ Match |
| Behavior correlation (caffeine → sleep) | ✅ | partial | partial | ✅ Match |
| Population context | ✅ | ✅ | partial | ✅ Match (privacy-preserving) |
| **Lab biomarker timeline overlaid on biometric** | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Protocol attribution** ("Vitamin D is responsible for +12% recovery, 87% confidence") | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **N-of-1 causal inference per intervention** | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Predictive forecasting** ("expected HRV trajectory + lab movement at 30/60/90d") | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Counterfactual sliders** ("what if I'd stopped Vit D at week 6?") | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Compounding-effects timeline** (intervention layers + physiological response) | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Cross-device signal fusion** (Oura sleep + WHOOP strain + Apple HR) | ❌ | ❌ | ❌ | ✅ Aissisted only |
| **Brushable linked views** (zoom window → all panels re-aggregate) | ❌ | ❌ | ❌ | ✅ Aissisted only |

The single screen that defines the differentiation: **"What's actually working?"** — ingredient-level attribution with confidence scores, backed by the user's own response curves plus aggregated cohort data (privacy-preserving). No supplement company on Earth answers this question. Most can't even ask it.

---

## 2. WEARABLE SIGNAL-SOURCE ABSTRACTION (the foundation)

This is the architectural decision that unlocks everything downstream. Lock in Phase 2 or pay for it later.

### 2.1 The problem

Every device measures slightly different things with slightly different methodologies:

| Signal | WHOOP | Oura | Apple Watch | Comparable across? |
|---|---|---|---|---|
| Resting HR | overnight avg | overnight avg | overnight avg | Yes — directly |
| HRV | RMSSD, sleep window | RMSSD, full night | SDNN, intermittent | **Methodology differs** — needs normalization |
| Sleep stages | proprietary classifier | proprietary classifier | proprietary classifier | **No** — values not directly comparable, only trends |
| Recovery / Readiness | 0–100 proprietary | 0–100 proprietary | not native | **No** — different formulas |
| Strain / Load | 0–21 proprietary | activity score | active calories + exercise mins | **No** — different scales |
| Steps | yes | yes | yes | Yes — directly |
| Workout HR | yes (10s) | yes (1s) | yes (1s) | Yes — directly |
| SpO2 | overnight avg | variability | snapshot | **Methodology differs** |
| Body temp deviation | not native | yes (deviation from baseline) | yes (overnight deviation) | Yes — both deviation-from-baseline |
| Breathing rate | yes | yes | yes | Yes |
| Cycle tracking | no | yes | yes | Oura/Apple only |

Naive approach (WHOOP-only, or "just store raw data"): falls apart when user switches devices or connects multiple. Locks us into one vendor's API forever and breaks when they change methodology.

### 2.2 The architecture — canonical signal model + provenance

Three-layer abstraction:

```
[ Vendor APIs ]            ← WHOOP / Oura / Apple HealthKit
       ↓
[ signals_raw ]            ← TimescaleDB hypertable, source-native form, immutable
       ↓
[ Normalization workers ]  ← per-vendor adapters, methodology-aware
       ↓
[ signals_canonical ]      ← TimescaleDB hypertable, normalized + provenance + quality
       ↓
[ Analytics queries ]      ← always read from canonical
```

### 2.3 The canonical signal model

Every observation in `signals_canonical` has:

```typescript
interface CanonicalSignal {
  user_id: UUID;
  signal_type: CanonicalSignalType;     // enumerated below
  observed_at: Timestamp;                // when the measurement applies (not when ingested)
  ingested_at: Timestamp;                // when we received it
  window_start: Timestamp;               // for windowed metrics (e.g., overnight HRV)
  window_end: Timestamp;
  value_raw: number;                     // source-native value
  value_normalized: number;              // z-score against user's 30-day baseline
  unit: string;                          // ms, bpm, percent, count, etc.
  source: SignalSource;                  // 'whoop' | 'oura' | 'apple_health'
  source_methodology_hash: string;       // detect when vendor changes their algorithm
  quality_score: number;                 // 0..1, how confident in this measurement
  raw_observation_id: UUID;              // FK back to signals_raw for audit
}

type CanonicalSignalType =
  | 'hrv_rmssd_overnight_ms'
  | 'resting_hr_bpm'
  | 'sleep_total_min'
  | 'sleep_deep_min'
  | 'sleep_rem_min'
  | 'sleep_efficiency_pct'
  | 'recovery_score_0_100_normalized'   // see §2.5 for normalization
  | 'strain_load_normalized'             // see §2.5
  | 'spo2_overnight_avg_pct'
  | 'body_temp_deviation_celsius'
  | 'breathing_rate_overnight_avg'
  | 'steps_daily'
  | 'workout_avg_hr'
  | 'workout_duration_min'
  | 'workout_load_normalized';
```

### 2.4 Quality scoring

Quality reflects measurement confidence. Examples:
- WHOOP overnight HRV: quality 0.95 (continuous overnight, established methodology)
- Oura overnight HRV: quality 0.92 (continuous overnight, established methodology)
- Apple Watch HRV: quality 0.55 (intermittent samples, gaps, less reliable)
- WHOOP sleep stages: quality 0.75 (proprietary classifier, no ground truth, but consistent)
- Oura sleep stages: quality 0.78 (similar)
- Apple Watch sleep stages: quality 0.65 (less mature classifier)

Quality scores tuned over time as we collect ground-truth data (clinical sleep studies in cohort, etc.).

### 2.5 Cross-source fusion strategies

When the user has multiple devices connected, the analytics layer applies one of four strategies per signal:

| Strategy | When | Example |
|---|---|---|
| **Single best** | One source clearly higher quality | HRV: prefer WHOOP > Oura > Apple |
| **Average** | Multiple comparable sources, low disagreement | Resting HR: average WHOOP + Oura overnight values |
| **Weighted average by quality** | Multiple comparable, modest disagreement | Steps: WHOOP doesn't track, use Oura(0.9) + Apple(0.95) weighted |
| **Complement** | Sources cover different windows | Daytime HR: Apple Watch only; Overnight HR: WHOOP + Oura |
| **Reconcile + flag** | Significant disagreement | Sleep total: WHOOP says 7h, Apple says 8h15m → take higher quality + flag in metadata |

The strategy is signal-type specific and configurable per user (some users may opt to "always trust my Oura").

### 2.6 Methodology versioning

Vendors silently update their algorithms. WHOOP changed HRV calculation in 2023 and broke continuity for many users' historical data. We protect against this by hashing the methodology version per source per signal-type, so when a vendor change is detected we:

1. Flag affected user data with a `methodology_change` event
2. Re-normalize forward (don't retroactively rewrite history — preserve the audit trail)
3. Display a small "your [device] updated its measurement approach on [date]" annotation in the user's analytics timeline

### 2.7 Schema (Phase 2)

```sql
-- Source connection metadata
CREATE TABLE signal_sources (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL CHECK (provider IN ('whoop', 'oura', 'apple_health', 'epic_fhir')),
  oauth_access_token_encrypted BYTEA,
  oauth_refresh_token_encrypted BYTEA,
  connected_at TIMESTAMPTZ NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,              -- 'ok' | 'failed' | 'auth_expired'
  user_preferred_for JSONB,           -- override: { "hrv": "whoop", "sleep": "oura" }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw observations (immutable audit trail)
CREATE TABLE signals_raw (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES signal_sources(id),
  vendor_payload JSONB NOT NULL,      -- exact response from vendor API
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vendor_observed_at TIMESTAMPTZ NOT NULL,
  vendor_resource_type TEXT NOT NULL,
  vendor_resource_id TEXT NOT NULL,
  UNIQUE(source_id, vendor_resource_type, vendor_resource_id)
);
SELECT create_hypertable('signals_raw', 'ingested_at');

-- Canonical normalized observations
CREATE TABLE signals_canonical (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,           -- see CanonicalSignalType enum
  observed_at TIMESTAMPTZ NOT NULL,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  value_raw NUMERIC NOT NULL,
  value_normalized NUMERIC,
  unit TEXT NOT NULL,
  source TEXT NOT NULL,
  source_methodology_hash TEXT,
  quality_score NUMERIC NOT NULL CHECK (quality_score BETWEEN 0 AND 1),
  raw_observation_id UUID REFERENCES signals_raw(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('signals_canonical', 'observed_at');
CREATE INDEX ON signals_canonical (user_id, signal_type, observed_at DESC);
```

---

## 3. JOURNAL DATA MODEL

### 3.1 Entity overview

```
journal_entries (one per user per day)
   ├── adherence (structured tags, auto-prompted from protocol)
   ├── symptom_scores (5-8 sliders, 1-10)
   ├── notable_events (chip multi-select)
   ├── free_text (typed or transcribed from voice)
   ├── extracted_facts (NLP output from free_text)
   └── voice_audio_ref (S3 reference, configurable retention)
```

### 3.2 Journal entry schema

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  entry_date DATE NOT NULL,                    -- the day the entry refers to (not ingestion date)
  entry_window TEXT NOT NULL CHECK (entry_window IN ('morning', 'evening', 'ad-hoc')),
  captured_via TEXT NOT NULL CHECK (captured_via IN ('voice', 'text', 'chip-only')),
  duration_seconds INTEGER,                    -- how long the user spent in the modal
  free_text TEXT,
  voice_audio_s3_ref TEXT,                     -- nullable; raw audio purged per retention policy
  voice_transcript TEXT,                       -- always retained
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jeffrey_session_id UUID,                     -- link to the voice modal session if voice-captured
  UNIQUE(user_id, entry_date, entry_window)
);

CREATE TABLE journal_adherence (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  protocol_version INTEGER NOT NULL,           -- which protocol version was active
  stack_window TEXT NOT NULL CHECK (stack_window IN ('am', 'pm', 'with_meal', 'split')),
  status TEXT NOT NULL CHECK (status IN ('full', 'partial', 'skipped')),
  missed_ingredient_ids JSONB,                 -- array of ingredient IDs if partial
  reason TEXT                                  -- optional user-provided reason
);

CREATE TABLE journal_symptoms (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  symptom_key TEXT NOT NULL,                   -- 'energy' | 'mood' | 'sleep_subj' | 'brain_fog' | etc.
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  note TEXT
);

CREATE TABLE journal_events (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,                     -- 'training' | 'alcohol' | 'travel' | 'illness' | etc.
  intensity INTEGER,                           -- 1-10 if applicable (training, alcohol volume, etc.)
  note TEXT
);

CREATE TABLE journal_extracted_facts (
  id UUID PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  fact_kind TEXT NOT NULL,                     -- 'symptom' | 'event' | 'win' | 'concern' | 'question'
  fact_content TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  extracted_by TEXT NOT NULL                   -- 'openai-gpt-4o' or model id
);
```

### 3.3 Structured tag taxonomy

**Symptom scales (1–10, default 7 captured per entry):**
- `energy`
- `mood`
- `sleep_subj` — subjective sleep quality, distinct from wearable score
- `brain_fog` — inverse phrasing ("mental clarity") in UX, stored inverted
- `gi` — digestion / discomfort
- `soreness` — training-related
- `stress`
- `libido` — optional, user-toggleable

**Notable events (chip multi-select):**
- `training` (with intensity 1–10)
- `alcohol` (volume estimate: drinks)
- `travel` (timezone delta)
- `illness`
- `stressor_work` / `stressor_personal`
- `late_meal`
- `fasted_morning`
- `caffeine_after_2pm`
- `screen_late`
- `sex` (optional, user-toggleable)
- `meditation` / `breathwork`
- `cold_exposure` / `sauna`
- `nap`

The taxonomy is extensible per user (custom tags) and seeded from population data at signup.

### 3.4 Adherence as first-class signal

Every entry captures adherence per stack window. This is non-negotiable:

- Without adherence data, attribution is impossible
- A "missed PM stack 3x this week" is itself a clinically significant event
- Adherence streaks become user-visible (retention loop) but never gamified into shame patterns
- Partial adherence with the specific missed ingredient unlocks fine-grained attribution

---

## 4. VOICE-FIRST DAILY CHECK-IN INTERACTION

### 4.1 Trigger and surface

- **Surface:** the voice modal already specced in `CLAUDE_DESIGN_JEFFREY_VOICE_MODAL_PROMPTS.md` and `JEFFREY_VOICE_LAYER_SPEC`. No new visual primitives required.
- **Trigger:** morning push notification at user-configurable time (default 7:00 local, after typical wake). Tap → opens voice modal with `entry_window = 'morning'` context.
- **Backup trigger:** if morning entry not captured by 11:00 local, pre-load the modal on next app open.
- **Duration target:** 60–90s end-to-end. p50 ≤ 75s. Above this, abandon rate climbs steeply (per WHOOP Behaviors data plus first-principles).

### 4.2 Morning script (canonical)

```
00:00  Jeffrey: "Morning."                                      [200ms beat]
00:01  Jeffrey: "Did you take last night's stack?"
       UI: chips [Yes] [Partial] [Skipped]
       (~8s for user to tap)

00:09  Jeffrey: "And the morning stack today?"
       UI: chips [Yes] [Partial] [Skipped]
       (~6s)

00:15  Jeffrey: "How did yesterday feel?"
       UI: voice/text input, free-form
       (~25s for user to speak or type)

00:40  Jeffrey: [transcribe + extract via NLP, ~3s]
       Jeffrey: "I heard energy was lower in the afternoon, sleep
                felt heavy, you had wine with dinner. Anything I
                missed?"
       UI: chip [Got it] / button [Add detail]
       (~5s)

00:48  Jeffrey: "Talk soon."
       Modal closes. Entry persisted. Analytics updated within 5 min.
```

p95 target: 75s. p99 target: 110s.

### 4.3 Skip / fast-path patterns

If the user is in a rush or on-the-go, a fast-path:

- Tap-and-hold mic = "quick log" mode → 10s voice clip → Jeffrey extracts everything possible, skips reflection-back
- "Just yes" path: Jeffrey asks adherence questions, user answers, free-text auto-skipped → ~15s entry
- "Catch up" mode: if user missed yesterday, modal asks for yesterday + today separately

### 4.4 NLP extraction

Free-text → structured facts via OpenAI canonical brain (Phase 3 has BAA executed).

Extraction targets per entry:
- Symptom scores (mapped to 1–10 from prose: "energy was rough this afternoon" → energy: 4, time-window: afternoon)
- Notable events (from prose: "wine with dinner" → alcohol event, intensity ~4)
- Wins (positive observations: "first morning in weeks I felt clear waking up")
- Concerns (negative observations or worsening trends)
- Questions (user-directed: "is the magnesium making me groggy?")

All extractions stored with `confidence` score. Below 0.6 confidence: not auto-applied; surfaced to user as "did I read this right?" the next day.

### 4.5 Reflection-back as quality control

The "Anything I missed?" beat is critical. It's where the user trusts (or doesn't) that Jeffrey heard them. If extractions are wrong, user corrects. If right, the loop strengthens.

This is also the brand-voice moment — Jeffrey paraphrasing in butler-cadence register, not regurgitating chips. Per Voice Layer Spec §8.1.

### 4.6 Day-end / pre-sleep alternative

Some users prefer pre-sleep reflection. Mode toggle in settings:
- **Morning-led** (default): adherence + yesterday's reflection at 7am
- **Evening-led**: adherence + today's reflection at 9pm; morning push only for AM stack confirmation
- **Both**: lighter morning (adherence-only) + fuller evening (reflection)

Same data model; different orchestration.

### 4.7 Adherence ad-hoc check-ins

Optional (user enables in settings):
- AM stack time + 30 min: silent push "Took your AM stack? Tap yes/no"
- PM stack time + 30 min: same
- These are ~5s interactions, separate from the daily reflection. Reduces reliance on next-morning recall.

---

## 5. ANALYTICS SURFACE ARCHITECTURE

Three layers, each a distinct surface tier:

### 5.1 Reflection layer — what just happened (today)

The user's home screen post-onboarding. Loads in <500ms.

- **Today's score** — composite (recovery + adherence + subjective). Single number 0–100. Color: white/graphite/aqua per system.
- **Last night's sleep** — total + stages bar, side-by-side with the user's 30-day average
- **Yesterday's adherence** — full / partial / skipped, with missed items if partial
- **Yesterday's journal summary** — Jeffrey's one-line read on the day
- **Today's plan** — protocol stack with check-off chips (AM done, PM pending)
- **Jeffrey's read** — one paragraph of contextual narrative ("HRV is up 8% over the past week, in line with the magnesium ramp; afternoon energy still flagged 4 of last 5 days, watching")

### 5.2 Trend layer — what's been happening (rolling windows)

Switchable 7d / 30d / 90d / all-time. Renders in <1s for 30d window.

- **HRV / sleep / recovery** trend lines with population context band (10th–90th percentile of comparable cohort)
- **Biomarker timeline** — lab results plotted on the same timeline as biometrics (most companies hide this in PDFs; we put it on the main canvas)
- **Symptom heatmap** — Y axis: symptom keys; X axis: dates; cell color: severity. Spots patterns ("brain fog clusters every 4-5 days")
- **Adherence streak + calendar** — green/yellow/red day grid
- **Intervention markers** — vertical lines on every protocol change, every lab draw, every notable event. Hover for context.

Brushable timeline mandatory: drag to zoom into a window → all panels filter to that window.

### 5.3 Causal layer — what's actually working (interventions)

The differentiation surface. The "What's actually working?" screen. Available after ≥21 days of data.

Three panels:

**Panel A — Per-intervention attribution**
For each protocol ingredient, table row:
- Ingredient name + dose + start date
- Pre-window mean (e.g., HRV mean for 21d before)
- Post-window mean (HRV mean for 21d after, controlling for confounders)
- Effect size (Cohen's d) + 95% CI via bootstrap
- Confidence label: high (CI excludes 0, n≥30 days) / moderate (CI excludes 0, n=14-29) / low (CI overlaps 0 OR n<14)
- One-line explanation: "Vitamin D 2000 IU is responsible for an estimated +8% in overnight HRV (95% CI 3–14%), based on 28 days post-start. Cohort prior also positive."

**Panel B — Counterfactual sliders**
Interactive: "What if I'd stopped Vitamin D at week 6?" → model rough estimate of HRV trajectory under counterfactual. Uses synthetic-control-like approach (similar users who stopped at that point).

**Panel C — Predictive forecast**
"If you continue current protocol for the next 30 days, expected HRV trajectory: gentle upward, expected lab marker movement at next draw: Vit D from 28 → 38–44 ng/mL." With confidence bands.

### 5.4 Visualization tech stack

| Surface | Tool | Why |
|---|---|---|
| Simple trend lines (HRV, RHR over time) | Recharts | Cheap, fits existing stack |
| Brushable + linked timelines | **D3.js** or **Observable Plot** | Recharts can't do brush + linked-views well |
| Symptom heatmap | D3 (custom cell grid) | Bespoke |
| Counterfactual sliders | Plotly or D3 | Interactive |
| Sparklines on tile cards | tiny inline SVG | Lightweight |

**Recommendation: Observable Plot for primary canvas + D3 for one-off bespoke views.** Observable Plot has the brush + linked-views ergonomics natively; D3 is the escape hatch.

### 5.5 Performance targets

- Reflection layer load: <500ms (cached)
- Trend layer load: <1s for 30d, <2.5s for 90d, <5s for all-time
- Causal layer load: <2s (heavier compute)
- Re-aggregation on brush: <250ms
- All numbers measured at p95

Underlying queries against `signals_canonical` (TimescaleDB) with continuous aggregates pre-computed for daily / weekly windows.

---

## 6. CAUSAL INFERENCE APPROACH

This is the technical core of the analytics differentiation. Treat it as a research-grade subsystem.

### 6.1 Framing

Each protocol change is a labeled, dated, controlled intervention:

```typescript
interface Intervention {
  id: UUID;
  user_id: UUID;
  ingredient_id: string;
  action: 'started' | 'stopped' | 'dose_changed' | 'paused';
  prev_dose: number | null;
  new_dose: number | null;
  unit: string;
  timing: 'am' | 'pm' | 'split' | 'with_meal';
  reason: string;                    // jeffrey-tagged ('user-requested' | 'lab-driven' | 'cohort-evidence' | etc.)
  started_at: Timestamp;
  ended_at: Timestamp | null;
  protocol_version_before: number;
  protocol_version_after: number;
}
```

Persisted in an `interventions` table. Every protocol change writes a row. This is the substrate for everything.

### 6.2 N-of-1 framework

**Inputs per attribution query:**
- Intervention (which ingredient, which window)
- Outcome variable (HRV, sleep, biomarker, symptom score)
- Pre-window and post-window definitions (default: 21 days each)
- Confounders to control for (training load, alcohol, travel, illness, season)

**Method:**
1. Fit a baseline model on pre-window data: outcome ~ time + confounders
2. Project the baseline forward into the post-window (counterfactual: "what would have happened without the intervention?")
3. Compute residuals: actual_post - projected_post
4. Effect size = mean(residuals) / pooled SD
5. Confidence interval via wild bootstrap (1000 resamples)
6. Confidence label per CI properties (see §5.3 Panel A)

**Tools:** Python service via Pyodide-in-browser for client-side speed (small datasets) OR backend Python service with FastAPI (larger users with multi-year data). DoWhy + EconML for the causal estimators. statsmodels for the regression baselines.

### 6.3 Cohort prior + Bayesian update

For users with limited personal data (<21 days), augment with cohort:

- Compute cohort mean effect size for same intervention (privacy-preserving, k-anonymity ≥ 20)
- Bayesian update: cohort prior + user-specific likelihood = posterior
- Display: "Your data alone is too thin to attribute confidently (n=12 days). Across 240 similar users on Vitamin D 2000 IU, average effect was +6% (95% CI 3-9%). Your data leans similar; we'll firm this up by [date when n≥21]."

### 6.4 Confounder catalog

The key confounders we control for explicitly:

| Confounder | Source | Effect on |
|---|---|---|
| Alcohol | journal events | HRV (negative), sleep (negative), recovery (negative) |
| Training intensity | wearable strain/load | HRV (acutely negative, chronically positive) |
| Travel timezone delta | journal events | sleep, HRV, recovery |
| Illness | journal events | everything |
| Season | derived from date | Vit D levels, mood, energy |
| Stressor (work/personal) | journal events | HRV, sleep |
| Late meals | journal events | sleep, RHR |
| Caffeine after 2pm | journal events | sleep, HRV |

Without journal data, none of these can be controlled for. The journal is the confounder dataset.

### 6.5 Ethical / scientific guardrails

- **Always show confidence**, never present effect size alone
- **Never claim causation beyond what the data supports** — wording is always "is associated with" or "is likely responsible for an estimated X" with CI
- **User can mark a window as "don't include"** (e.g., they were sick that whole week) — re-runs the analysis excluding it
- **No fishing** — predefined outcome variables, not "we found something significant in 14 outcomes"
- **Display methodology in plain language** in an info-tooltip on every causal panel
- **Lab-drawn deltas always come with the ref-range context**, not just the change

### 6.6 What we cannot claim (responsibly)

- "This supplement caused X" — we say "associated with" or "estimated effect"
- Disease prevention or treatment claims (regulatory)
- Comparative claims vs other products without head-to-head data
- Anything that crosses from wellness into medical-advice territory triggers Jeffrey's clinician-handoff path (per `SAFETY_RULE_PACK`)

---

## 7. THE "WHAT'S ACTUALLY WORKING?" SCREEN — design direction

This is the screen that becomes the moment the user understands what they're paying for. It's where retention is won.

### 7.1 Visual register

System-aligned per `aissisted-system.html`:
- Phone-frame mockup (mobile-first; web view becomes a wider canvas of the same primitives)
- Headline: "What's actually working." in Briston Bold 32px graphite
- Pre-headline label: "ATTRIBUTION · LAST 30 DAYS" in Plex Mono micro
- The word "working" can render in Aqua to honor the system pattern (data emphasis)
- No icons. Geometric markers per data layer style.

### 7.2 Layout

**Top section — the headline answer**
A single sentence in Briston Bold 24px:
> "Three things are pulling their weight. One isn't."

**Middle section — the table**
Each row = one ingredient. Columns:
- Ingredient name (body sans 16px graphite)
- Visual: a horizontal bar in Aqua (positive effect) or graphite (no effect) — width proportional to effect size, anchored to a center zero line
- Effect summary: "+8% recovery, 87% confidence" in Plex Mono 12px
- "Why?" link in Plex Mono 11px Aqua underlined

Sort: highest-confidence positive at top, lowest / negative at bottom.

**Bottom section — the recommendation**
Jeffrey's one-paragraph read in body sans 15px graphite at 80%:
> "Magnesium and Vitamin D are pulling weight; we'll keep both. Ashwagandha hasn't moved your numbers — recommend dropping it next cycle and trying [alternative] in its place. Pulled this from 28 days of overnight HRV plus your morning energy logs."

CTA: "Apply changes →" rounded pill (filled graphite, white text). Tap → opens protocol diff view (separate spec).

### 7.3 The "Why?" tap interaction

Each ingredient row's "Why?" link expands an inline drill-down:
- Pre/post window means with the actual numbers
- The HRV chart for that window with the intervention vertical-line marker
- Confounders that were controlled for
- Cohort context
- Methodology note

This is where the institutional credibility lands. We show the work. Users (especially the high-trust user we're targeting) will reward transparency.

### 7.4 Data-thin state

If the user has <21 days of post-intervention data on any ingredient:
- That row shows an aqua progress dot ("8 of 21 days") instead of an effect bar
- Plex Mono micro-text: "FIRMING UP — CHECK BACK [DATE]"
- Jeffrey's read explains: "Three of your ingredients are still inside the analysis window; full attribution available [date]."

---

## 8. PHASE 2 SCHEMA GROUNDWORK (the non-negotiables)

To enable Phase 3-4 analytics without rework, lock these in Phase 2:

1. **`signal_sources`** table — wearable connection metadata (created above)
2. **`signals_raw`** TimescaleDB hypertable — immutable vendor payload audit (created above)
3. **`signals_canonical`** TimescaleDB hypertable — normalized + provenance + quality (created above)
4. **`journal_entries`** + `journal_adherence` + `journal_symptoms` + `journal_events` + `journal_extracted_facts` (created above)
5. **`interventions`** table — every protocol change as a labeled event (§6.1)
6. **`lab_results`** + **`lab_biomarkers`** — already in lab-ingestion spec
7. **Continuous aggregates** in TimescaleDB — pre-computed daily/weekly rollups for trend layer performance

**Cost:** ~3 days of Phase 2 schema design and migration work.
**Payback:** unblocks ~6 weeks of Phase 3-4 analytics work.

---

## 9. TECH STACK DECISIONS

| Layer | Choice | Rationale |
|---|---|---|
| Time-series storage | **TimescaleDB on Postgres** | Stays inside existing PG stack; hypertables + continuous aggregates handle wearable data scale; HIPAA-eligible on AWS RDS |
| Vendor adapters | **Per-vendor TypeScript modules** in `packages/wearables/` | Pluggable; new sources without core changes |
| Sync workers | **BullMQ on Redis** | Background jobs for OAuth refresh + periodic sync + webhook ingestion |
| Causal inference | **Python service** (FastAPI) with **DoWhy + EconML + statsmodels** | Industry-standard causal stack; not native to TS/Node ecosystem |
| Forecasting | **Prophet** for trend, **Bayesian state-space (PyMC)** for short-horizon | Different tools for different horizons |
| Frontend viz | **Observable Plot** primary + **D3** escape hatch | Brush + linked views native; D3 for bespoke (heatmap, counterfactual slider) |
| NLP extraction | **OpenAI canonical brain** (Enterprise BAA, Phase 4) | Already the agreed brain; structured output mode |
| Voice transcription | **OpenAI Whisper** (or Deepgram if latency-sensitive) | Whisper-via-OpenAI keeps single vendor; Deepgram if Whisper streaming proves laggy |

**Net new services to add to architecture:**
1. `services/wearable-sync` — Node worker for OAuth + polling + webhook ingestion
2. `services/causal-inference` — Python FastAPI for analytics queries
3. `services/journal-extraction` — Node worker that calls OpenAI for free-text → structured facts post-entry-write

Existing architecture (`apps/api`, `apps/web`, `apps/site`, `packages/jeffrey`, `packages/jeffrey-evals`, `packages/db`) remains untouched. New services slot in alongside.

---

## 10. PRIVACY + HIPAA IMPLICATIONS

Journal entries (text + voice audio + extracted facts) and wearable data tied to identifiable user = PHI. Standard PHI handling per `SECURITY_AND_COMPLIANCE_V1` applies, plus journal-specific items:

| Concern | Mitigation |
|---|---|
| Voice audio storage | KMS-encrypted S3 bucket tagged `data-class=phi`; default 30-day raw audio retention (transcript retained longer per user pref); user can purge anytime |
| OpenAI exposure of journal text | Phase 4 OpenAI Enterprise BAA covers this; until then, no journal NLP extraction routed through OpenAI on production data |
| Wearable OAuth tokens | Secrets Manager + KMS CMK; per-source rotation policy |
| Cohort augmentation queries | k-anonymity ≥ 20 enforced at query layer; differential privacy noise on aggregate effect sizes for very small subgroups |
| User right-to-erasure | DELETE cascades through journal_*, signals_canonical, signals_raw (raw retained as anonymized aggregate per HIPAA de-identification standard); audit log retains the deletion event for compliance |
| User right-to-amend | Journal entries editable for 24h after creation; after that, amendments tracked as new rows with `amends_id` FK so the audit trail is preserved |
| Causal inference on PHI | Computation runs inside our HIPAA-eligible AWS account; no PHI ever leaves the boundary |

**Net new BAA / DPA work:** none beyond Phase 4 plan — OpenAI Enterprise BAA covers extraction; wearables vendors' DPAs already standard for fitness data; ElevenLabs sees only Jeffrey's spoken responses (rephrased to avoid embedded biomarker values per `JEFFREY_VOICE_LAYER_SPEC` §11 PHI redaction guidance).

---

## 11. SEQUENCING — phase mapping

| Phase | Window | Deliverables | Why this order |
|---|---|---|---|
| **Phase 1** | Now → wk 2 | AWS infra, observability, CI gates | Plumbing must work first |
| **Phase 2** | Wk 3–6 | Lab ingestion, **wearable adapter framework + canonical signal layer**, **basic structured journal (chip + symptom + free-text typed entry, ~30s)**, intervention table, schema groundwork above | Get the data flowing into the right schema; journal MVP is text-first, voice deferred |
| **Phase 3** | Wk 7–10 | Agent layer, adaptive protocol tuning, **voice-first journaling (Jeffrey daily check-in via voice modal)**, **Analytics v1 (reflection + trend layers, no causal yet)** | Voice modal already built; now make it the daily-use surface. Reflection + trend show the user the result. |
| **Phase 4** | Wk 11–14 | HIPAA, Stripe, admin, **Analytics v2 (causal layer, "What's actually working?", counterfactual sliders, predictive forecast)** | The differentiation feature ships after compliance is locked |

**The journal is built progressively:**
- Phase 2: text-first MVP, structured tags only, ~30s entry, post-onboarding check-in surface
- Phase 3: voice-first via Jeffrey, full extraction pipeline, ~60-90s entry
- Phase 4: refinement, fast-path patterns, integration with causal inference

**The analytics is built progressively:**
- Phase 3 v1: reflection + trend layers, single-source biometric trends, lab biomarker overlay (no causal)
- Phase 4 v2: causal layer, the "What's actually working?" screen, predictive forecast, counterfactual sliders, brushable linked views

---

## 12. OPEN QUESTIONS

1. **Pre-Phase-4 OpenAI access for journal extraction.** Phase 4 secures Enterprise BAA. Phase 3 uses voice journal but extraction needs OpenAI. Two paths: (a) defer extraction until BAA; rely on chip + symptom + adherence (rich enough for Phase 3 analytics v1); (b) negotiate early Enterprise BAA. **Recommend (a)** — keeps Phase 3 timeline clean and v1 analytics doesn't strictly need NLP'd free-text.

2. **Cohort size for k-anonymity.** Beta launch is ~200 users. K=20 means many subgroup queries become unviable initially. Two paths: (a) wait until cohort ≥1000 before exposing causal panels with cohort augmentation; (b) ship causal panels with personal-only attribution at first, layer cohort prior in post-launch. **Recommend (b)** — value is in the personal attribution; cohort prior is icing.

3. **Wearable adapter scope at beta.** WHOOP + Oura + Apple Health is 3 integrations. WHOOP webhook + Oura polling + Apple HealthKit (iOS native bridge required) is heterogeneous. Three paths: (a) all three at beta; (b) start with WHOOP only, Oura at +30d, Apple at +60d; (c) start with WHOOP + Oura, defer Apple to v1.1. **Recommend (c)** — Apple HealthKit requires iOS native shell which Phase 4's "defer iOS to post-launch" decision implies isn't ready at beta. WHOOP + Oura covers ~70% of the target user data signals.

4. **Pricing sensitivity to journal depth.** $149/mo positioning supports the institutional register, but is the journal-and-analytics enough perceived value at that price? Or do we need to surface lab-draw cadence + clinician-review gate to lock in the price? **Recommend** lab cadence stays in the bundle (4× / year baseline draws); clinician-on-call decision is separate per regulatory + legal advice in Phase 4.

5. **Counterfactual slider scope at v2.** The "what if I'd stopped Vit D at week 6?" slider is technically demanding (synthetic-control approach). Two paths: (a) ship it at v2 with a "preview / experimental" label; (b) defer to v2.1 post-beta. **Recommend (a)** — the slider IS the magic moment; "preview" label gives us cover for early roughness.

---

## 13. NEXT STEPS

1. **Ratify this spec** (Ron). Sign-off triggers schema work in Phase 2.
2. **Add to `BETA_LAUNCH_PLAN_v1`** — fold journal + analytics deliverables into the phase tables, update §6 decisions matrix with §12 answers.
3. **Update `LAB_INGESTION_SPEC` (forthcoming)** — fold the canonical signal layer into shared spec; lab is one signal type among many, not its own architecture.
4. **Spec `aissisted-analytics.html` Claude Design prompt sequence** — the WHOOP-beating analytics surface (~10-12 prompts, system-aligned, post-onboarding paste queue).
5. **Spec the journal entry surface for Phase 2 MVP** — single Claude Design prompt sequence for the text-first journal entry (`aissisted-journal-entry.html`).
6. **Engineering scope ticket** — wearable adapter framework + canonical signal layer + journal schema migration. Estimate ~2 weeks for a single engineer.
7. **Causal inference service spike** — 3-day investigation of DoWhy/EconML on a synthetic dataset to validate the Python service architecture.

---

## 14. CHANGELOG

| Date | Change | By |
|---|---|---|
| 2026-04-30 | v1 draft. Strategic loop framing locked. Multi-source wearable abstraction locked. Three-layer analytics architecture locked. N-of-1 causal framework. Phase 2 schema groundwork enumerated. | Cowork |
