export interface Signal {
  name: string;
  value: number;
  unit?: string;
  source: "biomarker" | "wearable" | "symptom" | "goal";
}

export interface Rule {
  id: string;
  name: string;
  domain: "sleep" | "inflammation" | "hormones" | "energy" | "cognition";
  // Returns a score 0-1 based on signals. 0 = not applicable, 1 = strongly applicable.
  evaluate: (signals: Signal[]) => number;
  recommendation: {
    name: string;
    dosage: string;
    timing: string;
    rationale: string;
  };
  contraindications: string[]; // medication/condition names that block this rule
}

export interface ScoredRecommendation {
  rule: Rule;
  score: number;
  recommendation: Rule["recommendation"];
}
