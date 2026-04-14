/**
 * Reference ranges for common biomarkers.
 * Ranges are expressed in the canonical unit for each biomarker.
 * "optimal" is a tighter range than "normal" — used for protocol scoring.
 */

export type RangeStatus = "low" | "optimal" | "high" | "unknown";

export interface BiomarkerRange {
  unit: string;
  low: number;
  highNormal: number;
  /** Tighter optimal range within normal */
  optimalLow?: number;
  optimalHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export const BIOMARKER_RANGES: Record<string, BiomarkerRange> = {
  // ── Vitamins ──────────────────────────────────────────
  vitamin_d_ng_ml: {
    unit: "ng/mL",
    low: 30,
    highNormal: 100,
    optimalLow: 40,
    optimalHigh: 80,
    criticalLow: 10,
    criticalHigh: 150,
  },
  b12_pg_ml: {
    unit: "pg/mL",
    low: 200,
    highNormal: 900,
    optimalLow: 400,
    optimalHigh: 700,
    criticalLow: 100,
  },
  folate_ng_ml: {
    unit: "ng/mL",
    low: 2.7,
    highNormal: 17,
    optimalLow: 5,
    optimalHigh: 12,
    criticalLow: 1,
  },

  // ── Iron panel ────────────────────────────────────────
  ferritin_ng_ml: {
    unit: "ng/mL",
    low: 20,
    highNormal: 300,
    optimalLow: 50,
    optimalHigh: 150,
    criticalLow: 5,
    criticalHigh: 500,
  },
  hemoglobin_g_dl: {
    unit: "g/dL",
    low: 12,
    highNormal: 17.5,
    optimalLow: 13,
    optimalHigh: 16,
    criticalLow: 7,
    criticalHigh: 20,
  },

  // ── Inflammation ──────────────────────────────────────
  crp_mg_l: {
    unit: "mg/L",
    low: 0,
    highNormal: 3,
    optimalLow: 0,
    optimalHigh: 1,
    criticalHigh: 10,
  },
  hs_crp_mg_l: {
    unit: "mg/L",
    low: 0,
    highNormal: 3,
    optimalLow: 0,
    optimalHigh: 1,
    criticalHigh: 10,
  },

  // ── Hormones ──────────────────────────────────────────
  testosterone_ng_dl: {
    unit: "ng/dL",
    low: 300,
    highNormal: 1000,
    optimalLow: 500,
    optimalHigh: 900,
    criticalLow: 100,
    criticalHigh: 1500,
  },
  free_testosterone_pg_ml: {
    unit: "pg/mL",
    low: 50,
    highNormal: 250,
    optimalLow: 100,
    optimalHigh: 200,
    criticalLow: 20,
  },
  tsh_miu_l: {
    unit: "mIU/L",
    low: 0.4,
    highNormal: 4,
    optimalLow: 0.5,
    optimalHigh: 2,
    criticalLow: 0.01,
    criticalHigh: 10,
  },
  cortisol_mcg_dl: {
    unit: "mcg/dL",
    low: 6,
    highNormal: 23,
    optimalLow: 10,
    optimalHigh: 20,
    criticalLow: 2,
    criticalHigh: 35,
  },
  dhea_s_mcg_dl: {
    unit: "mcg/dL",
    low: 80,
    highNormal: 560,
    optimalLow: 150,
    optimalHigh: 400,
    criticalLow: 20,
  },

  // ── Metabolic ─────────────────────────────────────────
  glucose_mg_dl: {
    unit: "mg/dL",
    low: 70,
    highNormal: 100,
    optimalLow: 75,
    optimalHigh: 90,
    criticalLow: 55,
    criticalHigh: 180,
  },
  hba1c_percent: {
    unit: "%",
    low: 4,
    highNormal: 5.7,
    optimalLow: 4.6,
    optimalHigh: 5.3,
    criticalHigh: 9,
  },
  insulin_uiu_ml: {
    unit: "uIU/mL",
    low: 2,
    highNormal: 20,
    optimalLow: 3,
    optimalHigh: 10,
    criticalHigh: 50,
  },

  // ── Lipids ────────────────────────────────────────────
  total_cholesterol_mg_dl: {
    unit: "mg/dL",
    low: 125,
    highNormal: 200,
    optimalLow: 150,
    optimalHigh: 180,
    criticalHigh: 300,
  },
  hdl_mg_dl: {
    unit: "mg/dL",
    low: 40,
    highNormal: 100,
    optimalLow: 60,
    optimalHigh: 90,
    criticalLow: 25,
  },
  ldl_mg_dl: {
    unit: "mg/dL",
    low: 0,
    highNormal: 100,
    optimalLow: 0,
    optimalHigh: 70,
    criticalHigh: 190,
  },
  triglycerides_mg_dl: {
    unit: "mg/dL",
    low: 0,
    highNormal: 150,
    optimalLow: 0,
    optimalHigh: 100,
    criticalHigh: 500,
  },

  // ── WHOOP-derived signals ─────────────────────────────
  whoop_recovery_score: {
    unit: "%",
    low: 33,
    highNormal: 100,
    optimalLow: 67,
    optimalHigh: 100,
    criticalLow: 0,
  },
  whoop_hrv_rmssd_ms: {
    unit: "ms",
    low: 20,
    highNormal: 200,
    optimalLow: 40,
    optimalHigh: 120,
    criticalLow: 10,
  },
  whoop_sleep_performance_pct: {
    unit: "%",
    low: 70,
    highNormal: 100,
    optimalLow: 85,
    optimalHigh: 100,
    criticalLow: 50,
  },
  whoop_respiratory_rate_bpm: {
    unit: "bpm",
    low: 12,
    highNormal: 20,
    optimalLow: 13,
    optimalHigh: 17,
    criticalLow: 8,
    criticalHigh: 25,
  },
};

export function getRangeStatus(
  name: string,
  value: number
): { status: RangeStatus; isCritical: boolean } {
  const range = BIOMARKER_RANGES[name];
  if (!range) return { status: "unknown", isCritical: false };

  const isCritical =
    (range.criticalLow !== undefined && value < range.criticalLow) ||
    (range.criticalHigh !== undefined && value > range.criticalHigh);

  if (value < range.low) return { status: "low", isCritical };
  if (value > range.highNormal) return { status: "high", isCritical };

  if (range.optimalLow !== undefined && range.optimalHigh !== undefined) {
    if (value >= range.optimalLow && value <= range.optimalHigh) {
      return { status: "optimal", isCritical: false };
    }
  }

  return { status: "optimal", isCritical: false };
}

export function validateBiomarkerValue(
  name: string,
  value: number,
  unit: string
): string | null {
  if (!isFinite(value) || isNaN(value)) return "Value must be a valid number";
  if (value < 0) return "Value cannot be negative";

  const range = BIOMARKER_RANGES[name];
  if (!range) return null; // Unknown biomarker — accept as-is

  // Loose sanity check: reject values 10× above critical high
  if (range.criticalHigh !== undefined && value > range.criticalHigh * 10) {
    return `Value ${value} ${unit} is implausibly high for ${name} — check units`;
  }

  return null;
}
