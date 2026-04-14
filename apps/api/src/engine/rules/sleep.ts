import type { Rule } from "../types.js";

export const sleepRules: Rule[] = [
  {
    id: "sleep-magnesium",
    name: "Magnesium for Sleep",
    domain: "sleep",
    evaluate(signals) {
      const hrv = signals.find((s) => s.name === "hrv_ms");
      const sleepScore = signals.find((s) => s.name === "sleep_score");
      let score = 0;
      if (hrv && hrv.value < 40) score += 0.5;
      if (sleepScore && sleepScore.value < 70) score += 0.5;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Magnesium Glycinate",
      dosage: "400mg",
      timing: "30 minutes before bed",
      timeSlot: "presleep" as const,
      rationale:
        "Magnesium glycinate supports GABA receptor activity, reduces cortisol, and promotes deep sleep. Indicated by low HRV and poor sleep quality scores.",
    },
    contraindications: ["kidney disease", "hypermagnesemia"],
  },
  {
    id: "sleep-melatonin",
    name: "Melatonin for Sleep Onset",
    domain: "sleep",
    evaluate(signals) {
      const sleepLatency = signals.find((s) => s.name === "sleep_latency_min");
      const sleepScore = signals.find((s) => s.name === "sleep_score");
      let score = 0;
      if (sleepLatency && sleepLatency.value > 30) score += 0.6;
      if (sleepScore && sleepScore.value < 60) score += 0.4;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "Melatonin",
      dosage: "0.5–1mg",
      timing: "60 minutes before target sleep time",
      timeSlot: "presleep" as const,
      rationale:
        "Low-dose melatonin advances circadian phase and reduces sleep onset latency without suppressing endogenous melatonin production.",
    },
    contraindications: ["autoimmune disease", "warfarin", "immunosuppressants"],
  },
  {
    id: "sleep-l-theanine",
    name: "L-Theanine for Sleep Quality",
    domain: "sleep",
    evaluate(signals) {
      const hrv = signals.find((s) => s.name === "hrv_ms");
      const recovery = signals.find((s) => s.name === "recovery_score");
      let score = 0;
      if (hrv && hrv.value < 50) score += 0.4;
      if (recovery && recovery.value < 60) score += 0.6;
      return Math.min(score, 1);
    },
    recommendation: {
      name: "L-Theanine",
      dosage: "200mg",
      timing: "1 hour before bed",
      timeSlot: "presleep" as const,
      rationale:
        "L-Theanine promotes alpha brain wave activity and reduces anxiety without sedation, improving sleep quality and morning recovery scores.",
    },
    contraindications: [],
  },
];
