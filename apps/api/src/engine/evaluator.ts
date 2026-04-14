import type { Signal, ScoredRecommendation } from "./types.js";
import { getAllRules } from "./registry.js";

const SCORE_THRESHOLD = 0.2;

export function evaluate(
  signals: Signal[],
  userConditions: string[],
  userMedications: string[]
): ScoredRecommendation[] {
  const blockedTerms = [
    ...userConditions.map((c) => c.toLowerCase()),
    ...userMedications.map((m) => m.toLowerCase()),
  ];

  const results: ScoredRecommendation[] = [];

  for (const rule of getAllRules()) {
    // Check contraindications
    const blocked = rule.contraindications.some((ci) =>
      blockedTerms.some((term) => term.includes(ci.toLowerCase()) || ci.toLowerCase().includes(term))
    );
    if (blocked) continue;

    const score = rule.evaluate(signals);
    if (score >= SCORE_THRESHOLD) {
      results.push({ rule, score, recommendation: rule.recommendation });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

export function buildSignalsFromBiomarkers(
  biomarkers: { name: string; value: number; unit: string }[]
): Signal[] {
  return biomarkers.map((b) => ({
    name: b.name,
    value: b.value,
    unit: b.unit,
    source: "biomarker" as const,
  }));
}

export function buildSignalsFromWearables(
  wearables: { metric: string; value: number }[]
): Signal[] {
  return wearables.map((w) => ({
    name: w.metric,
    value: w.value,
    source: "wearable" as const,
  }));
}

export function buildSignalsFromGoals(goals: string[]): Signal[] {
  return goals.map((g) => ({
    name: g.toLowerCase().replace(/\s+/g, "_"),
    value: 1,
    source: "goal" as const,
  }));
}
