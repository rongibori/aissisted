import type { Rule } from "../types.js";

export const hormoneRules: Rule[] = [
  {
    id: "hormones-zinc",
    name: "Zinc for Testosterone Support",
    domain: "hormones",
    evaluate(signals) {
      const testosterone = signals.find(
        (s) => s.name === "testosterone_ng_dl" || s.name === "total_testosterone"
      );
      const zinc = signals.find((s) => s.name === "zinc_mcg_dl");
      let score = 0;
      if (testosterone && testosterone.value < 400) score += 0.5;
      if (zinc && zinc.value < 70) score += 0.5;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Zinc Bisglycinate",
      dosage: "30mg",
      timing: "Before bed or with dinner",
      timeSlot: "presleep" as const,
      rationale:
        "Zinc is essential for LH receptor function and testosterone synthesis. Deficiency directly impairs the HPG axis.",
    },
    contraindications: ["copper deficiency at high doses", "penicillamine"],
  },
  {
    id: "hormones-ashwagandha",
    name: "Ashwagandha for Cortisol/Testosterone Balance",
    domain: "hormones",
    evaluate(signals) {
      const cortisol = signals.find((s) => s.name === "cortisol_mcg_dl");
      const recovery = signals.find((s) => s.name === "recovery_score");
      let score = 0;
      if (cortisol && cortisol.value > 20) score += 0.5;
      if (recovery && recovery.value < 50) score += 0.5;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Ashwagandha (KSM-66)",
      dosage: "600mg",
      timing: "With dinner",
      timeSlot: "evening" as const,
      rationale:
        "KSM-66 ashwagandha reduces cortisol by ~27% in clinical trials and has been shown to increase testosterone by 17% in men with elevated stress markers.",
    },
    contraindications: [
      "thyroid disorders",
      "autoimmune disease",
      "pregnancy",
      "sedatives",
    ],
  },
  {
    id: "hormones-dhea",
    name: "DHEA-S Optimization",
    domain: "hormones",
    evaluate(signals) {
      const dhea = signals.find((s) => s.name === "dhea_s_mcg_dl");
      if (!dhea) return 0;
      // Age-adjusted — flag if low-normal or below
      if (dhea.value < 100) return 0.9;
      if (dhea.value < 150) return 0.5;
      return 0;
    },
    recommendation: {
      name: "DHEA",
      dosage: "25mg",
      timing: "With morning meal",
      timeSlot: "morning_with_food" as const,
      rationale:
        "Low DHEA-S is associated with accelerated aging, low energy, and poor recovery. DHEA is a precursor to both testosterone and estrogen.",
    },
    contraindications: [
      "hormone-sensitive cancers",
      "PCOS",
      "adrenal tumors",
      "pregnancy",
    ],
  },
];
