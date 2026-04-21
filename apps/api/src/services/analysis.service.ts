/**
 * Continuous Health Analysis Engine
 *
 * Computes per-domain risk scores, detects active signals (deficiencies,
 * excesses, trends), identifies missing data gaps, synthesizes a health mode,
 * and persists the result as a HealthStateSnapshot.
 *
 * Called:
 *   - After every FHIR / WHOOP sync that yields new biomarker data
 *   - On-demand via GET /health-state
 */

import { randomUUID } from "crypto";
import { db, schema, eq, and, desc } from "@aissisted/db";
import {
  BIOMARKER_RANGES,
  getRangeStatus,
  type RangeStatus,
} from "../engine/biomarker-ranges.js";
import { computeBiomarkerTrends } from "./trends.service.js";
import { writeAuditLog } from "./audit.service.js";

// ─── Public types ─────────────────────────────────────────

export interface DomainScores {
  cardiovascular: number; // 0 = optimal, 1 = severe risk
  metabolic: number;
  hormonal: number;
  micronutrient: number;
  renal: number;
  inflammatory: number;
}

export type HealthMode =
  | "optimal"
  | "cardiovascular_risk"
  | "metabolic_dysfunction"
  | "hormonal_imbalance"
  | "micronutrient_deficient"
  | "renal_caution"
  | "inflammatory"
  | "data_insufficient";

export interface ActiveSignal {
  key: string; // e.g. "ldl_high"
  domain: string;
  biomarkerName: string;
  signalType:
    | "deficiency"
    | "excess"
    | "trend_worsening"
    | "trend_improving"
    | "critical_value"
    | "compound_risk";
  severity: "info" | "warn" | "critical";
  explanation: string;
  value?: number;
  components?: string[]; // for compound signals: list of contributing biomarkers
}

export interface HealthState {
  id: string;
  userId: string;
  mode: HealthMode;
  confidenceScore: number;
  domainScores: DomainScores;
  activeSignals: ActiveSignal[];
  warnings: string[];
  missingDataFlags: string[];
  createdAt: string;
}

// ─── Domain biomarker membership ─────────────────────────

const CARDIOVASCULAR_MARKERS = [
  "ldl_mg_dl",
  "hdl_mg_dl",
  "triglycerides_mg_dl",
  "total_cholesterol_mg_dl",
  "apob_mg_dl",
  "homocysteine_umol_l",
];

const METABOLIC_MARKERS = [
  "glucose_mg_dl",
  "hba1c_pct",
  "insulin_uiu_ml",
];

const HORMONAL_MARKERS = [
  "testosterone_ng_dl",
  "free_testosterone_pg_ml",
  "tsh_miu_l",
  "cortisol_mcg_dl",
  "dhea_s_mcg_dl",
  "estradiol_pg_ml",
];

const MICRONUTRIENT_MARKERS = [
  "vitamin_d_ng_ml",
  "b12_pg_ml",
  "folate_ng_ml",
  "ferritin_ng_ml",
  "magnesium_mg_dl",
  "iron_mcg_dl",
];

const RENAL_MARKERS = [
  "creatinine_mg_dl",
  "bun_mg_dl",
];

const INFLAMMATORY_MARKERS = [
  "crp_mg_l",
  "hs_crp_mg_l",
  "esr_mm_hr",
  "homocysteine_umol_l",
];

// Key labs that should be present for high confidence
const KEY_LABS_FOR_CONFIDENCE = [
  "glucose_mg_dl",
  "hba1c_pct",
  "ldl_mg_dl",
  "hdl_mg_dl",
  "triglycerides_mg_dl",
  "vitamin_d_ng_ml",
  "b12_pg_ml",
  "crp_mg_l",
  "testosterone_ng_dl",
  "tsh_miu_l",
  "creatinine_mg_dl",
  "ferritin_ng_ml",
];

// ─── Biomarker deviation scorer ───────────────────────────

/**
 * Returns a 0-1 risk score for a single biomarker:
 *  0   = in optimal range
 *  0.2 = in normal range but outside optimal
 *  0.5 = outside normal range (high or low)
 *  0.8 = outside normal by 2× the normal band
 *  1.0 = critical value
 */
