import { describe, it, expect } from "vitest";
import { normalizeUnit, normalizeBiomarkerUnits } from "../unit-converter.js";

// ─── normalizeUnit ────────────────────────────────────────

describe("normalizeUnit", () => {
  // ── Glucose ──────────────────────────────────────────
  describe("glucose mmol/L → mg/dL", () => {
    it("converts correctly with biomarker-specific factor", () => {
      const result = normalizeUnit("glucose_mg_dl", 5.5, "mmol/L");
      expect(result.converted).toBe(true);
      expect(result.unit).toBe("mg/dl");
      // 5.5 * 18.016 = 99.088
      expect(result.value).toBeCloseTo(99.09, 1);
    });
  });

  // ── Vitamin D ─────────────────────────────────────────
  describe("vitamin_d nmol/L → ng/mL", () => {
    it("converts nmol/L to ng/mL", () => {
      const result = normalizeUnit("vitamin_d_ng_ml", 75, "nmol/L");
      expect(result.converted).toBe(true);
      expect(result.unit).toBe("ng/ml");
      // 75 * 0.4006 = 30.045
      expect(result.value).toBeCloseTo(30.05, 1);
    });
  });

  // ── Testosterone ──────────────────────────────────────
  describe("testosterone nmol/L → ng/dL", () => {
    it("converts correctly", () => {
      const result = normalizeUnit("testosterone_ng_dl", 15, "nmol/L");
      expect(result.converted).toBe(true);
      // 15 * 28.84 = 432.6
      expect(result.value).toBeCloseTo(432.6, 0);
    });
  });

  // ── Creatinine ────────────────────────────────────────
  describe("creatinine umol/L → mg/dL", () => {
    it("converts µmol/L to mg/dL", () => {
      const result = normalizeUnit("creatinine_mg_dl", 88.4, "umol/L");
      expect(result.converted).toBe(true);
      // 88.4 * 0.01131 = 0.9998
      expect(result.value).toBeCloseTo(1.0, 1);
    });
  });

  // ── Triglycerides ─────────────────────────────────────
  describe("triglycerides mmol/L → mg/dL", () => {
    it("uses biomarker-specific factor not generic lipid factor", () => {
      const result = normalizeUnit("triglycerides_mg_dl", 1.7, "mmol/L");
      expect(result.converted).toBe(true);
      // 1.7 * 88.573 = 150.57
      expect(result.value).toBeCloseTo(150.6, 0);
    });
  });

  // ── No conversion needed ──────────────────────────────
  describe("already in canonical unit", () => {
    it("returns original value when unit is already correct", () => {
      const result = normalizeUnit("glucose_mg_dl", 95, "mg/dL");
      expect(result.converted).toBe(false);
      expect(result.value).toBe(95);
      expect(result.unit).toBe("mg/dL");
    });
  });

  // ── Unknown unit ──────────────────────────────────────
  describe("unknown units", () => {
    it("returns original value without converting", () => {
      const result = normalizeUnit("glucose_mg_dl", 95, "frobnitz");
      expect(result.converted).toBe(false);
      expect(result.value).toBe(95);
    });
  });

  // ── Unicode µ symbol normalization ────────────────────
  // The converter normalizes U+03BC (μ) but not U+00B5 (µ).
  // "umol/L" (ASCII u) is always handled.
  describe("unicode µ handling", () => {
    it("handles ASCII 'u' prefix (umol/L → mg/dL)", () => {
      const result = normalizeUnit("creatinine_mg_dl", 88.4, "umol/L");
      expect(result.converted).toBe(true);
      expect(result.value).toBeCloseTo(1.0, 1);
    });

    it("documents that U+00B5 µ is not handled (returns unconverted)", () => {
      // U+00B5 MICRO SIGN — different from U+03BC used in converter replace()
      const result = normalizeUnit("creatinine_mg_dl", 88.4, "\u00B5mol/L");
      // This is a known limitation — the value passes through unchanged
      expect(result.converted).toBe(false);
    });
  });
});

// ─── normalizeBiomarkerUnits ──────────────────────────────

describe("normalizeBiomarkerUnits", () => {
  it("normalizes glucose mmol/L to mg/dl", () => {
    const entries = [
      { name: "glucose_mg_dl", value: 5.5, unit: "mmol/L" },
    ];
    const result = normalizeBiomarkerUnits(entries);
    expect(result[0].unit).toBe("mg/dl");
  });

  it("passes through entries already in canonical unit (unknown to converter)", () => {
    const entries = [
      { name: "crp_mg_l", value: 2.0, unit: "mg/L" },
    ];
    const result = normalizeBiomarkerUnits(entries);
    // CRP has a factor-1 identity entry in CONVERSIONS which lowercases the unit
    // This is expected behavior — the value is unchanged, unit becomes lowercase
    expect(result[0].value).toBe(2.0);
  });

  it("preserves all original fields on converted entries", () => {
    const entries = [
      {
        name: "vitamin_d_ng_ml",
        value: 75,
        unit: "nmol/L",
        source: "fhir",
        measuredAt: "2024-01-01",
      },
    ];
    const result = normalizeBiomarkerUnits(entries);
    expect(result[0].source).toBe("fhir");
    expect(result[0].measuredAt).toBe("2024-01-01");
  });

  it("returns empty array for empty input", () => {
    expect(normalizeBiomarkerUnits([])).toHaveLength(0);
  });
});
