import { describe, it, expect } from "vitest";
import { getRangeStatus, BIOMARKER_RANGES } from "../biomarker-ranges.js";

describe("getRangeStatus", () => {
  // ── Vitamin D ───────────────────────────────────────────
  describe("vitamin_d_ng_ml", () => {
    it("returns 'low' when below normal range", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 20).status).toBe("low");
    });

    it("returns 'optimal' when in optimal range", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 55).status).toBe("optimal");
    });

    it("returns 'high' when above normal range", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 110).status).toBe("high");
    });

    it("returns isCritical=true when critically high", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 200).isCritical).toBe(true);
    });

    it("returns isCritical=false for normal values", () => {
      expect(getRangeStatus("vitamin_d_ng_ml", 50).isCritical).toBe(false);
    });
  });

  // ── LDL ────────────────────────────────────────────────
  // LDL has low=0 (no low threshold defined) and optimalHigh=70, highNormal=100
  describe("ldl_mg_dl", () => {
    it("returns 'optimal' when in optimal range (≤70)", () => {
      expect(getRangeStatus("ldl_mg_dl", 40).status).toBe("optimal");
    });

    it("returns 'optimal' at exactly the optimal ceiling", () => {
      expect(getRangeStatus("ldl_mg_dl", 70).status).toBe("optimal");
    });

    it("returns 'high' when above high normal (>100)", () => {
      expect(getRangeStatus("ldl_mg_dl", 200).status).toBe("high");
    });

    it("marks critically high LDL", () => {
      expect(getRangeStatus("ldl_mg_dl", 200).isCritical).toBe(true);
    });
  });

  // ── Unknown biomarker ──────────────────────────────────
  describe("unknown biomarker", () => {
    it("returns 'unknown' status for unrecognized names", () => {
      expect(getRangeStatus("not_a_real_biomarker", 42).status).toBe("unknown");
    });

    it("returns isCritical=false for unrecognized names", () => {
      expect(getRangeStatus("not_a_real_biomarker", 42).isCritical).toBe(false);
    });
  });

  // ── B12 ────────────────────────────────────────────────
  describe("b12_pg_ml", () => {
    it("returns 'low' below normal", () => {
      expect(getRangeStatus("b12_pg_ml", 150).status).toBe("low");
    });

    it("marks critically low B12", () => {
      expect(getRangeStatus("b12_pg_ml", 90).isCritical).toBe(true);
    });

    it("returns 'optimal' in good range", () => {
      expect(getRangeStatus("b12_pg_ml", 500).status).toBe("optimal");
    });
  });

  // ── TSH ────────────────────────────────────────────────
  describe("tsh_miu_l", () => {
    it("returns 'optimal' for normal TSH", () => {
      expect(getRangeStatus("tsh_miu_l", 2.0).status).toBe("optimal");
    });

    it("returns 'high' for elevated TSH", () => {
      expect(getRangeStatus("tsh_miu_l", 8).status).toBe("high");
    });
  });
});

// ─── BIOMARKER_RANGES completeness ────────────────────────

describe("BIOMARKER_RANGES", () => {
  it("every range has required fields", () => {
    for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
      expect(typeof range.unit, `${name}.unit`).toBe("string");
      expect(typeof range.low, `${name}.low`).toBe("number");
      expect(typeof range.highNormal, `${name}.highNormal`).toBe("number");
      expect(range.low, `${name}: low < highNormal`).toBeLessThan(range.highNormal);
    }
  });

  it("optional optimal range is internally consistent when defined", () => {
    for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
      if (range.optimalLow !== undefined && range.optimalHigh !== undefined) {
        expect(range.optimalLow, `${name}: optimalLow < optimalHigh`).toBeLessThan(
          range.optimalHigh
        );
      }
    }
  });

  it("critical bounds are more extreme than normal bounds when defined", () => {
    for (const [name, range] of Object.entries(BIOMARKER_RANGES)) {
      if (range.criticalLow !== undefined) {
        expect(range.criticalLow, `${name}: criticalLow <= low`).toBeLessThanOrEqual(range.low);
      }
      if (range.criticalHigh !== undefined) {
        expect(range.criticalHigh, `${name}: criticalHigh >= highNormal`).toBeGreaterThanOrEqual(
          range.highNormal
        );
      }
    }
  });
});
