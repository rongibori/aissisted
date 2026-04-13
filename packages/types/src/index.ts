export type Sex = "male" | "female" | "other";

export interface HealthProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: Sex;
  goals: string[];
  conditions: string[];
  medications: string[];
  supplements: string[];
}

export interface BiomarkerReading {
  name: string;
  value: number;
  unit: string;
  measuredAt: string;
  source?: string;
}

export interface WearableSample {
  source: "whoop" | "oura" | "apple_health";
  metric: string;
  value: number;
  measuredAt: string;
}

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: string;
  rationale: string;
}

export interface ProtocolRecommendation {
  summary: string;
  recommendations: SupplementRecommendation[];
}