function scoreBiomarker(name: string, value: number): number {
  const range = BIOMARKER_RANGES[name];
  if (!range) return 0;

  const isCritical =
    (range.criticalLow !== undefined && value < range.criticalLow) ||
    (range.criticalHigh !== undefined && value > range.criticalHigh);
  if (isCritical) return 1.0;

  const { status } = getRangeStatus(name, value);
  if (status === "optimal") return 0;

  // In normal range but outside optimal band
  if (status !== "low" && status !== "high") return 0.2;

  // Out of normal range — grade severity
  const bandWidth =
    name === "hdl_mg_dl" || name === "hemoglobin_g_dl"
      ? range.highNormal - range.low
      : (range.criticalHigh ?? range.highNormal * 1.5) - range.highNormal;

  const overshoot =
    status === "high"
      ? value - range.highNormal
      : range.low - value;

  const severityRatio = Math.min(overshoot / Math.max(bandWidth, 1), 1);
  return 0.5 + severityRatio * 0.3; // 0.5 – 0.8
}

// ─── Domain scorers ───────────────────────────────────────

function scoreDomain(biomap: Map<string, number>, markers: string[]): number {
  const scores = markers
    .filter((m) => biomap.has(m))
    .map((m) => scoreBiomarker(m, biomap.get(m)!));
  if (scores.length === 0) return 0; // no data → neutral
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ─── Signal detection ─────────────────────────────────────

function detectSignals(
  biomap: Map<string, number>,
  history: Map<string, Array<{ value: number; measuredAt: string }>>
): ActiveSignal[] {
  const signals: ActiveSignal[] = [];

  const domainOf = (name: string): string => {
    if (CARDIOVASCULAR_MARKERS.includes(name)) return "cardiovascular";
    if (METABOLIC_MARKERS.includes(name)) return "metabolic";
    if (HORMONAL_MARKERS.includes(name)) return "hormonal";
    if (MICRONUTRIENT_MARKERS.includes(name)) return "micronutrient";
    if (RENAL_MARKERS.includes(name)) return "renal";
    if (INFLAMMATORY_MARKERS.includes(name)) return "inflammatory";
    return "general";
  };

  for (const [name, value] of biomap) {
    const range = BIOMARKER_RANGES[name];
    if (!range) continue;

    const isCritical =
      (range.criticalLow !== undefined && value < range.criticalLow) ||
      (range.criticalHigh !== undefined && value > range.criticalHigh);
    const { status } = getRangeStatus(name, value);

    if (isCritical) {
      signals.push({
        key: `${name}_critical`,
        domain: domainOf(name),
        biomarkerName: name,
        signalType: "critical_value",
        severity: "critical",
        value,
        explanation: `${name} is at a critical value (${value} ${range.unit})`,
      });
    } else if (status === "low") {
      signals.push({
        key: `${name}_low`,
        domain: domainOf(name),
        biomarkerName: name,
        signalType: "deficiency",
        severity: value < (range.optimalLow ?? range.low) * 0.7 ? "warn" : "info",
        value,
        explanation: `${name} is below optimal range (${value} ${range.unit}; optimal ≥${range.optimalLow ?? range.low})`,
      });
    } else if (status === "high") {
      signals.push({
        key: `${name}_high`,
        domain: domainOf(name),
        biomarkerName: name,
        signalType: "excess",
        severity: value > (range.optimalHigh ?? range.highNormal) * 1.3 ? "warn" : "info",
        value,
        explanation: `${name} is above optimal range (${value} ${range.unit}; optimal ≤${range.optimalHigh ?? range.highNormal})`,
      });
    }
  }

  // Trend signals: need ≥3 readings to detect worsening/improving
  for (const [name, readings] of history) {
    if (readings.length < 3) continue;
    const sorted = [...readings].sort(
      (a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime()
    );
    const range = BIOMARKER_RANGES[name];
    if (!range) continue;

    // Linear slope via simple first-vs-last comparison across 3+ points
    const oldest = sorted[0].value;
    const newest = sorted[sorted.length - 1].value;
    const delta = newest - oldest;
    const normalBand = range.highNormal - range.low;
    const relativeChange = Math.abs(delta) / Math.max(normalBand, 1);

    if (relativeChange < 0.1) continue; // < 10% of normal band = noise

    // "Worsening" = moving away from optimal
    const newerStatus = getRangeStatus(name, newest).status;
    const olderStatus = getRangeStatus(name, oldest).status;

    const worsened =
      (newerStatus === "high" && delta > 0) ||
      (newerStatus === "low" && delta < 0) ||
      (olderStatus === "optimal" && newerStatus !== "optimal");

    const improved =
      (newerStatus === "optimal" && olderStatus !== "optimal") ||
      (newerStatus === "high" && delta < 0 && olderStatus !== "optimal") ||
      (newerStatus === "low" && delta > 0 && olderStatus !== "optimal");

    if (worsened) {
      signals.push({
        key: `${name}_trend_worsening`,
        domain: domainOf(name),
        biomarkerName: name,
        signalType: "trend_worsening",
        severity: relativeChange > 0.3 ? "warn" : "info",
        value: newest,
        explanation: `${name} has been trending in an unfavorable direction (${oldest.toFixed(1)} → ${newest.toFixed(1)} ${range.unit})`,
      });
    } else if (improved) {
      signals.push({
        key: `${name}_trend_improving`,
        domain: domainOf(name),
        biomarkerName: name,
        signalType: "trend_improving",
        severity: "info",
        value: newest,
        explanation: `${name} is trending in a favorable direction (${oldest.toFixed(1)} → ${newest.toFixed(1)} ${range.unit})`,
      });
    }
  }

  return signals;
}

// ─── Compound cross-biomarker signals ────────────────────
//
// Each pattern fires only when ALL component biomarkers are present
// and their combined values indicate a clinically meaningful co-occurrence.
// These composite signals surface risk that per-biomarker analysis misses.

interface CompoundPattern {
  key: string;
  domain: string;
  components: string[];
  severity: "info" | "warn" | "critical";
  explanation: string;
  condition: (m: Map<string, number>) => boolean;
}

const COMPOUND_PATTERNS: CompoundPattern[] = [
  {
    key: "cardiovascular_composite",
    domain: "cardiovascular",
    components: ["ldl_mg_dl", "crp_mg_l"],
    severity: "warn",
    explanation:
      "Elevated LDL combined with elevated CRP indicates both lipid burden and active inflammation — heightened cardiovascular risk pattern",
    condition: (m) =>
      (m.get("ldl_mg_dl") ?? 0) > 130 &&
      (m.get("crp_mg_l") ?? m.get("hs_crp_mg_l") ?? 0) > 2,
  },
  {
    key: "cardiovascular_critical_triad",
    domain: "cardiovascular",
    components: ["ldl_mg_dl", "crp_mg_l", "triglycerides_mg_dl"],
    severity: "critical",
    explanation:
      "Critical triad: very high LDL + elevated CRP + high triglycerides — aggressive cardiovascular risk requiring urgent clinical evaluation",
    condition: (m) =>
      (m.get("ldl_mg_dl") ?? 0) > 190 &&
      (m.get("crp_mg_l") ?? m.get("hs_crp_mg_l") ?? 0) > 3 &&
      (m.get("triglycerides_mg_dl") ?? 0) > 200,
  },
  {
    key: "dyslipidemia_combined",
    domain: "cardiovascular",
    components: ["ldl_mg_dl", "triglycerides_mg_dl"],
    severity: "warn",
    explanation:
      "High LDL with high triglycerides — combined dyslipidemia with elevated atherogenic risk; low HDL often co-occurs",
    condition: (m) =>
      (m.get("ldl_mg_dl") ?? 0) > 160 &&
      (m.get("triglycerides_mg_dl") ?? 0) > 200,
  },
  {
    key: "prediabetes_pattern",
    domain: "metabolic",
    components: ["glucose_mg_dl", "hba1c_pct"],
    severity: "warn",
    explanation:
      "Fasting glucose and HbA1c both in prediabetic range — pattern consistent with insulin resistance and impaired glucose regulation",
    condition: (m) =>
      (m.get("glucose_mg_dl") ?? 0) > 100 &&
      (m.get("hba1c_pct") ?? 0) > 5.7,
  },
  {
    key: "metabolic_syndrome_cluster",
    domain: "metabolic",
    components: ["glucose_mg_dl", "triglycerides_mg_dl", "hdl_mg_dl"],
    severity: "warn",
    explanation:
      "Elevated glucose, high triglycerides, and low HDL together — three of the five metabolic syndrome criteria present",
    condition: (m) =>
      (m.get("glucose_mg_dl") ?? 0) > 100 &&
      (m.get("triglycerides_mg_dl") ?? 0) > 150 &&
      (m.get("hdl_mg_dl") ?? 999) < 40,
  },
  {
    key: "thyroid_dysregulation",
    domain: "hormonal",
    components: ["tsh_miu_l", "free_t4_ng_dl"],
    severity: "warn",
    explanation:
      "Both TSH and free T4 are outside normal ranges — thyroid dysregulation pattern requiring clinical evaluation",
    condition: (m) => {
      const tsh = m.get("tsh_miu_l");
      const t4 = m.get("free_t4_ng_dl");
      return (
        tsh !== undefined &&
        t4 !== undefined &&
        (tsh > 4 || tsh < 0.4) &&
        (t4 > 1.5 || t4 < 0.8)
      );
    },
  },
  {
    key: "iron_deficiency_anemia",
    domain: "micronutrient",
    components: ["ferritin_ng_ml", "hemoglobin_g_dl"],
    severity: "warn",
    explanation:
      "Low ferritin with low hemoglobin — pattern consistent with iron deficiency anemia; fatigue, cognitive fog, and poor recovery likely",
    condition: (m) =>
      (m.get("ferritin_ng_ml") ?? 999) < 20 &&
      (m.get("hemoglobin_g_dl") ?? 999) < 12.5,
  },
  {
    key: "renal_concern_combined",
    domain: "renal",
    components: ["creatinine_mg_dl", "bun_mg_dl"],
    severity: "warn",
    explanation:
      "Both creatinine and BUN elevated — combined renal filtration concern; high-dose nephrotoxic supplements (creatine, high vitamin C) should be reviewed",
    condition: (m) =>
      (m.get("creatinine_mg_dl") ?? 0) > 1.3 &&
      (m.get("bun_mg_dl") ?? 0) > 25,
  },
  {
    key: "androgen_insufficiency",
    domain: "hormonal",
    components: ["testosterone_ng_dl", "dhea_s_mcg_dl"],
    severity: "warn",
    explanation:
      "Low testosterone and low DHEA-S together — compound androgen insufficiency pattern affecting energy, libido, lean mass, and cognitive function",
    condition: (m) =>
      (m.get("testosterone_ng_dl") ?? 999) < 300 &&
      (m.get("dhea_s_mcg_dl") ?? 999) < 100,
  },
  {
    key: "inflammatory_methylation",
    domain: "inflammatory",
    components: ["crp_mg_l", "homocysteine_umol_l"],
    severity: "warn",
    explanation:
      "Elevated CRP and homocysteine — combined inflammatory + methylation dysfunction; associated with cardiovascular and neurocognitive risk",
    condition: (m) =>
      (m.get("crp_mg_l") ?? m.get("hs_crp_mg_l") ?? 0) > 3 &&
      (m.get("homocysteine_umol_l") ?? 0) > 15,
  },
  {
    key: "micronutrient_deficiency_cluster",
    domain: "micronutrient",
    components: ["vitamin_d_ng_ml", "b12_pg_ml", "ferritin_ng_ml"],
    severity: "warn",
    explanation:
      "Vitamin D, B12, and ferritin all below optimal — overlapping micronutrient insufficiency affecting immunity, energy, and neurological function",
    condition: (m) =>
      (m.get("vitamin_d_ng_ml") ?? 999) < 30 &&
      (m.get("b12_pg_ml") ?? 999) < 300 &&
      (m.get("ferritin_ng_ml") ?? 999) < 30,
  },
];

function detectCompoundSignals(biomap: Map<string, number>): ActiveSignal[] {
  const signals: ActiveSignal[] = [];

  for (const pattern of COMPOUND_PATTERNS) {
    // Only fire if ALL component biomarkers are present
    const allPresent = pattern.components.every((c) => biomap.has(c));
    if (!allPresent) continue;

    if (pattern.condition(biomap)) {
      signals.push({
        key: pattern.key,
        domain: pattern.domain,
        biomarkerName: pattern.components[0], // primary component
        signalType: "compound_risk",
        severity: pattern.severity,
        explanation: pattern.explanation,
        components: pattern.components,
      });
    }
  }

  return signals;
}

// ─── Missing data detection ───────────────────────────────

function detectMissingData(
  biomap: Map<string, number>,
  biomarkerDates: Map<string, string>,
  conditions: string[]
): string[] {
  const flags: string[] = [];
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (const lab of KEY_LABS_FOR_CONFIDENCE) {
    if (!biomap.has(lab)) {
      flags.push(`missing_${lab}`);
      continue;
    }
    const lastDate = biomarkerDates.get(lab);
    if (lastDate && new Date(lastDate) < sixMonthsAgo) {
      flags.push(`stale_${lab}`);
    }
  }

  // Condition-specific flags
  const lowerConditions = conditions.map((c) => c.toLowerCase());
  if (
    lowerConditions.some((c) => c.includes("diabetes") || c.includes("prediabetes")) &&
    !biomap.has("hba1c_pct")
  ) {
    flags.push("missing_hba1c_for_diabetes");
  }
  if (
    lowerConditions.some((c) => c.includes("thyroid") || c.includes("hypothyroid")) &&
    !biomap.has("tsh_miu_l")
  ) {
    flags.push("missing_tsh_for_thyroid_condition");
  }

  return flags;
}

// ─── Mode synthesis ───────────────────────────────────────

function synthesizeMode(
  scores: DomainScores,
  signals: ActiveSignal[],
  confidenceScore: number
): HealthMode {
  if (confidenceScore < 0.25) return "data_insufficient";

  const hasCritical = signals.some((s) => s.severity === "critical");

  // Threshold for "elevated concern"
  const THRESHOLD = 0.35;

  const ranked: [HealthMode, number][] = [
    ["cardiovascular_risk", scores.cardiovascular],
    ["metabolic_dysfunction", scores.metabolic],
    ["hormonal_imbalance", scores.hormonal],
    ["micronutrient_deficient", scores.micronutrient],
    ["renal_caution", scores.renal],
    ["inflammatory", scores.inflammatory],
  ];

  ranked.sort((a, b) => b[1] - a[1]);

  // Critical values always elevate to the relevant mode
  if (hasCritical) {
    const critDomain = signals.find((s) => s.severity === "critical")?.domain;
    const modeMap: Record<string, HealthMode> = {
      cardiovascular: "cardiovascular_risk",
      metabolic: "metabolic_dysfunction",
      hormonal: "hormonal_imbalance",
      micronutrient: "micronutrient_deficient",
      renal: "renal_caution",
      inflammatory: "inflammatory",
    };
    if (critDomain && modeMap[critDomain]) return modeMap[critDomain];
  }

  if (ranked[0][1] >= THRESHOLD) return ranked[0][0];

  return "optimal";
}

// ─── Safety warnings ─────────────────────────────────────

function buildWarnings(
  biomap: Map<string, number>,
  conditions: string[],
  medications: string[]
): string[] {
  const warnings: string[] = [];
  const lowerMeds = medications.map((m) => m.toLowerCase());
  const lowerCond = conditions.map((c) => c.toLowerCase());

  // Renal caution
  const creatinine = biomap.get("creatinine_mg_dl");
  if (creatinine && creatinine > 1.5) {
    warnings.push(
      "Elevated creatinine detected — review supplement doses that affect renal clearance (e.g. creatine, high-dose vitamin C)"
    );
  }

  // Anticoagulant caution
  if (lowerMeds.some((m) => m.includes("warfarin") || m.includes("coumadin"))) {
    warnings.push(
      "Warfarin noted — avoid high-dose vitamin K, omega-3 >3g/day, and CoQ10 which may alter INR"
    );
  }
  if (lowerMeds.some((m) => m.includes("eliquis") || m.includes("apixaban") || m.includes("xarelto"))) {
    warnings.push(
      "NOAC anticoagulant noted — caution with fish oil >2g/day, vitamin E >400IU, and ginkgo"
    );
  }

  // Thyroid medication
  if (lowerMeds.some((m) => m.includes("levothyroxine") || m.includes("synthroid"))) {
    warnings.push(
      "Levothyroxine noted — take thyroid medication 4+ hours apart from calcium, magnesium, and iron supplements"
    );
  }

  // Statin
  if (lowerMeds.some((m) => m.includes("statin") || m.includes("atorvastatin") || m.includes("rosuvastatin"))) {
    warnings.push(
      "Statin noted — CoQ10 supplementation (100-200mg/day) is recommended to offset statin-induced depletion"
    );
  }

  // Diabetes / metformin
  if (lowerMeds.some((m) => m.includes("metformin"))) {
    warnings.push(
      "Metformin noted — monitor B12 levels; metformin can reduce B12 absorption over time"
    );
  }

  // High CRP
  const crp = biomap.get("crp_mg_l") ?? biomap.get("hs_crp_mg_l");
  if (crp && crp > 3) {
    warnings.push(
      "Elevated CRP indicates active inflammation — investigate cause before initiating aggressive supplement protocol"
    );
  }

  // TSH out of range with thyroid condition
  const tsh = biomap.get("tsh_miu_l");
  if (
    tsh &&
    (tsh < 0.4 || tsh > 4.5) &&
    lowerCond.some((c) => c.includes("thyroid"))
  ) {
    warnings.push(
      "TSH is outside normal range with a thyroid condition noted — consult endocrinologist before making changes"
    );
  }

  return warnings;
}

// ─── Main engine ─────────────────────────────────────────

/**
 * Compute a full health state snapshot for the user.
 * Persists to healthStateSnapshots and returns the result.
 */
export async function computeHealthState(userId: string): Promise<HealthState> {
  // 1. Load all biomarker history (up to 1000 entries for trend analysis)
  const allRows = await db
    .select({
      id: schema.biomarkers.id,
      name: schema.biomarkers.name,
      value: schema.biomarkers.value,
      unit: schema.biomarkers.unit,
      measuredAt: schema.biomarkers.measuredAt,
    })
    .from(schema.biomarkers)
    .where(eq(schema.biomarkers.userId, userId))
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(1000);

  // 2. Build biomap (latest value per biomarker) and history map
  const biomap = new Map<string, number>();
  const biomarkerDates = new Map<string, string>();
  const history = new Map<string, Array<{ value: number; measuredAt: string }>>();

  for (const row of allRows) {
    if (!biomap.has(row.name)) {
      biomap.set(row.name, row.value);
      biomarkerDates.set(row.name, row.measuredAt);
    }
    const h = history.get(row.name) ?? [];
    if (h.length < 10) h.push({ value: row.value, measuredAt: row.measuredAt });
    history.set(row.name, h);
  }

  // 3. Load profile for conditions, medications
  const profile = await db
    .select({
      conditions: schema.healthProfiles.conditions,
      medications: schema.healthProfiles.medications,
    })
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();

  const conditions: string[] = JSON.parse(profile?.conditions ?? "[]");
  const medications: string[] = JSON.parse(profile?.medications ?? "[]");

  // 4. Compute domain scores
  const domainScores: DomainScores = {
    cardiovascular: scoreDomain(biomap, CARDIOVASCULAR_MARKERS),
    metabolic: scoreDomain(biomap, METABOLIC_MARKERS),
    hormonal: scoreDomain(biomap, HORMONAL_MARKERS),
    micronutrient: scoreDomain(biomap, MICRONUTRIENT_MARKERS),
    renal: scoreDomain(biomap, RENAL_MARKERS),
    inflammatory: scoreDomain(biomap, INFLAMMATORY_MARKERS),
  };

  // 5. Detect signals and warnings (per-biomarker + compound cross-marker)
  const perBiomarkerSignals = detectSignals(biomap, history);
  const compoundSignals = detectCompoundSignals(biomap);
  const activeSignals = [...perBiomarkerSignals, ...compoundSignals];
  const warnings = buildWarnings(biomap, conditions, medications);

  // 6. Missing data flags
  const missingDataFlags = detectMissingData(biomap, biomarkerDates, conditions);

  // 7. Confidence score: proportion of key labs present and recent
  const presentKeyLabs = KEY_LABS_FOR_CONFIDENCE.filter(
    (lab) =>
      biomap.has(lab) &&
      !missingDataFlags.includes(`stale_${lab}`) &&
      !missingDataFlags.includes(`missing_${lab}`)
  );
  const confidenceScore =
    Math.round((presentKeyLabs.length / KEY_LABS_FOR_CONFIDENCE.length) * 100) / 100;

  // 8. Synthesize health mode
  const mode = synthesizeMode(domainScores, activeSignals, confidenceScore);

  // 9. Persist snapshot
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  await db.insert(schema.healthStateSnapshots).values({
    id,
    userId,
    mode,
    confidenceScore,
    domainScores: JSON.stringify(domainScores),
    activeSignals: JSON.stringify(activeSignals.map((s) => s.key)),
    warnings: JSON.stringify(warnings),
    missingDataFlags: JSON.stringify(missingDataFlags),
    createdAt,
  });

  writeAuditLog(userId, "health_state.generated", "health_state_snapshots", id, {
    mode,
    confidenceScore,
    signalCount: activeSignals.length,
    warningCount: warnings.length,
  }).catch(() => {});

  return {
    id,
    userId,
    mode,
    confidenceScore,
    domainScores,
    activeSignals,
    warnings,
    missingDataFlags,
    createdAt,
  };
}

/**
 * Return the most recently computed health state snapshot, or compute a new one
 * if none exists or the latest is older than maxAgeHours.
 */
export async function getLatestHealthState(
  userId: string,
  maxAgeHours = 24
): Promise<HealthState | null> {
  const latest = await db
    .select()
    .from(schema.healthStateSnapshots)
    .where(eq(schema.healthStateSnapshots.userId, userId))
    .orderBy(desc(schema.healthStateSnapshots.createdAt))
    .get();

  if (!latest) return null;

  const ageMs = Date.now() - new Date(latest.createdAt).getTime();
  if (ageMs > maxAgeHours * 60 * 60 * 1000) {
    // Snapshot is stale — recompute
    return computeHealthState(userId);
  }

  // Rehydrate the full signal list from raw biomarker data (not stored in snapshot)
  // so callers get structured signals, not just keys.
  const allRows = await db
    .select({ name: schema.biomarkers.name, value: schema.biomarkers.value })
    .from(schema.biomarkers)
    .where(eq(schema.biomarkers.userId, userId))
    .orderBy(desc(schema.biomarkers.measuredAt))
    .limit(500);

  const biomap = new Map<string, number>();
  for (const row of allRows) {
    if (!biomap.has(row.name)) biomap.set(row.name, row.value);
  }

  const activeSignals = [
    ...detectSignals(biomap, new Map()),
    ...detectCompoundSignals(biomap),
  ];

  return {
    id: latest.id,
    userId,
    mode: latest.mode as HealthState["mode"],
    confidenceScore: latest.confidenceScore,
    domainScores: JSON.parse(latest.domainScores) as DomainScores,
    activeSignals,
    warnings: JSON.parse(latest.warnings) as string[],
    missingDataFlags: JSON.parse(latest.missingDataFlags) as string[],
    createdAt: latest.createdAt,
  };
}

/**
 * Trigger re-analysis if the last snapshot is older than the given threshold,
 * or if new biomarkers were added (count > 0). Fire-and-forget safe.
 */
export async function maybeReanalyze(
  userId: string,
  newBiomarkerCount: number
): Promise<void> {
  if (newBiomarkerCount === 0) return;

  const latest = await db
    .select({ createdAt: schema.healthStateSnapshots.createdAt })
    .from(schema.healthStateSnapshots)
    .where(eq(schema.healthStateSnapshots.userId, userId))
    .orderBy(desc(schema.healthStateSnapshots.createdAt))
    .get();

  const tooOld =
    !latest ||
    Date.now() - new Date(latest.createdAt).getTime() > 24 * 60 * 60 * 1000;

  if (tooOld) {
    // Run in background — do not await so sync pipeline is not blocked
    computeHealthState(userId).catch(() => {});
    computeBiomarkerTrends(userId).catch(() => {});
  }
}
