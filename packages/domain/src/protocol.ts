import { BiomarkerValue } from "./biomarker";

export interface ProtocolInput {
  biomarkers: BiomarkerValue[];
  symptoms?: string[];
  goals?: string[];
}

export interface SupplementRecommendation {
  name: string;
  dosage: string;
  timing: "morning" | "midday" | "evening" | "any";
  rationale: string;
}

export interface ProtocolOutput {
  recommendations: SupplementRecommendation[];
  warnings?: string[];
  notes?: string[];
}

export type ProtocolEngine = (input: ProtocolInput) => ProtocolOutput;
