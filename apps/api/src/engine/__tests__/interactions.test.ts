import { describe, it, expect } from "vitest";
import {
  checkInteractions,
  formatInteractionWarnings,
  checkAllergyContraindications,
  formatAllergyWarnings,
  INTERACTIONS,
} from "../interactions.js";

// ─── checkInteractions ────────────────────────────────────

describe("checkInteractions", () => {
  it("detects omega-3 + warfarin interaction", () => {
    const results = checkInteractions(["Omega-3"], ["warfarin"], []);
    expect(results.length).toBeGreaterThan(0);
    const match = results.find(
      (r) =>
        r.supplement.toLowerCase().includes("omega") &&
        r.interactsWith.toLowerCase().includes("warfarin")
    );
    expect(match).toBeDefined();
    expect(match?.severity).toBe("warning");
  });

  it("detects ginkgo + warfarin as contraindicated", () => {
    const results = checkInteractions(["Ginkgo"], ["warfarin"], []);
    const match = results.find((r) => r.severity === "contraindicated");
    expect(match).toBeDefined();
  });

  it("returns empty array when no interactions exist", () => {
    const results = checkInteractions(["Vitamin C"], ["penicillin"], []);
    expect(results).toHaveLength(0);
  });

  it("is case-insensitive for supplement names", () => {
    const lower = checkInteractions(["omega-3"], ["warfarin"], []);
    const upper = checkInteractions(["OMEGA-3"], ["WARFARIN"], []);
    expect(lower.length).toEqual(upper.length);
  });

  it("does not return duplicate interactions", () => {
    const results = checkInteractions(["Omega-3", "Omega-3"], ["warfarin"], []);
    const keys = results.map((r) => `${r.supplement}|${r.interactsWith}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it("detects medication interactions when supplement matches via partial string", () => {
    const results = checkInteractions(["Melatonin"], ["warfarin"], []);
    expect(results.some((r) => r.supplement.toLowerCase().includes("melatonin"))).toBe(true);
  });
});

// ─── formatInteractionWarnings ────────────────────────────

describe("formatInteractionWarnings", () => {
  it("returns human-readable strings for each interaction", () => {
    const interactions = checkInteractions(["Omega-3"], ["warfarin"], []);
    const warnings = formatInteractionWarnings(interactions);
    expect(warnings.length).toBe(interactions.length);
    for (const w of warnings) {
      expect(typeof w).toBe("string");
      expect(w.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array for no interactions", () => {
    expect(formatInteractionWarnings([])).toHaveLength(0);
  });
});

// ─── checkAllergyContraindications ───────────────────────

describe("checkAllergyContraindications", () => {
  it("blocks fish-derived supplements for fish allergy", () => {
    const blocks = checkAllergyContraindications(["Omega-3"], ["fish"]);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].allergen).toBe("fish");
  });

  it("returns empty array when no allergen conflicts", () => {
    const blocks = checkAllergyContraindications(["Magnesium Glycinate"], ["peanuts"]);
    expect(blocks).toHaveLength(0);
  });

  it("is case-insensitive for allergen names", () => {
    const lowerCase = checkAllergyContraindications(["Omega-3"], ["fish"]);
    const upperCase = checkAllergyContraindications(["Omega-3"], ["Fish"]);
    expect(lowerCase.length).toBe(upperCase.length);
  });
});

// ─── formatAllergyWarnings ────────────────────────────────

describe("formatAllergyWarnings", () => {
  it("returns non-empty strings for each block", () => {
    const blocks = checkAllergyContraindications(["Omega-3"], ["fish"]);
    const warnings = formatAllergyWarnings(blocks);
    expect(warnings.length).toBe(blocks.length);
    for (const w of warnings) {
      expect(typeof w).toBe("string");
      expect(w.length).toBeGreaterThan(0);
    }
  });
});

// ─── INTERACTIONS data integrity ──────────────────────────

describe("INTERACTIONS data integrity", () => {
  it("every entry has required fields", () => {
    for (const interaction of INTERACTIONS) {
      expect(typeof interaction.a, "a field").toBe("string");
      expect(typeof interaction.b, "b field").toBe("string");
      expect(["warning", "contraindicated"]).toContain(interaction.severity);
      expect(typeof interaction.description).toBe("string");
      expect(interaction.description.length).toBeGreaterThan(0);
    }
  });

  it("names are stored in lowercase", () => {
    for (const interaction of INTERACTIONS) {
      expect(interaction.a).toBe(interaction.a.toLowerCase());
      expect(interaction.b).toBe(interaction.b.toLowerCase());
    }
  });
});
