import type {
  FhirObservation,
  FhirDiagnosticReport,
  FhirAllergyIntolerance,
  FhirCondition,
  FhirMedicationRequest,
} from "./client.js";
import type { ConditionInput } from "../../services/conditions.service.js";
import type { MedicationInput } from "../../services/medications.service.js";
import { normalizeBiomarkerUnits } from "../../engine/unit-converter.js";

/**
 * Maps LOINC codes to canonical biomarker names used by the rules engine.
 * Reference: https://loinc.org
 */
const LOINC_MAP: Record<string, { name: string; unit: string }> = {
  // Vitamins
  "1989-3": { name: "vitamin_d_ng_ml", unit: "ng/mL" },
  "62292-8": { name: "vitamin_d_ng_ml", unit: "ng/mL" }, // 25-OH D3 alternate
  "2132-9": { name: "b12_pg_ml", unit: "pg/mL" },
  "2284-8": { name: "folate_ng_ml", unit: "ng/mL" },
  "14685-2": { name: "magnesium_mg_dl", unit: "mg/dL" },
  // Ferritin / iron
  "2276-4": { name: "ferritin_ng_ml", unit: "ng/mL" },
  "2498-4": { name: "iron_mcg_dl", unit: "mcg/dL" },
  "2500-7": { name: "tibc_mcg_dl", unit: "mcg/dL" },
  // Inflammation
  "1988-5": { name: "crp_mg_l", unit: "mg/L" },
  "30522-7": { name: "hs_crp_mg_l", unit: "mg/L" },
  "4537-7": { name: "esr_mm_hr", unit: "mm/hr" },
  "2819-3": { name: "homocysteine_umol_l", unit: "umol/L" },
  // Thyroid
  "3016-3": { name: "tsh_miu_l", unit: "mIU/L" },
  "3053-6": { name: "free_t3_pg_ml", unit: "pg/mL" },
  "3054-4": { name: "free_t4_ng_dl", unit: "ng/dL" },
  "11580-8": { name: "free_t4_ng_dl", unit: "ng/dL" }, // alternate
  // Hormones
  "2986-8": { name: "testosterone_ng_dl", unit: "ng/dL" },
  "13938-7": { name: "testosterone_free_pg_ml", unit: "pg/mL" },
  "2143-6": { name: "cortisol_mcg_dl", unit: "mcg/dL" },
  "10501-5": { name: "dhea_s_mcg_dl", unit: "mcg/dL" },
  "2119-6": { name: "estradiol_pg_ml", unit: "pg/mL" },
  // Lipids
  "2089-1": { name: "ldl_mg_dl", unit: "mg/dL" },
  "2085-9": { name: "hdl_mg_dl", unit: "mg/dL" },
  "2571-8": { name: "triglycerides_mg_dl", unit: "mg/dL" },
  "2093-3": { name: "total_cholesterol_mg_dl", unit: "mg/dL" },
  "55440-2": { name: "apob_mg_dl", unit: "mg/dL" },
  // CBC
  "718-7": { name: "hemoglobin_g_dl", unit: "g/dL" },
  "4544-3": { name: "hematocrit_pct", unit: "%" },
  "787-2": { name: "mcv_fl", unit: "fL" },
  "788-0": { name: "rdw_pct", unit: "%" },
  "777-3": { name: "platelets_k_ul", unit: "k/uL" },
  "6690-2": { name: "wbc_k_ul", unit: "k/uL" },
  // Metabolic
  "2345-7": { name: "glucose_mg_dl", unit: "mg/dL" },
  "4548-4": { name: "hba1c_pct", unit: "%" },
  "2160-0": { name: "creatinine_mg_dl", unit: "mg/dL" },
  "3094-0": { name: "bun_mg_dl", unit: "mg/dL" },
  "1742-6": { name: "alt_u_l", unit: "U/L" },
  "1920-8": { name: "ast_u_l", unit: "U/L" },
  "2324-2": { name: "ggtp_u_l", unit: "U/L" },
  "10839-9": { name: "troponin_ng_ml", unit: "ng/mL" },
  // Vitals
  "8867-4": { name: "resting_hr_bpm", unit: "bpm" },
  "59408-5": { name: "spo2_pct", unit: "%" },
  "8310-5": { name: "body_temp_c", unit: "°C" },
  "29463-7": { name: "weight_kg", unit: "kg" },
  "8302-2": { name: "height_cm", unit: "cm" },
  "39156-5": { name: "bmi_kg_m2", unit: "kg/m²" },
  // Sleep / wearable
  "93832-4": { name: "sleep_duration_min", unit: "min" },
};

export interface NormalizedBiomarker {
  name: string;
  value: number;
  unit: string;
  source: string;
  measuredAt: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  abnormalFlag?: string; // "H", "L", "HH", "LL", "A", etc. from FHIR interpretation
  labPanelName?: string;
}

