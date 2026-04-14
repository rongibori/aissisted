import type { Rule } from "../types.js";

export const inflammationRules: Rule[] = [
  {
    id: "inflammation-omega3",
    name: "Omega-3 for Inflammation",
    domain: "inflammation",
    evaluate(signals) {
      const crp = signals.find((s) => s.name === "crp_mg_l");
      const hscrp = signals.find((s) => s.name === "hs_crp_mg_l");
      let score = 0;
      if (crp && crp.value > 1.0) score += 0.5;
      if (hscrp && hscrp.value > 1.0) score += 0.5;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Omega-3 (EPA/DHA)",
      dosage: "2–3g EPA+DHA",
      timing: "With largest meal of the day",
      rationale:
        "Elevated CRP indicates systemic inflammation. EPA and DHA are precursors to anti-inflammatory resolvins and protectins, reducing NF-κB signaling.",
    },
    contraindications: ["blood thinners", "warfarin", "bleeding disorders"],
  },
  {
    id: "inflammation-curcumin",
    name: "Curcumin for Chronic Inflammation",
    domain: "inflammation",
    evaluate(signals) {
      const crp = signals.find((s) => s.name === "crp_mg_l");
      const il6 = signals.find((s) => s.name === "il6_pg_ml");
      let score = 0;
      if (crp && crp.value > 3.0) score += 0.6;
      if (il6 && il6.value > 3.0) score += 0.4;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Curcumin (with Piperine)",
      dosage: "500mg curcumin + 5mg piperine",
      timing: "Twice daily with food",
      rationale:
        "Curcumin inhibits NF-κB and COX-2 pathways. Piperine increases bioavailability by 2000%. Indicated by markedly elevated CRP or IL-6.",
    },
    contraindications: ["gallbladder disease", "blood thinners", "pregnancy"],
  },
  {
    id: "inflammation-vitd",
    name: "Vitamin D3 for Immune Modulation",
    domain: "inflammation",
    evaluate(signals) {
      const vitD = signals.find(
        (s) => s.name === "vitamin_d_ng_ml" || s.name === "25_oh_d"
      );
      if (!vitD) return 0;
      if (vitD.value < 20) return 1.0;
      if (vitD.value < 30) return 0.7;
      if (vitD.value < 40) return 0.3;
      return 0;
    },
    recommendation: {
      name: "Vitamin D3 + K2",
      dosage: "5000 IU D3 + 100mcg K2 MK-7",
      timing: "With morning meal containing fat",
      rationale:
        "Vitamin D deficiency is strongly associated with dysregulated immune response and elevated inflammatory markers. K2 directs calcium to bones, preventing arterial calcification.",
    },
    contraindications: [
      "hypercalcemia",
      "sarcoidosis",
      "granulomatous disease",
    ],
  },
];
