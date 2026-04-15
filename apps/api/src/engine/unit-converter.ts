/**
 * Unit normalization for clinical lab values.
 *
 * Epic and MyChart return values in the lab's native units, which vary
 * by country and institution. We normalize everything to a single internal
 * unit before storage and analysis.
 *
 * Conversion factors: multiply the input value by the factor to get the
 * canonical unit.
 */

interface UnitConversion {
  from: string;
  to: string;
  factor: number; // canonical = input * factor
}

// Keep this table limited to unambiguous generic conversions.
// Biomarker-specific factors (for example mmol/L → mg/dL for glucose,
// cholesterol, triglycerides, BUN, etc.) must be handled by
// BIOMARKER_CONVERSIONS so normalized `from` units remain unique here.

const CONVERSIONS: UnitConversion[] = [
  // ─── Generic unit equivalence / unambiguous conversions ──────────────
  { from: "mu/l", to: "miu/l", factor: 1 },        // TSH: mU/L = mIU/L
  { from: "ug/l", to: "ng/ml", factor: 1 },        // µg/L = ng/mL (Ferritin)
  { from: "mg/l", to: "mg/l", factor: 1 },         // CRP: already canonical
  { from: "nmol/l", to: "umol/l", factor: 0.001 }, // Homocysteine: nmol/L → µmol/L
];

// Biomarker-specific overrides (where generic unit lookup is ambiguous)
const BIOMARKER_CONVERSIONS: Record<string, UnitConversion> = {
  glucose_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 18.016 },
  triglycerides_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 88.573 },
  total_cholesterol_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 38.67 },
  ldl_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 38.67 },
  hdl_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 38.67 },
  vitamin_d_ng_ml: { from: "nmol/l", to: "ng/ml", factor: 0.4006 },
  b12_pg_ml: { from: "pmol/l", to: "pg/ml", factor: 1.355 },
  testosterone_ng_dl: { from: "nmol/l", to: "ng/dl", factor: 28.84 },
  cortisol_mcg_dl: { from: "nmol/l", to: "mcg/dl", factor: 0.2718 },
  creatinine_mg_dl: { from: "umol/l", to: "mg/dl", factor: 0.01131 },
  bun_mg_dl: { from: "mmol/l", to: "mg/dl", factor: 2.801 },
  iron_mcg_dl: { from: "umol/l", to: "mcg/dl", factor: 5.585 },
  free_t4_ng_dl: { from: "pmol/l", to: "ng/dl", factor: 0.0777 },
  free_t3_pg_ml: { from: "pmol/l", to: "pg/ml", factor: 0.6509 },
  estradiol_pg_ml: { from: "pmol/l", to: "pg/ml", factor: 0.272 },
  folate_ng_ml: { from: "nmol/l", to: "ng/ml", factor: 0.2266 },
};

/**
 * Attempt to normalize a lab value to the internal canonical unit.
 *
 * Returns the normalized value and canonical unit, or the original
 * if no conversion is applicable.
 */
export function normalizeUnit(
  biomarkerName: string,
  value: number,
  unit: string
): { value: number; unit: string; converted: boolean } {
  const unitLower = unit.toLowerCase().replace(/\s+/g, "").replace("μ", "u");

  // Check biomarker-specific conversion first
  const specific = BIOMARKER_CONVERSIONS[biomarkerName];
  if (specific && specific.from === unitLower) {
    return {
      value: parseFloat((value * specific.factor).toFixed(4)),
      unit: specific.to,
      converted: true,
    };
  }

  // Generic unit lookup
  const conversion = CONVERSIONS.find(
    (c) => c.from.toLowerCase() === unitLower
  );
  if (conversion) {
    return {
      value: parseFloat((value * conversion.factor).toFixed(4)),
      unit: conversion.to,
      converted: true,
    };
  }

  return { value, unit, converted: false };
}

/**
 * Normalize a batch of biomarker entries, converting units where possible.
 */
export function normalizeBiomarkerUnits<
  T extends { name: string; value: number; unit: string }
>(entries: T[]): T[] {
  return entries.map((entry) => {
    const normalized = normalizeUnit(entry.name, entry.value, entry.unit);
    if (!normalized.converted) return entry;
    return { ...entry, value: normalized.value, unit: normalized.unit };
  });
}
