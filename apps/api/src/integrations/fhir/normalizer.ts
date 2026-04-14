import type { FhirObservation } from "./client.js";

/**
 * Maps LOINC codes to canonical biomarker names used by the rules engine.
 * Reference: https://loinc.org
 */
const LOINC_MAP: Record<string, { name: string; unit: string }> = {
  // Vitamins
  "1989-3": { name: "vitamin_d_ng_ml", unit: "ng/mL" },
  "2132-9": { name: "b12_pg_ml", unit: "pg/mL" },
  // Ferritin / iron
  "2276-4": { name: "ferritin_ng_ml", unit: "ng/mL" },
  "2498-4": { name: "iron_mcg_dl", unit: "mcg/dL" },
  // Inflammation
  "1988-5": { name: "crp_mg_l", unit: "mg/L" },
  "30522-7": { name: "hs_crp_mg_l", unit: "mg/L" },
  // Thyroid
  "3016-3": { name: "tsh_miu_l", unit: "mIU/L" },
  "3053-6": { name: "free_t3_pg_ml", unit: "pg/mL" },
  "3054-4": { name: "free_t4_ng_dl", unit: "ng/dL" },
  // Hormones
  "2986-8": { name: "testosterone_ng_dl", unit: "ng/dL" },
  "2143-6": { name: "cortisol_mcg_dl", unit: "mcg/dL" },
  "2089-1": { name: "ldl_mg_dl", unit: "mg/dL" },
  "2085-9": { name: "hdl_mg_dl", unit: "mg/dL" },
  "2571-8": { name: "triglycerides_mg_dl", unit: "mg/dL" },
  // CBC
  "718-7": { name: "hemoglobin_g_dl", unit: "g/dL" },
  "4544-3": { name: "hematocrit_pct", unit: "%" },
  "787-2": { name: "mcv_fl", unit: "fL" },
  // Metabolic
  "2345-7": { name: "glucose_mg_dl", unit: "mg/dL" },
  "4548-4": { name: "hba1c_pct", unit: "%" },
  "2160-0": { name: "creatinine_mg_dl", unit: "mg/dL" },
  // Vitals
  "8867-4": { name: "resting_hr_bpm", unit: "bpm" },
  "59408-5": { name: "spo2_pct", unit: "%" },
};

export interface NormalizedBiomarker {
  name: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: string;
}

export function normalizeObservations(
  observations: FhirObservation[]
): NormalizedBiomarker[] {
  const seen = new Set<string>();
  const result: NormalizedBiomarker[] = [];

  for (const obs of observations) {
    if (obs.status !== "final" && obs.status !== "amended") continue;

    // Find LOINC code
    const loincCoding = obs.code.coding.find(
      (c) => c.system === "http://loinc.org"
    );
    if (!loincCoding) continue;

    const mapping = LOINC_MAP[loincCoding.code];
    if (!mapping) continue;

    const quantityValue = obs.valueQuantity?.value;
    if (quantityValue === undefined || quantityValue === null) continue;

    const measuredAt =
      obs.effectiveDateTime ??
      obs.effectivePeriod?.start ??
      new Date().toISOString();

    const dateKey = measuredAt.slice(0, 10);
    const dedupeKey = `${mapping.name}:${dateKey}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    result.push({
      name: mapping.name,
      value: quantityValue,
      unit: obs.valueQuantity?.unit ?? mapping.unit,
      source: "fhir",
      measuredAt,
    });
  }

  return result;
}
