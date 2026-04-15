import { describe, it, expect } from "vitest";
import {
  normalizeObservations,
  normalizeConditions,
  normalizeMedications,
  normalizeAllergies,
} from "../normalizer.js";
import type {
  FhirObservation,
  FhirCondition,
  FhirMedicationRequest,
  FhirAllergyIntolerance,
} from "../client.js";

// ─── Helpers ──────────────────────────────────────────────

function makeObservation(overrides: Partial<FhirObservation> = {}): FhirObservation {
  return {
    resourceType: "Observation",
    id: "obs-1",
    status: "final",
    code: {
      coding: [{ system: "http://loinc.org", code: "1989-3", display: "25-OH Vitamin D" }],
    },
    subject: { reference: "Patient/p1" },
    effectiveDateTime: "2024-01-15T10:00:00Z",
    valueQuantity: { value: 28, unit: "ng/mL" },
    ...overrides,
  };
}

function makeCondition(overrides: Partial<FhirCondition> = {}): FhirCondition {
  return {
    resourceType: "Condition",
    id: "cond-1",
    clinicalStatus: { coding: [{ code: "active" }] },
    code: { text: "Type 2 Diabetes", coding: [] },
    ...overrides,
  };
}

function makeMed(overrides: Partial<FhirMedicationRequest> = {}): FhirMedicationRequest {
  return {
    resourceType: "MedicationRequest",
    id: "med-1",
    status: "active",
    authoredOn: "2024-01-01",
    medicationCodeableConcept: {
      text: "Metformin 500mg",
      coding: [
        {
          system: "http://www.nlm.nih.gov/research/umls/rxnorm",
          code: "860975",
          display: "Metformin",
        },
      ],
    },
    ...overrides,
  };
}

// ─── normalizeObservations ────────────────────────────────

describe("normalizeObservations", () => {
  it("returns empty array for no observations", () => {
    expect(normalizeObservations([])).toHaveLength(0);
  });

  it("maps a known LOINC code (1989-3) to vitamin_d_ng_ml", () => {
    const obs = makeObservation();
    const result = normalizeObservations([obs]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("vitamin_d_ng_ml");
    expect(result[0].value).toBe(28);
    expect(result[0].source).toBe("fhir");
    expect(result[0].measuredAt).toBe("2024-01-15T10:00:00Z");
  });

  it("skips observations without a known LOINC mapping", () => {
    const obs = makeObservation({
      code: {
        coding: [{ system: "http://loinc.org", code: "9999-9", display: "Unknown" }],
      },
    });
    expect(normalizeObservations([obs])).toHaveLength(0);
  });

  it("skips non-final observations", () => {
    const pending = makeObservation({ status: "preliminary" });
    expect(normalizeObservations([pending])).toHaveLength(0);
  });

  it("accepts amended observations", () => {
    const amended = makeObservation({ status: "amended" });
    expect(normalizeObservations([amended])).toHaveLength(1);
  });

  it("deduplicates same biomarker on same day", () => {
    const obs1 = makeObservation({ id: "a" });
    const obs2 = makeObservation({ id: "b" }); // same LOINC, same date
    const result = normalizeObservations([obs1, obs2]);
    expect(result).toHaveLength(1);
  });

  it("keeps two readings on different days", () => {
    const obs1 = makeObservation({ id: "a", effectiveDateTime: "2024-01-01T00:00:00Z" });
    const obs2 = makeObservation({ id: "b", effectiveDateTime: "2024-02-01T00:00:00Z" });
    const result = normalizeObservations([obs1, obs2]);
    expect(result).toHaveLength(2);
  });

  it("captures referenceRange when present", () => {
    const obs = makeObservation({
      referenceRange: [{ low: { value: 30, unit: "ng/mL" }, high: { value: 100, unit: "ng/mL" } }],
    });
    const result = normalizeObservations([obs]);
    expect(result[0].referenceRangeLow).toBe(30);
    expect(result[0].referenceRangeHigh).toBe(100);
  });

  it("captures abnormalFlag from interpretation coding", () => {
    const obs = makeObservation({
      interpretation: [{ coding: [{ code: "L", display: "Low" }] }],
    });
    const result = normalizeObservations([obs]);
    expect(result[0].abnormalFlag).toBe("L");
  });

  it("uses effectivePeriod.start when effectiveDateTime is absent", () => {
    const obs = makeObservation({
      effectiveDateTime: undefined,
      effectivePeriod: { start: "2024-03-10T00:00:00Z", end: "2024-03-10T01:00:00Z" },
    });
    const result = normalizeObservations([obs]);
    expect(result[0].measuredAt).toBe("2024-03-10T00:00:00Z");
  });

  it("handles TSH (LOINC 3016-3) correctly", () => {
    const obs = makeObservation({
      code: { coding: [{ system: "http://loinc.org", code: "3016-3", display: "TSH" }] },
      valueQuantity: { value: 2.5, unit: "mIU/L" },
    });
    const result = normalizeObservations([obs]);
    expect(result[0].name).toBe("tsh_miu_l");
    expect(result[0].value).toBe(2.5);
  });

  it("skips observations with no valueQuantity and no components", () => {
    const obs = makeObservation({ valueQuantity: undefined });
    expect(normalizeObservations([obs])).toHaveLength(0);
  });
});

// ─── normalizeConditions ──────────────────────────────────

describe("normalizeConditions", () => {
  it("returns empty array for no resources", () => {
    expect(normalizeConditions([])).toHaveLength(0);
  });

  it("maps active condition correctly", () => {
    const cond = makeCondition();
    const result = normalizeConditions([cond]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Type 2 Diabetes");
    expect(result[0].status).toBe("active");
    expect(result[0].source).toBe("fhir");
    expect(result[0].sourceResourceId).toBe("cond-1");
  });

  it("maps resolved conditions", () => {
    const cond = makeCondition({
      clinicalStatus: { coding: [{ code: "resolved" }] },
      code: { text: "COVID-19" },
    });
    const result = normalizeConditions([cond]);
    expect(result[0].status).toBe("resolved");
  });

  it("maps unknown clinical status to 'unknown'", () => {
    const cond = makeCondition({
      clinicalStatus: { coding: [{ code: "something-else" }] },
    });
    const result = normalizeConditions([cond]);
    expect(result[0].status).toBe("unknown");
  });

  it("extracts ICD-10 code when present", () => {
    const cond = makeCondition({
      code: {
        text: "Hypertension",
        coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: "I10", display: "HTN" }],
      },
    });
    const result = normalizeConditions([cond]);
    expect(result[0].icd10Code).toBe("I10");
  });

  it("deduplicates conditions with same normalized name", () => {
    const a = makeCondition({ id: "c1", code: { text: "Diabetes" } });
    const b = makeCondition({ id: "c2", code: { text: "DIABETES" } });
    const result = normalizeConditions([a, b]);
    expect(result).toHaveLength(1);
  });

  it("skips conditions with no code text or display", () => {
    const cond = makeCondition({ code: { coding: [] } });
    expect(normalizeConditions([cond])).toHaveLength(0);
  });
});

