import { describe, it, expect } from "vitest";
import { sleepRules } from "../sleep.js";
import type { Signal } from "../../types.js";

function sig(name: string, value: number): Signal {
  return { name, value, source: "wearable" };
}

describe("sleepRules", () => {
  it("exports exactly 3 rules", () => {
    expect(sleepRules).toHaveLength(3);
  });

  it("all rules have required fields", () => {
    for (const rule of sleepRules) {
      expect(typeof rule.id).toBe("string");
      expect(typeof rule.name).toBe("string");
      expect(typeof rule.domain).toBe("string");
      expect(typeof rule.evaluate).toBe("function");
      expect(typeof rule.recommendation.name).toBe("string");
      expect(typeof rule.recommendation.dosage).toBe("string");
      expect(Array.isArray(rule.contraindications)).toBe(true);
    }
  });

  // ── sleep-magnesium ─────────────────────────────────────
  describe("sleep-magnesium", () => {
    const rule = sleepRules.find((r) => r.id === "sleep-magnesium")!;

    it("scores high when both HRV and sleep score are low", () => {
      const score = rule.evaluate([sig("hrv_ms", 30), sig("sleep_score", 60)]);
      expect(score).toBe(1.0);
    });

    it("scores 0.5 when only HRV is low", () => {
      const score = rule.evaluate([sig("hrv_ms", 30)]);
      expect(score).toBe(0.5);
    });

    it("scores 0.5 when only sleep score is low", () => {
      const score = rule.evaluate([sig("sleep_score", 60)]);
      expect(score).toBe(0.5);
    });

    it("scores 0 when both values are normal", () => {
      const score = rule.evaluate([sig("hrv_ms", 55), sig("sleep_score", 80)]);
      expect(score).toBe(0);
    });

    it("scores 0 with no signals", () => {
      expect(rule.evaluate([])).toBe(0);
    });

    it("is capped at 1.0 regardless of inputs", () => {
      const score = rule.evaluate([
        sig("hrv_ms", 10),
        sig("sleep_score", 10),
      ]);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it("recommends Magnesium Glycinate", () => {
      expect(rule.recommendation.name).toBe("Magnesium Glycinate");
    });

    it("has kidney disease as a contraindication", () => {
      expect(rule.contraindications).toContain("kidney disease");
    });
  });

  // ── sleep-melatonin ─────────────────────────────────────
  describe("sleep-melatonin", () => {
    const rule = sleepRules.find((r) => r.id === "sleep-melatonin")!;

    it("scores 1.0 when latency > 30 and sleep score < 60", () => {
      const score = rule.evaluate([
        sig("sleep_latency_min", 40),
        sig("sleep_score", 55),
      ]);
      expect(score).toBe(1.0);
    });

    it("scores 0.6 on latency alone", () => {
      const score = rule.evaluate([sig("sleep_latency_min", 40)]);
      expect(score).toBe(0.6);
    });

    it("scores 0 when latency and sleep are normal", () => {
      const score = rule.evaluate([
        sig("sleep_latency_min", 15),
        sig("sleep_score", 85),
      ]);
      expect(score).toBe(0);
    });

    it("has presleep time slot", () => {
      expect(rule.recommendation.timeSlot).toBe("presleep");
    });

    it("includes warfarin as contraindication", () => {
      expect(rule.contraindications).toContain("warfarin");
    });
  });

  // ── sleep-l-theanine ────────────────────────────────────
  describe("sleep-l-theanine", () => {
    const rule = sleepRules.find((r) => r.id === "sleep-l-theanine")!;

    it("scores 1.0 when HRV < 50 and recovery < 60", () => {
      const score = rule.evaluate([
        sig("hrv_ms", 40),
        sig("recovery_score", 55),
      ]);
      expect(score).toBe(1.0);
    });

    it("scores 0 when both are in range", () => {
      const score = rule.evaluate([
        sig("hrv_ms", 60),
        sig("recovery_score", 70),
      ]);
      expect(score).toBe(0);
    });

    it("has no contraindications", () => {
      expect(rule.contraindications).toHaveLength(0);
    });

    it("recommends L-Theanine at 200mg", () => {
      expect(rule.recommendation.name).toBe("L-Theanine");
      expect(rule.recommendation.dosage).toBe("200mg");
    });
  });
});
