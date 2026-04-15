import type { Rule } from "../types.js";

export const energyRules: Rule[] = [
  {
    id: "energy-coq10",
    name: "CoQ10 for Mitochondrial Energy",
    domain: "energy",
    evaluate(signals) {
      const recovery = signals.find((s) => s.name === "recovery_score");
      const hrv = signals.find((s) => s.name === "hrv_ms");
      const fatigue = signals.find((s) => s.name === "fatigue_score");
      let score = 0;
      if (recovery && recovery.value < 50) score += 0.35;
      if (hrv && hrv.value < 35) score += 0.35;
      if (fatigue && fatigue.value > 6) score += 0.3;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "CoQ10 (Ubiquinol)",
      dosage: "200mg",
      timing: "With breakfast containing fat",
      timeSlot: "morning_with_food" as const,
      rationale:
        "Ubiquinol (reduced CoQ10) is essential for electron transport chain efficiency. Low recovery scores and HRV suggest mitochondrial underfueling.",
    },
    contraindications: ["blood thinners", "warfarin", "chemotherapy"],
  },
  {
    id: "energy-b12",
    name: "B12 for Energy Metabolism",
    domain: "energy",
    evaluate(signals) {
      const b12 = signals.find((s) => s.name === "b12_pg_ml");
      let score = 0;
      if (b12 && b12.value < 300) score = 1.0;
      else if (b12 && b12.value < 500) score = 0.5;
      return score;
    },
    recommendation: {
      name: "Methylcobalamin (B12)",
      dosage: "1000mcg",
      timing: "Morning, sublingual or with breakfast",
      timeSlot: "morning_fasted" as const,
      rationale:
        "Methylcobalamin is the active form of B12, directly entering the methylation cycle. Deficiency causes fatigue, neurological symptoms, and megaloblastic anemia.",
    },
    contraindications: ["leber's disease"],
  },
  {
    id: "energy-iron",
    name: "Iron for Oxygen Delivery",
    domain: "energy",
    evaluate(signals) {
      const ferritin = signals.find((s) => s.name === "ferritin_ng_ml");
      const hemoglobin = signals.find((s) => s.name === "hemoglobin_g_dl");
      let score = 0;
      if (ferritin && ferritin.value < 30) score += 0.5;
      if (hemoglobin && hemoglobin.value < 12) score += 0.5;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Iron Bisglycinate",
      dosage: "18–36mg elemental iron",
      timing: "On empty stomach with Vitamin C",
      timeSlot: "morning_fasted" as const,
      rationale:
        "Low ferritin impairs oxygen transport and mitochondrial function long before anemia develops. Bisglycinate form minimizes GI side effects.",
    },
    contraindications: [
      "hemochromatosis",
      "iron overload",
      "thalassemia",
      "hemolytic anemia",
    ],
  },
];