// ─── normalizeMedications ─────────────────────────────────

describe("normalizeMedications", () => {
  it("returns empty array for no resources", () => {
    expect(normalizeMedications([])).toHaveLength(0);
  });

  it("maps active medication correctly", () => {
    const med = makeMed();
    const result = normalizeMedications([med]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Metformin 500mg");
    expect(result[0].status).toBe("active");
    expect(result[0].source).toBe("fhir");
    expect(result[0].rxnormCode).toBe("860975");
  });

  it("skips entered-in-error medications", () => {
    const med = makeMed({ status: "entered-in-error" });
    expect(normalizeMedications([med])).toHaveLength(0);
  });

  it("skips cancelled medications", () => {
    const med = makeMed({ status: "cancelled" });
    expect(normalizeMedications([med])).toHaveLength(0);
  });

  it("maps stopped status correctly", () => {
    const med = makeMed({ status: "stopped" });
    const result = normalizeMedications([med]);
    expect(result[0].status).toBe("stopped");
  });

  it("deduplicates medications with same normalized name", () => {
    const a = makeMed({ id: "m1" });
    const b = makeMed({ id: "m2" }); // same name
    expect(normalizeMedications([a, b])).toHaveLength(1);
  });

  it("skips medications with no resolvable name", () => {
    const med = makeMed({
      medicationCodeableConcept: undefined,
      medicationReference: undefined,
    });
    expect(normalizeMedications([med])).toHaveLength(0);
  });

  it("falls back to medicationReference.display when codeable concept is absent", () => {
    const med = makeMed({
      medicationCodeableConcept: undefined,
      medicationReference: { display: "Lisinopril 10mg" },
    });
    const result = normalizeMedications([med]);
    expect(result[0].name).toBe("Lisinopril 10mg");
  });
});

// ─── normalizeAllergies ───────────────────────────────────

describe("normalizeAllergies", () => {
  function makeAllergy(overrides: Partial<FhirAllergyIntolerance> = {}): FhirAllergyIntolerance {
    return {
      resourceType: "AllergyIntolerance",
      id: "allergy-1",
      clinicalStatus: { coding: [{ code: "active" }] },
      category: ["medication"],
      criticality: "high",
      code: { text: "Penicillin", coding: [] },
      ...overrides,
    };
  }

  it("normalizes a basic allergy", () => {
    const result = normalizeAllergies([makeAllergy()]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("penicillin");
    expect(result[0].category).toBe("medication");
    expect(result[0].criticality).toBe("high");
    expect(result[0].source).toBe("fhir");
  });

  it("skips non-active allergies", () => {
    const allergy = makeAllergy({
      clinicalStatus: { coding: [{ code: "inactive" }] },
    });
    expect(normalizeAllergies([allergy])).toHaveLength(0);
  });

  it("skips refuted allergies", () => {
    const allergy = makeAllergy({
      verificationStatus: { coding: [{ code: "refuted" }] },
    });
    expect(normalizeAllergies([allergy])).toHaveLength(0);
  });

  it("deduplicates allergies with same normalized name", () => {
    const a = makeAllergy({ id: "a1" });
    const b = makeAllergy({ id: "a2", code: { text: "PENICILLIN", coding: [] } });
    expect(normalizeAllergies([a, b])).toHaveLength(1);
  });

  it("captures manifestation text when present", () => {
    const allergy = makeAllergy({
      reaction: [
        {
          manifestation: [{ text: "Anaphylaxis" }],
          severity: "severe",
        },
      ],
    });
    const result = normalizeAllergies([allergy]);
    expect(result[0].manifestation).toBe("Anaphylaxis");
  });
});