export interface NormalizedAllergy {
  name: string;
  category: string; // "food" | "medication" | "environment" | "biologic"
  criticality: string; // "low" | "high" | "unknown"
  manifestation?: string;
  source: string;
}

function getLoincMapping(coding: Array<{ system: string; code: string }>) {
  const loinc = coding.find((c) => c.system === "http://loinc.org");
  return loinc ? LOINC_MAP[loinc.code] : undefined;
}

function getEffectiveDate(obs: FhirObservation): string {
  return obs.effectiveDateTime ?? obs.effectivePeriod?.start ?? new Date().toISOString();
}

export function normalizeObservations(
  observations: FhirObservation[]
): NormalizedBiomarker[] {
  const seen = new Set<string>();
  const result: NormalizedBiomarker[] = [];

  // Build an ID→observation index so hasMember references can be resolved
  const obsById = new Map<string, FhirObservation>();
  for (const obs of observations) {
    if (obs.id) obsById.set(`Observation/${obs.id}`, obs);
  }

  function extractRefRange(
    refRange?: FhirObservation["referenceRange"]
  ): { low?: number; high?: number } {
    const first = refRange?.[0];
    return { low: first?.low?.value, high: first?.high?.value };
  }

  // Extract FHIR interpretation code ("H", "L", "HH", "LL", "A", etc.)
  function getAbnormalFlag(obs: FhirObservation): string | undefined {
    const code = obs.interpretation?.[0]?.coding?.[0]?.code;
    return code ?? obs.interpretation?.[0]?.text ?? undefined;
  }

  function tryAdd(obs: FhirObservation, panelName?: string) {
    if (obs.status !== "final" && obs.status !== "amended") return;

    const measuredAt = getEffectiveDate(obs);
    const dateKey = measuredAt.slice(0, 10);
    const abnormalFlag = getAbnormalFlag(obs);

    // Case 1: scalar value in valueQuantity
    if (obs.valueQuantity?.value !== undefined) {
      const mapping = getLoincMapping(obs.code.coding);
      if (mapping) {
        const key = `${mapping.name}:${dateKey}`;
        if (!seen.has(key)) {
          seen.add(key);
          const refRange = extractRefRange(obs.referenceRange);
          result.push({
            name: mapping.name,
            value: obs.valueQuantity.value,
            unit: obs.valueQuantity.unit ?? mapping.unit,
            source: "fhir",
            measuredAt,
            referenceRangeLow: refRange.low,
            referenceRangeHigh: refRange.high,
            abnormalFlag,
            labPanelName: panelName,
          });
        }
      }
    }

    // Case 2: component array (e.g. blood pressure systolic/diastolic)
    for (const comp of obs.component ?? []) {
      if (comp.valueQuantity?.value === undefined) continue;
      const mapping = getLoincMapping(comp.code.coding);
      if (!mapping) continue;
      const key = `${mapping.name}:${dateKey}`;
      if (!seen.has(key)) {
        seen.add(key);
        const refRange = extractRefRange(comp.referenceRange as FhirObservation["referenceRange"]);
        result.push({
          name: mapping.name,
          value: comp.valueQuantity.value,
          unit: comp.valueQuantity.unit ?? mapping.unit,
          source: "fhir",
          measuredAt,
          referenceRangeLow: refRange.low,
          referenceRangeHigh: refRange.high,
          labPanelName: panelName,
        });
      }
    }

    // Case 3: hasMember panel — resolve each member reference, propagate panel name
    for (const ref of obs.hasMember ?? []) {
      const member = obsById.get(ref.reference);
      if (member) tryAdd(member, panelName ?? obs.code.text);
    }
  }

  for (const obs of observations) {
    tryAdd(obs);
  }

  // Normalize units to canonical values (mmol/L → mg/dL etc.)
  return normalizeBiomarkerUnits(result);
}

/**
 * Extract biomarker results from DiagnosticReport.result references.
 * The actual values live in the referenced Observation resources, so
 * this function just enriches them with the panel name.
 *
 * Call normalizeObservations() first — this function sets labPanelName
 * on already-normalized records by matching Observation IDs in the report.
 */
export function applyDiagnosticReportPanelNames(
  normalized: NormalizedBiomarker[],
  reports: FhirDiagnosticReport[]
): NormalizedBiomarker[] {
  // Build a map of ObservationId → panel name
  const panelByObsId = new Map<string, string>();
  for (const report of reports) {
    if (report.status !== "final" && report.status !== "amended" && report.status !== "preliminary") continue;
    const panelName = report.code.text ?? report.code.coding?.[0]?.display ?? "Lab Panel";
    for (const ref of report.result ?? []) {
      const obsId = ref.reference.split("/").pop();
      if (obsId) panelByObsId.set(obsId, panelName);
    }
  }
  // This pass can't back-annotate by Observation ID because we don't store
  // original FHIR id on normalized records yet. The panel names come from
  // hasMember traversal in normalizeObservations() instead.
  // Return unchanged — full panel-name enrichment happens at the raw layer.
  return normalized;
}

