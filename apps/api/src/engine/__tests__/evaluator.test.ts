import { describe, it, expect } from "vitest";
import {
  evaluate,
  buildSignalsFromBiomarkers,
  buildSignalsFromWearables,
  buildSignalsFromGoals,
} from "../evaluator.js";
import type { Signal } from "../types.js";

// ─── buildSignalsFromBiomarkers ───────────────────────────

describe("buildSignalsFromBiomarkers", () => {
  it("maps biomarker objects to Signal shape", () => {
    const signals = buildSignalsFromBiomarkers([
      { name: "vitamin_d_ng_ml", value: 22, unit: "ng/mL" },
    ]);
    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      name: "vitamin_d_ng_ml",
      value: 22,
      unit: "ng/mL",
      source: "biomarker",
    });
  });

  it("returns empty array for no inputs", () => {
    expect(buildSignalsFromBiomarkers([])).toHaveLength(0);
  });
});

// ─── buildSignalsFromWearables ────────────────────────────

describe("buildSignalsFromWearables", () => {
  it("maps wearable entries to Signal shape", () => {
    const signals = buildSignalsFromWearables([
      { metric: "hrv_ms", value: 35 },
      { metric: "recovery_score", value: 55 },
    ]);
    expect(signals).toHaveLength(2);
    expect(signals[0]).toMatchObject({ name: "hrv_ms", value: 35, source: "wearable" });
    expect(signals[1]).toMatchObject({ name: "recovery_score", value: 55, source: "wearable" });
  });
});

// ─── buildSignalsFromGoals ────────────────────────────────

describe("buildSignalsFromGoals", () => {
  it("lowercases and underscores goal strings", () => {
    const signals = buildSignalsFromGoals(["Better Sleep", "Lose Weight"]);
    expect(signals[0]).toMatchObject({ name: "better_sleep", value: 1, source: "goal" });
    expect(signals[1]).toMatchObject({ name: "lose_weight", value: 1, source: "goal" });
  });
});

// ─── evaluate ────────────────────────────────────────────

describe("evaluate", () => {
  it("returns scored recommendations for matching signals", () => {
    const signals: Signal[] = [
      { name: "hrv_ms", value: 30, source: "wearable" },       // low HRV → sleep rules fire
      { name: "sleep_score", value: 55, source: "wearable" },  // low sleep score
    ];
    const results = evaluate(signals, [], []);
    expect(results.length).toBeGreaterThan(0);
    // Results are sorted by score descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("scores are between 0 and 1 inclusive", () => {
    const signals: Signal[] = [
      { name: "hrv_ms", value: 25, source: "wearable" },
      { name: "sleep_latency_min", value: 45, source: "wearable" },
      { name: "recovery_score", value: 40, source: "wearable" },
      { name: "crp_mg_l", value: 5, source: "biomarker" },
    ];
    const results = evaluate(signals, [], []);
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });

  it("filters out rules blocked by user conditions", () => {
    const signals: Signal[] = [
      { name: "hrv_ms", value: 25, source: "wearable" },
    ];
    // "kidney disease" is a contraindication for sleep-magnesium
    const withoutBlock = evaluate(signals, [], []);
    const withBlock = evaluate(signals, ["kidney disease"], []);

    const hasMagnesium = (results: ReturnType<typeof evaluate>) =>
      results.some((r) => r.recommendation.name === "Magnesium Glycinate");

    expect(hasMagnesium(withoutBlock)).toBe(true);
    expect(hasMagnesium(withBlock)).toBe(false);
  });

  it("filters out rules blocked by user medications", () => {
    const signals: Signal[] = [
      { name: "sleep_latency_min", value: 45, source: "wearable" },
    ];
    // melatonin is contraindicated with warfarin
    const withMed = evaluate(signals, [], ["warfarin"]);
    const hasMelatonin = withMed.some((r) => r.recommendation.name === "Melatonin");
    expect(hasMelatonin).toBe(false);
  });

  it("returns empty array when no signals match any rules", () => {
    const signals: Signal[] = [
      { name: "completely_unknown_signal", value: 999, source: "biomarker" },
    ];
    const results = evaluate(signals, [], []);
    expect(results).toHaveLength(0);
  });

  it("deduplicates contraindication matching case-insensitively", () => {
    const signals: Signal[] = [
      { name: "hrv_ms", value: 25, source: "wearable" },
    ];
    // "Kidney Disease" (capitalized) should still block
    const withBlock = evaluate(signals, ["Kidney Disease"], []);
    const hasMagnesium = withBlock.some((r) => r.recommendation.name === "Magnesium Glycinate");
    expect(hasMagnesium).toBe(false);
  });
});
