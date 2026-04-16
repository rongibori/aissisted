import type { HealthRecord } from "./parser.js";

/**
 * Maps Apple Health HKQuantityTypeIdentifier keys to canonical biomarker names
 * used by the Aissisted rules engine.
 */
const HK_TO_BIOMARKER: Record<string, { name: string; unit: string }> = {
  // Vitamins / minerals
  HKQuantityTypeIdentifierBloodGlucose:           { name: "blood_glucose_mg_dl", unit: "mg/dL" },
  // CBC
  HKQuantityTypeIdentifierOxygenSaturation:       { name: "spo2_pct", unit: "%" },
  HKQuantityTypeIdentifierHeartRate:              { name: "resting_hr_bpm", unit: "bpm" },
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: { name: "hrv_sdnn_ms", unit: "ms" },
  HKQuantityTypeIdentifierRespiratoryRate:        { name: "respiratory_rate_rpm", unit: "rpm" },
  HKQuantityTypeIdentifierBodyMassIndex:          { name: "bmi", unit: "" },
  HKQuantityTypeIdentifierBodyFatPercentage:      { name: "body_fat_pct", unit: "%" },
  HKQuantityTypeIdentifierBodyMass:               { name: "weight_kg", unit: "kg" },
  HKQuantityTypeIdentifierActiveEnergyBurned:     { name: "active_kcal", unit: "kcal" },
  HKQuantityTypeIdentifierBasalEnergyBurned:      { name: "bmr_kcal", unit: "kcal" },
  HKQuantityTypeIdentifierStepCount:              { name: "steps", unit: "count" },
  HKQuantityTypeIdentifierSleepDurationGoal:      { name: "sleep_goal_hours", unit: "h" },
  // Metabolic
  HKQuantityTypeIdentifierInsulinDelivery:        { name: "insulin_units", unit: "IU" },
  // Bloodwork — some apps write these via Health
  HKQuantityTypeIdentifierVitaminD:               { name: "vitamin_d_ng_ml", unit: "ng/mL" },
};

export interface NormalizedBiomarker {
  name: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: Date;
}

/**
 * Convert a list of Apple Health records to normalized biomarker entries.
 * De-duplicates by (name, date) keeping the first occurrence.
 */
export function normalizeAppleHealthRecords(
  records: HealthRecord[]
): NormalizedBiomarker[] {
  const seen = new Set<string>();
  const result: NormalizedBiomarker[] = [];

  for (const rec of records) {
    const mapping = HK_TO_BIOMARKER[rec.type];
    if (!mapping) continue;

    // Parse date — Apple uses "YYYY-MM-DD HH:MM:SS ±HHMM"
    const dateKey = rec.startDate.slice(0, 10); // YYYY-MM-DD
    const dedupeKey = `${mapping.name}:${dateKey}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    // Attempt ISO parse
    let measuredAt: Date;
    try {
      // Replace space with T and drop the timezone offset for basic ISO
      measuredAt = new Date(rec.startDate.replace(" ", "T").replace(/\s[+-]\d{4}$/, "Z"));
    } catch {
      measuredAt = new Date();
    }

    result.push({
      name: mapping.name,
      value: rec.value,
      unit: rec.unit || mapping.unit,
      source: "apple_health",
      measuredAt,
    });
  }

  return result;
}
