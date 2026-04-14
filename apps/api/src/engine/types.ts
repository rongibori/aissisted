export interface Signal {
  name: string;
  value: number;
  unit?: string;
  source: "biomarker" | "wearable" | "symptom" | "goal";
}

export type TimeSlot =
  | "morning_fasted"
  | "morning_with_food"
  | "midday"
  | "afternoon"
  | "evening"
  | "presleep";

export interface Rule {
  id: string;
  name: string;
  domain: "sleep" | "inflammation" | "hormones" | "energy" | "cognition" | "cardiovascular" | "metabolic";
  // Returns a score 0-1 based on signals. 0 = not applicable, 1 = strongly applicable.
  evaluate: (signals: Signal[]) => number;
  recommendation: {
    name: string;
    dosage: string;
    timing: string;
    timeSlot: TimeSlot;
    rationale: string;
  };
  contraindications: string[]; // medication/condition names that block this rule
}

export interface ScoredRecommendation {
  rule: Rule;
  score: number;
  recommendation: Rule["recommendation"];
}
