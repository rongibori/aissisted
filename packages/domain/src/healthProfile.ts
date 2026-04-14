import { BiomarkerValue } from "./biomarker";

export interface HealthProfile {
  userId: string;
  createdAt: string;
  updatedAt: string;

  demographics: {
    age?: number;
    sex?: "male" | "female" | "other";
    heightCm?: number;
    weightKg?: number;
  };

  lifestyle: {
    sleepHours?: number;
    activityLevel?: "low" | "moderate" | "high";
    dietType?: string;
  };

  conditions: string[];
  medications: string[];

  biomarkers: BiomarkerValue[];

  goals: string[];
}
