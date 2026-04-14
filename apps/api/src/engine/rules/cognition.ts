import type { Rule } from "../types.js";

export const cognitionRules: Rule[] = [
  {
    id: "cognition-lions-mane",
    name: "Lion's Mane for Neurogenesis",
    domain: "cognition",
    evaluate(signals) {
      const goals = signals.filter(
        (s) =>
          s.source === "goal" &&
          (s.name.includes("focus") ||
            s.name.includes("memory") ||
            s.name.includes("cognition"))
      );
      return goals.length > 0 ? 0.8 : 0;
    },
    recommendation: {
      name: "Lion's Mane Mushroom",
      dosage: "1000mg",
      timing: "Morning with breakfast",
      timeSlot: "morning_with_food" as const,
      rationale:
        "Lion's Mane stimulates NGF (nerve growth factor) synthesis, promoting neuroplasticity and myelination. Backed by RCTs showing improved mild cognitive impairment.",
    },
    contraindications: ["mushroom allergies", "bleeding disorders"],
  },
  {
    id: "cognition-bacopa",
    name: "Bacopa for Memory Consolidation",
    domain: "cognition",
    evaluate(signals) {
      const goals = signals.filter(
        (s) =>
          s.source === "goal" &&
          (s.name.includes("memory") || s.name.includes("learning"))
      );
      return goals.length > 0 ? 0.75 : 0;
    },
    recommendation: {
      name: "Bacopa Monnieri (55% Bacosides)",
      dosage: "300mg",
      timing: "With dinner (takes 8–12 weeks for full effect)",
      timeSlot: "evening" as const,
      rationale:
        "Bacopa modulates acetylcholine and serotonin, reduces beta-amyloid deposits, and improves memory consolidation. Effects are cumulative over 12 weeks.",
    },
    contraindications: ["bradycardia", "thyroid medications", "anticholinergics"],
  },
  {
    id: "cognition-alpha-gpc",
    name: "Alpha-GPC for Acetylcholine",
    domain: "cognition",
    evaluate(signals) {
      const choline = signals.find((s) => s.name === "choline_umol_l");
      const goals = signals.filter(
        (s) => s.source === "goal" && s.name.includes("focus")
      );
      let score = 0;
      if (choline && choline.value < 8) score += 0.5;
      if (goals.length > 0) score += 0.4;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Alpha-GPC",
      dosage: "300mg",
      timing: "Morning or pre-workout",
      timeSlot: "morning_fasted" as const,
      rationale:
        "Alpha-GPC crosses the blood-brain barrier and directly raises acetylcholine levels, enhancing working memory, attention, and processing speed.",
    },
    contraindications: ["cholinergic medications", "scopolamine"],
  },
];