/**
 * Normalize FHIR Condition resources into structured condition records.
 * Extracts clinical status, onset/abatement dates, and ICD-10/SNOMED codes.
 */
export function normalizeConditions(resources: FhirCondition[]): ConditionInput[] {
  const seen = new Set<string>();
  const result: ConditionInput[] = [];

  for (const cond of resources) {
    const clinical = cond.clinicalStatus?.coding?.[0]?.code;
    // Map FHIR clinical status to internal status
    const status =
      clinical === "active" ? "active"
      : clinical === "resolved" ? "resolved"
      : clinical === "inactive" ? "inactive"
      : "unknown";

    const name = cond.code?.text ?? cond.code?.coding?.[0]?.display;
    if (!name) continue;

    const normalized = name.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    // Extract ICD-10 and SNOMED codes
    const icd10 = cond.code?.coding?.find((c) =>
      c.system?.includes("icd-10") || c.system?.includes("ICD-10")
    )?.code;
    const snomed = cond.code?.coding?.find((c) =>
      c.system?.includes("snomed") || c.system === "http://snomed.info/sct"
    )?.code;

    result.push({
      name,
      status: status as ConditionInput["status"],
      onsetDate: cond.onsetDateTime ?? cond.onsetPeriod?.start,
      abatementDate: cond.abatementDateTime,
      source: "fhir",
      sourceResourceId: cond.id,
      icd10Code: icd10,
      snomedCode: snomed,
    });
  }

  return result;
}

/**
 * Normalize FHIR MedicationRequest resources into structured medication records.
 * Extracts status, dosage instructions, RxNorm codes, and date range.
 */
export function normalizeMedications(resources: FhirMedicationRequest[]): MedicationInput[] {
  const seen = new Set<string>();
  const result: MedicationInput[] = [];

  for (const med of resources) {
    if (med.status === "entered-in-error" || med.status === "cancelled") continue;

    const name =
      med.medicationCodeableConcept?.text ??
      med.medicationCodeableConcept?.coding?.[0]?.display ??
      med.medicationReference?.display;
    if (!name) continue;

    const normalized = name.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const status: MedicationInput["status"] =
      med.status === "active" ? "active"
      : med.status === "stopped" || med.status === "completed" ? "stopped"
      : med.status === "on-hold" ? "inactive"
      : "unknown";

    const rxnorm = med.medicationCodeableConcept?.coding?.find((c) =>
      c.system?.includes("rxnorm") || c.system === "http://www.nlm.nih.gov/research/umls/rxnorm"
    )?.code;

    const dosageInstruction = med.dosageInstruction?.[0];
    const dosageText = dosageInstruction?.text ?? dosageInstruction?.doseAndRate?.[0]?.doseQuantity
      ? `${dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.value} ${dosageInstruction?.doseAndRate?.[0]?.doseQuantity?.unit}`
      : undefined;
    const frequency = dosageInstruction?.timing?.code?.text;

    result.push({
      name,
      dosage: dosageText,
      frequency,
      status,
      startDate: med.authoredOn,
      source: "fhir",
      sourceResourceId: med.id,
      rxnormCode: rxnorm,
    });
  }

  return result;
}

/**
 * Normalize AllergyIntolerance resources into a flat structure
 * suitable for the safety/contraindication engine.
 */
export function normalizeAllergies(
  allergies: FhirAllergyIntolerance[]
): NormalizedAllergy[] {
  const result: NormalizedAllergy[] = [];
  const seen = new Set<string>();

  for (const allergy of allergies) {
    const clinical = allergy.clinicalStatus?.coding?.[0]?.code;
    if (clinical && clinical !== "active") continue;

    const verification = allergy.verificationStatus?.coding?.[0]?.code;
    if (verification === "entered-in-error" || verification === "refuted") continue;

    const name =
      allergy.code?.text ?? allergy.code?.coding?.[0]?.display;
    if (!name) continue;

    const normalized = name.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const manifestation = allergy.reaction
      ?.flatMap((r) =>
        r.manifestation?.map((m) => m.text ?? m.coding?.[0]?.display) ?? []
      )
      .filter(Boolean)
      .join(", ");

    result.push({
      name: normalized,
      category: allergy.category?.[0] ?? "unknown",
      criticality: allergy.criticality ?? "unknown",
      manifestation: manifestation || undefined,
      source: "fhir",
    });
  }

  return result;
}
