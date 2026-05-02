# LAB INGESTION — SPEC v1

**Status:** Draft for ratification.
**Owner:** Ron + Cowork (drafts) → engineering (Phase 2 implementation).
**Date:** 2026-04-30.
**Phase placement:** Phase 2 (LabCorp + Quest PDF ingestion + biomarker normalization + canonical signal layer integration).
**Dependencies:** `JOURNAL_AND_ANALYTICS_SPEC_V1` (canonical signal architecture), `BETA_LAUNCH_PLAN_v2`, `SECURITY_AND_COMPLIANCE_V1`.

---

## 0. EXECUTIVE SUMMARY

Lab data is one signal type among many in the canonical signal layer (per `JOURNAL_AND_ANALYTICS_SPEC` §2). This spec covers the lab-specific ingestion pipeline: how a LabCorp or Quest PDF becomes structured biomarker observations sitting in `lab_biomarkers`, then projected into `signals_canonical` for the analytics layer.

**Why labs matter to the product loop:**

- Labs are the **objective ground truth** for biomarker movement. Journal captures subjective; wearables capture autonomic; labs capture biochemistry.
- Lab biomarker overlay on biometric trends is one of the analytics differentiators WHOOP cannot build (WHOOP doesn't see labs at all).
- Each lab draw is a measurement event that anchors causal attribution windows ("between this draw and the next, Vit D moved from 22 → 38 ng/mL — controlled for the only protocol change in the window, this is high-confidence attribution").
- 4× / year baseline draws are in the $149/mo bundle (per BLP §6 Decision #13). The ingestion pipeline must handle the cadence reliably or the bundled feature breaks.

**Key design decisions in this spec:**

1. **Two-stage ingestion**: PDF → structured biomarker rows (lab-specific) → canonical signal rows (uniform with wearable signals). Lab is NOT a separate analytics stack.
2. **OCR + structured extraction with confidence scoring**. Two providers (LabCorp + Quest) at beta; extensible to others post-launch.
3. **Reference range normalization is critical**. Raw values mean nothing without ref-range context. Every biomarker observation carries its lab's claimed ref-range AND a normalized z-score against population norms.
4. **Manual override / amend path**. OCR will mis-read sometimes. User must be able to correct values without going through engineering.
5. **PHI handling at every step**. PDF in S3 is PHI. Extracted values are PHI. Audit log is mandatory.

---

## 1. SCOPE

### 1.1 In scope (Phase 2)

- **LabCorp PDF ingestion**: covers ~60% of the US private-pay lab market and most direct-to-consumer panels (Marek Health, InsideTracker via LabCorp partner labs, Function Health subset)
- **Quest Diagnostics PDF ingestion**: covers most of the remaining major private-pay segment
- **~80 core biomarkers** in the initial reference catalog (see §3.4)
- **Manual upload flow** — user uploads PDF in onboarding step 4 or anytime via labs view
- **Manual review / amend UI** — user can correct OCR misreads
- **Reference range normalization** with both lab-claimed range AND population z-score
- **Canonical signal layer projection** — every biomarker observation gets a `signals_canonical` row with type `lab_biomarker_<key>_normalized`
- **Audit log** — every read/write of lab data tracked
- **Voluntary skip path** — labs are optional at onboarding (per onboarding spec)

### 1.2 Out of scope (deferred to v1.1+)

- Direct LabCorp / Quest API integration (requires medical-provider authorization workflows; v1.1)
- Third-party DTC labs beyond LabCorp / Quest (Marek, Function, InsideTracker as native — they all currently route through LabCorp / Quest underneath, so PDF approach covers them)
- Genetic data (23andMe, Ancestry) — separate spec, separate handling, not in beta
- Microbiome data (Viome, Tiny Health) — separate spec, not in beta
- Continuous Glucose Monitoring (CGM) — wearable signal type, handled in `JOURNAL_AND_ANALYTICS_SPEC` wearable layer
- HRV / inflammation panel ordering on user's behalf — clinical service tier, post-Phase-4

### 1.3 Out of scope (always)

- Diagnostic claims based on biomarkers (regulatory; we surface trends + ref-range context, never a diagnosis)
- Disease prediction or risk scoring beyond what the lab itself reports
- Replacing a clinician's interpretation

---

## 2. INGESTION PIPELINE — END-TO-END

### 2.1 Pipeline stages

```
[ User uploads PDF ]
         ↓
[ S3 PHI bucket ]            ← KMS-encrypted, audit-logged
         ↓
[ Pipeline trigger ]         ← BullMQ job
         ↓
[ Stage 1: OCR ]             ← AWS Textract (HIPAA-eligible) — extracts text + table layout
         ↓
[ Stage 2: Lab detector ]    ← detects LabCorp vs Quest vs unknown by header + layout
         ↓
[ Stage 3: Parser ]          ← lab-specific parser extracts biomarker rows
         ↓
[ Stage 4: Normalizer ]      ← maps lab-claimed metric names to canonical biomarker keys
         ↓
[ Stage 5: Validator ]       ← unit checks, ref-range sanity, confidence scoring
         ↓
[ lab_results + lab_biomarkers ]   ← persisted with confidence < threshold flagged for review
         ↓
[ Canonical signal projection ]    ← signals_canonical rows for analytics
         ↓
[ User review surface ]      ← if any rows below confidence threshold, prompt user to confirm
```

### 2.2 Trigger

Three trigger paths:

1. **Onboarding step 4** (per `CLAUDE_DESIGN_ONBOARDING_PROMPTS_V2 §Surface 5`): user drops PDF in upload zone → file uploads to S3 → BullMQ ingestion job enqueued
2. **Labs view** (`apps/web/app/labs`): existing route gets an upload affordance; same backend path
3. **Email forwarding** (post-MVP, deferred): user forwards lab PDF to `labs@aissisted.me` → email parser extracts attachment → same pipeline. Deferred to v1.1.

### 2.3 OCR provider — AWS Textract

**Why Textract:**
- HIPAA-eligible service under our existing AWS BAA (per BLP §3 Phase 1 infra plan)
- Native table extraction (lab PDFs are heavily tabular)
- Confidence scores on every extracted cell
- Stays inside the AWS PHI boundary (no third-party data transfer)
- ~$0.015 / page; typical lab PDF is 3-5 pages → ~$0.05-0.08 per ingestion

**Alternatives considered:**
- Google Document AI — better at handwritten / messy PDFs but requires a separate BAA and pulls PHI outside AWS boundary
- Azure Form Recognizer — comparable to Textract; rejected to avoid Azure footprint (we have no other Azure dependency)
- Tesseract self-hosted — free, but lab PDFs need table extraction and Tesseract requires layered preprocessing for that. Engineering cost not worth it at our scale.
- OpenAI vision (GPT-4o multimodal) — works well but expensive at scale (~$0.50+ per PDF), and overkill for what's mostly structured tabular data

**Decision: AWS Textract for Phase 2.** Re-evaluate at 1000+ users.

### 2.4 Lab detector

Simple rule-based classifier on the first page text:

- Contains "LabCorp" header pattern → LabCorp parser
- Contains "Quest Diagnostics" header pattern → Quest parser
- Neither → mark as `unknown_lab`, persist raw OCR, surface to user as "we don't recognize this lab format yet — manual entry?"

Confidence ≥ 0.95 required to route to a parser. Below that, treat as unknown.

### 2.5 Lab-specific parsers

Each lab has a quirky-but-stable PDF format. Per-lab parser handles:

- Page layout (header / patient info / results section / reference info)
- Test name normalization (LabCorp calls it "VITAMIN D, 25-HYDROXY" while Quest calls it "Vitamin D, 25-Hydroxy")
- Result column extraction (value + unit + flag + ref-range)
- Date of draw extraction
- Out-of-range flag interpretation (H, L, HH, LL, A — abnormal)

Each parser implemented as a TypeScript module under `packages/lab-ingestion/src/parsers/`:
- `parsers/labcorp.ts`
- `parsers/quest.ts`
- `parsers/unknown.ts` (best-effort, surfaces all ambiguity to user)

### 2.6 Normalizer — canonical biomarker keys

Lab-specific test names → canonical keys via a normalization map (`packages/lab-ingestion/src/canonical-biomarkers.ts`):

```typescript
const NORMALIZATION_MAP: Record<string, CanonicalBiomarkerKey> = {
  // LabCorp variants
  'VITAMIN D, 25-HYDROXY': 'vitamin_d_25_oh',
  'VITAMIN D, 25-OH, TOTAL': 'vitamin_d_25_oh',
  'VITAMIN D 25-HYDROXY': 'vitamin_d_25_oh',
  // Quest variants
  'Vitamin D, 25-Hydroxy': 'vitamin_d_25_oh',
  'Vitamin D, 25-OH, Total': 'vitamin_d_25_oh',
  // ... ~80 biomarkers × ~3-5 variants each = ~300 entries
};
```

Maintained by hand for the initial 80; extensible via a config file engineering can update without code changes.

### 2.7 Validator + confidence scoring

Per biomarker observation, three validation gates:

1. **OCR confidence**: Textract per-cell confidence ≥ 0.92 → pass; below → flag
2. **Unit sanity**: extracted unit matches expected unit for that biomarker (Vit D in ng/mL, not mg/dL — would be 100x error). Mismatch → flag.
3. **Range sanity**: extracted value is within physiological plausibility (e.g., serum sodium 100-200 mmol/L; below 100 or above 200 = OCR error). Out of plausibility → flag.

**Confidence label per row:**
- All three gates pass + Textract conf ≥ 0.95 → `auto_confirmed`
- All three gates pass + Textract conf 0.92-0.95 → `auto_confirmed_low_conf` (persisted but surfaced for user review on next session)
- Any gate fails → `pending_review` (persisted but NOT projected to canonical signals until user confirms)

### 2.8 Canonical signal projection

Every `auto_confirmed` lab observation generates a `signals_canonical` row:

```typescript
{
  user_id: <user>,
  signal_type: `lab_${canonical_biomarker_key}_normalized`,
  observed_at: <draw_date>,
  window_start: <draw_date>,
  window_end: <draw_date>,
  value_raw: <observed_value>,
  value_normalized: <z_score_against_population_or_user_baseline>,
  unit: <canonical_unit>,
  source: `lab_${lab_provider}`,           // 'lab_labcorp' | 'lab_quest'
  source_methodology_hash: <ref_range_hash>,
  quality_score: <0.92..1.0 based on OCR + validation>,
  raw_observation_id: <lab_biomarker.id>
}
```

This makes labs analytics-equivalent to wearable signals — same querying patterns, same trend rendering, same causal attribution machinery.

### 2.9 User review surface

When ingestion completes, two paths:

- **All rows `auto_confirmed`**: Jeffrey sends a soft notification — "Your latest panel is in. Three markers moved." with a link to the labs view.
- **Any row `pending_review`**: Jeffrey sends a clarifying message — "Your latest panel is mostly in. Two values need a quick confirm — they came in at the edges." with a link that opens an inline review surface.

Inline review surface (Phase 2 minimal, Phase 3 polished):
- Side-by-side: PDF page snippet showing the row + extracted value + manual-edit input
- Confirm / Edit / Skip per row
- Bulk-confirm if all look right at a glance

---

## 3. SCHEMA

### 3.1 Tables (Phase 2)

```sql
-- The lab_results table — one row per lab draw / panel ingestion
CREATE TABLE lab_results (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  lab_provider TEXT NOT NULL CHECK (lab_provider IN ('labcorp', 'quest', 'unknown')),
  draw_date DATE NOT NULL,
  ordering_provider TEXT,                  -- nullable; doctor / DTC service who ordered
  source_pdf_s3_ref TEXT NOT NULL,         -- S3 key, KMS-encrypted bucket
  source_pdf_filename TEXT NOT NULL,
  ocr_status TEXT NOT NULL CHECK (ocr_status IN ('pending', 'processing', 'complete', 'failed')),
  ocr_confidence_overall NUMERIC,          -- 0..1
  parser_used TEXT,                        -- 'labcorp' | 'quest' | 'unknown'
  parser_version TEXT,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  review_status TEXT CHECK (review_status IN ('not_required', 'pending', 'confirmed', 'amended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per biomarker observation in the panel
CREATE TABLE lab_biomarkers (
  id UUID PRIMARY KEY,
  lab_result_id UUID NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,                   -- denormalized for query speed
  canonical_key TEXT NOT NULL,             -- 'vitamin_d_25_oh', 'tsh', 'ferritin', etc.
  display_name TEXT NOT NULL,              -- as shown in the lab PDF
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,                      -- canonical unit after normalization
  ref_range_low NUMERIC,                   -- as claimed by the lab
  ref_range_high NUMERIC,
  flag TEXT CHECK (flag IN ('normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal')),
  z_score_population NUMERIC,              -- standardized against population norms (optional, post-MVP)
  ocr_confidence NUMERIC NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('auto_confirmed', 'auto_confirmed_low_conf', 'pending_review', 'rejected')),
  user_amended BOOLEAN NOT NULL DEFAULT FALSE,
  user_amended_at TIMESTAMPTZ,
  user_amended_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON lab_biomarkers (user_id, canonical_key);
CREATE INDEX ON lab_biomarkers (lab_result_id);
CREATE INDEX ON lab_biomarkers (user_id, validation_status) WHERE validation_status IN ('pending_review', 'auto_confirmed_low_conf');
```

### 3.2 Canonical biomarker catalog (Phase 2 launch — 80 biomarkers)

Organized by panel domain. Each canonical key maps to a clinical category, expected unit, and typical population reference range.

**Metabolic (10):**
- `glucose_fasting` (mg/dL)
- `hba1c` (%)
- `insulin_fasting` (μIU/mL)
- `homa_ir` (ratio, derived)
- `triglycerides` (mg/dL)
- `cholesterol_total` (mg/dL)
- `ldl_c` (mg/dL)
- `hdl_c` (mg/dL)
- `non_hdl_c` (mg/dL)
- `apo_b` (mg/dL)

**Inflammation (6):**
- `hs_crp` (mg/L)
- `crp` (mg/L)
- `homocysteine` (μmol/L)
- `fibrinogen` (mg/dL)
- `wbc` (10³/μL)
- `neutrophil_lymphocyte_ratio` (ratio)

**Hormones (16):**
- `tsh` (μIU/mL)
- `free_t4` (ng/dL)
- `free_t3` (pg/mL)
- `total_t3` (ng/dL)
- `reverse_t3` (ng/dL)
- `cortisol_morning` (μg/dL)
- `dhea_s` (μg/dL)
- `testosterone_total` (ng/dL)
- `testosterone_free` (pg/mL)
- `shbg` (nmol/L)
- `estradiol` (pg/mL)
- `progesterone` (ng/mL)
- `prolactin` (ng/mL)
- `lh` (mIU/mL)
- `fsh` (mIU/mL)
- `igf_1` (ng/mL)

**Vitamins / Minerals (12):**
- `vitamin_d_25_oh` (ng/mL)
- `vitamin_b12` (pg/mL)
- `folate_serum` (ng/mL)
- `folate_rbc` (ng/mL)
- `magnesium_serum` (mg/dL)
- `magnesium_rbc` (mg/dL)
- `zinc` (μg/dL)
- `copper` (μg/dL)
- `iron_serum` (μg/dL)
- `ferritin` (ng/mL)
- `tibc` (μg/dL)
- `transferrin_saturation` (%)

**CBC / Hematology (10):**
- `rbc` (10⁶/μL)
- `hemoglobin` (g/dL)
- `hematocrit` (%)
- `mcv` (fL)
- `mch` (pg)
- `mchc` (g/dL)
- `rdw` (%)
- `platelets` (10³/μL)
- `lymphocytes_pct` (%)
- `neutrophils_pct` (%)

**Liver (6):**
- `alt` (U/L)
- `ast` (U/L)
- `alkaline_phosphatase` (U/L)
- `bilirubin_total` (mg/dL)
- `albumin` (g/dL)
- `ggt` (U/L)

**Kidney (5):**
- `creatinine` (mg/dL)
- `bun` (mg/dL)
- `egfr` (mL/min/1.73m²)
- `uric_acid` (mg/dL)
- `cystatin_c` (mg/L)

**Electrolytes (5):**
- `sodium` (mmol/L)
- `potassium` (mmol/L)
- `chloride` (mmol/L)
- `bicarbonate` (mmol/L)
- `calcium_total` (mg/dL)

**Other (10):**
- `vitamin_a` (μg/dL)
- `vitamin_e` (mg/L)
- `omega_3_index` (%)
- `omega_6_to_3_ratio` (ratio)
- `pSA` (ng/mL — male-only)
- `psa_free` (ng/mL — male-only)
- `lpa` (nmol/L)
- `hba1c_predicted_avg_glucose` (mg/dL — derived)
- `egfr_creatinine` (mL/min/1.73m²)
- `microalbumin_creatinine_ratio` (mg/g)

**Total: 80 biomarkers.** Catalog extensible — adding a 81st is a config-only change post-launch.

### 3.3 Reference range strategy

Every biomarker has TWO reference contexts:

1. **Lab-claimed range** (extracted from PDF) — used for the in-lab "out of range" flagging
2. **Population norm range** (catalog-defined, age/sex-adjusted) — used for the canonical z-score normalization

These often differ. Example: LabCorp's claimed Vitamin D range is 30-100 ng/mL ("normal"), but population-optimal evidence-based range is 40-60 ng/mL. We display both:
- Lab says: "Within range (32 ng/mL of 30-100)"
- Aissisted says: "Below population-optimal target (32 vs 40-60)"

This is one of the analytics differentiations vs WHOOP — we contextualize lab numbers against optimization targets, not just disease-screening cutoffs.

The catalog of population-optimal ranges lives in `packages/lab-ingestion/src/catalog/optimal-ranges.ts` and is reviewed quarterly by the (eventually-hired) clinical advisor.

---

## 4. PROVIDER INTEGRATIONS — DEFERRED FROM PHASE 2

Direct API integrations with LabCorp / Quest are out of scope for Phase 2 (per §1.2). Documenting here for v1.1 planning so the schema doesn't paint us into a corner.

### 4.1 What direct integration adds

- No PDF upload step — lab results auto-flow on draw completion
- Higher confidence (no OCR error)
- Faster delivery (Pacific Diagnostics API: results within 24h of draw vs 48-72h PDF email)
- Provider workflow automation (Aissisted as ordering provider via partner DTC service)

### 4.2 Why deferred

- LabCorp Result Reporting API requires medical-provider authorization (Aissisted needs a clinical entity to sign as ordering provider — Phase 4 health-law-attorney conversation required first)
- Quest Diagnostics QuanumLite API similar
- The legal + clinical setup is not Phase 2 scope

### 4.3 v1.1 schema-forward compatibility

The schema above is forward-compatible with API ingestion:
- `lab_results.source_pdf_s3_ref` → optional (NULL when API-ingested)
- New column `source_api_ref` for API-ingested results (added at v1.1, doesn't break Phase 2)
- `parser_used` includes `'labcorp_api'` and `'quest_api'` as future enum values
- `ocr_*` columns NULL for API-ingested (no OCR step)

---

## 5. AMEND / EDIT FLOW

Users will sometimes need to correct values (OCR error, lab data correction by provider, etc.).

### 5.1 Amend mechanic

- Inline edit on labs view: tap value → keyboard input → save
- Saves to `lab_biomarkers.user_amended_value` with `user_amended = TRUE` and timestamp
- Original `value` field is NEVER overwritten (audit trail preserved)
- Display logic: if `user_amended`, show `user_amended_value`; otherwise show `value`
- Canonical signal projection re-runs on amend, replacing the prior signals_canonical row (with audit trail)

### 5.2 Amend reasons (user-tagged)

- "OCR misread"
- "Lab issued a correction"
- "Wrong unit"
- "Other" + free text

Captured in `lab_biomarkers.notes` as a tagged JSON object for later analysis.

### 5.3 Right-to-amend (HIPAA)

HIPAA gives users the right to amend their PHI. The amend flow above satisfies this. Amendments stored alongside original; never destructive.

---

## 6. PHI HANDLING

Per `SECURITY_AND_COMPLIANCE_V1`, lab data is PHI. Specific posture:

| Item | Handling |
|---|---|
| PDF upload in transit | TLS 1.2+ from browser to API |
| PDF storage | S3 bucket tagged `data-class=phi`, KMS CMK encryption, MFA delete, versioning, public access blocked, bucket policy enforces TLS |
| OCR processing | AWS Textract under our BAA — stays inside AWS PHI boundary |
| Database storage | RDS Postgres with KMS at-rest encryption; PHI tables tagged `data-class=phi`; row-level security at Phase 4 |
| Display | Authenticated UI only; no public URL exposure |
| Audit log | Every read/write of `lab_results` and `lab_biomarkers` audit-logged via existing audit subsystem (Phase 4 enables 6-year retention to S3 Glacier) |
| User deletion | DELETE cascades through lab_biomarkers; lab_results row marked deleted but retained (HIPAA de-identified aggregate retention); S3 PDF deleted; signals_canonical rows derived from labs deleted |
| User amend | Right-to-amend supported per §5; original values preserved alongside amendments |

**No third-party data transfer for lab content.** Textract is AWS-internal. No external NLP. No external OCR.

---

## 7. EDGE CASES + FAILURE MODES

| Case | Handling |
|---|---|
| PDF is password-protected | Reject at upload; ask user to remove password and re-upload |
| PDF is a scan of a printed PDF (low quality) | Textract handles; if OCR confidence < 0.7 overall, mark as `ocr_status=failed` and prompt user for manual entry |
| Lab format unrecognized (not LabCorp / Quest) | Persist raw OCR; surface "we don't recognize this format yet — manual entry?" path |
| Result is a non-numeric value ("DETECTED" / "NEGATIVE" / "POSITIVE") | Stored in `lab_biomarkers.notes` as `qualitative_result`; not projected to signals_canonical |
| Result is "<5" or ">2000" (below/above detection limit) | Stored as the limit value with `validation_status='auto_confirmed_low_conf'` and tag in notes; not used for trend computation when limit-bounded |
| Same biomarker appears multiple times in one panel (e.g., free + total testosterone variants) | Each gets its own `lab_biomarkers` row with the appropriate canonical key — no merging |
| Reference range varies by sex/age and PDF doesn't include the user's specific range | Use catalog default for user's known sex/age; flag in notes |
| Draw date missing from PDF | Surface to user as "what was the date of this draw?" — block ingestion until provided |
| Multiple panels in one PDF (e.g., metabolic + hormone in same draw) | Single `lab_results` row for the draw; multiple `lab_biomarkers` rows |
| User uploads same PDF twice | Detected via SHA-256 hash on `source_pdf_filename + size`; surface "this looks like a duplicate of [date] — proceed anyway?" |
| Unit mismatch (e.g., LabCorp reports Vit D in nmol/L instead of ng/mL — rare but happens internationally) | Catalog includes unit conversions; auto-convert with note in `lab_biomarkers.notes` |

---

## 8. PHASE 2 ENGINEERING SCOPE

### 8.1 New code locations

```
packages/lab-ingestion/
├── src/
│   ├── index.ts                    # public API (ingestPdf, getResults, amendBiomarker)
│   ├── pipeline.ts                 # orchestrator
│   ├── ocr/
│   │   └── textract.ts             # AWS Textract adapter
│   ├── parsers/
│   │   ├── labcorp.ts
│   │   ├── quest.ts
│   │   └── unknown.ts
│   ├── normalization/
│   │   ├── biomarker-keys.ts       # name → canonical key map
│   │   ├── units.ts                # unit conversions
│   │   └── ref-ranges.ts           # population-optimal range catalog
│   ├── validation/
│   │   ├── confidence.ts
│   │   └── plausibility.ts
│   ├── canonical/
│   │   └── project.ts              # → signals_canonical
│   └── catalog/
│       └── biomarkers.ts           # 80-biomarker catalog
├── test/
│   └── fixtures/
│       ├── labcorp-sample.pdf      # synthetic test fixtures (NEVER real PHI)
│       └── quest-sample.pdf
└── package.json
```

### 8.2 Service points

- `apps/api/src/routes/labs.ts` — POST /labs/upload (accepts PDF), GET /labs/:id, PATCH /labs/:id/biomarkers/:bid (amend)
- `apps/api/src/services/labs.service.ts` — wraps `packages/lab-ingestion`
- BullMQ queue: `lab-ingestion` queue with workers consuming Textract jobs
- `apps/web/app/labs/page.tsx` — labs list view (already exists, gets real data)
- `apps/web/app/labs/[id]/page.tsx` — single result view with amend UI

### 8.3 Estimated effort

| Work | Est. days |
|---|---|
| Schema migrations + seeds | 1 |
| Textract adapter + S3 upload integration | 2 |
| LabCorp parser | 2 |
| Quest parser | 2 |
| Normalization map + unit conversions + ref-range catalog (80 biomarkers) | 2 |
| Validation + confidence scoring | 1 |
| Canonical signal projection | 1 |
| API routes + service integration | 1 |
| Web UI: upload flow + results list + amend surface | 3 |
| Test fixtures (synthetic PDFs) + integration tests | 2 |
| **Total** | **~17 days (3.5 weeks for one engineer)** |

Fits Phase 2 (4-week window) with buffer.

### 8.4 Test data strategy

NEVER use real lab PDFs as test fixtures (PHI risk in repo). Build synthetic LabCorp / Quest PDFs from public templates:

- LabCorp result template: visible in their public sample-result pages
- Quest result template: similarly publicly available
- Generate PDFs with synthetic biomarker values + synthetic patient names ("Test Patient One", DOB 1990-01-01)
- 5-10 fixtures covering: full panel / partial panel / out-of-range flags / qualitative results / detection-limit values

---

## 9. ROLLOUT GATES

Before lab ingestion goes live in production:

- [ ] All 80 biomarkers in catalog reviewed by clinical advisor (Phase 4 health-law-attorney call surfaces who this is — likely a separate clinical-advisor hire)
- [ ] LabCorp + Quest parsers tested against ≥10 fixtures each
- [ ] OCR confidence calibrated (≥95% agreement with human ground truth on test set)
- [ ] User review surface tested with one real user (Ron) on his own real labs
- [ ] PHI handling reviewed against `SECURITY_AND_COMPLIANCE_V1`
- [ ] Audit log integration verified
- [ ] Rate limiting on upload endpoint (1 PDF / minute / user, 50 / day / user)
- [ ] Anti-virus scan on PDF upload (ClamAV via S3 trigger; reject infected files)

---

## 10. OPEN QUESTIONS

1. **Clinical advisor for biomarker catalog review.** Need a clinician (MD, ND, or RD with relevant background) to sign off on the optimal-range catalog. Phase 4 health-law-attorney call may surface a candidate; otherwise separate hire / contract. Action item.

2. **Anti-virus scanning service.** ClamAV is open-source, runs in a Lambda triggered by S3 upload. Standard pattern. Adds ~$10/mo + minor latency. **Recommend ship.**

3. **Email-forward ingestion (`labs@aissisted.me`).** Convenient for users; non-trivial to build (email parser, attachment extraction, sender verification). **Recommend defer to v1.1.**

4. **Marek Health, Function Health, InsideTracker — explicit support?** All three currently route through LabCorp or Quest underneath, so PDF upload covers them today. Direct integrations (cleaner UX) are partner-business-development, not engineering. **Recommend defer to v1.1.**

5. **Continuous biomarker tracking (Levels CGM, Lingo CGM).** Wearable-style continuous data, not lab-style point measurements. **Ratified 2026-04-30: belongs in wearable adapter framework per `JOURNAL_AND_ANALYTICS_SPEC` §2, NOT in lab ingestion.** New canonical signal types `glucose_continuous_mg_dl` + derived metrics (TIR, CV, etc.) added to canonical signal layer when Levels/Lingo adapters land (post-beta).

6. **At-home dried blood spot (DBS) panels** (e.g., siphox, Function's home kits). Same canonical biomarkers but different lab providers, often less-known. **Recommend** treat as a long-tail "unknown_lab" path with manual review until enough volume justifies a dedicated parser.

---

## 11. NEXT STEPS

1. **Ratify this spec** (Ron). Sign-off triggers Phase 2 schema work.
2. **Engineering scope ticket** — break §8 into per-engineer tasks (schema migration / Textract adapter / LabCorp parser / Quest parser / catalog / web UI).
3. **Clinical advisor outreach** — needed before launch but doesn't block Phase 2 development. Catalog ranges using best-current-evidence sources for now (Cleveland Clinic, Mayo, Cedars-Sinai optimization protocols, peer-reviewed literature). Advisor reviews + signs off pre-Phase-4-launch.
4. **Test fixture generation** — synthetic PDFs ready before parser work begins.
5. **§10 open question resolution** — Ron answers Q1 (clinical advisor path) and Q5 (CGM placement).

---

## 12. CHANGELOG

| Date | Change | By |
|---|---|---|
| 2026-04-30 | v1 draft. Two-stage pipeline (PDF → biomarkers → canonical signals). 80-biomarker catalog. AWS Textract. LabCorp + Quest parsers at beta. Manual amend flow. Reference range dual-context (lab-claimed + population-optimal). Schema forward-compatible with v1.1 API integrations. | Cowork |
