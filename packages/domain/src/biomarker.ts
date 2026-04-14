export type BiomarkerCategory =
  | "lipids"
  | "metabolic"
  | "hormonal"
  | "inflammation"
  | "renal"
  | "hepatic"
  | "hematologic"
  | "vitamin"
  | "custom";

export type BiomarkerDirection = "low" | "optimal" | "high" | "critical" | "unknown";

export interface ReferenceRange {
  low?: number;
  high?: number;
  unit: string;
  source?: string;
}

export interface BiomarkerValue {
  code: string;
  name: string;
  category: BiomarkerCategory;
  value: number | string;
  unit: string;
  observedAt: string;
  source: "lab" | "wearable" | "manual" | "derived";
  direction: BiomarkerDirection;
  referenceRange?: ReferenceRange;
  notes?: string;
}

export interface BiomarkerTrend {
  code: string;
  label: string;
  samples: BiomarkerValue[];
  trend: "improving" | "worsening" | "stable" | "insufficient_data";
  summary?: string;
}
