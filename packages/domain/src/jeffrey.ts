import { ProtocolInput } from "./protocol";

export interface JeffreyRequest {
  userId: string;
  message: string;
  context?: {
    symptoms?: string[];
    goals?: string[];
  };
}

export interface JeffreyIntent {
  type: "sleep" | "energy" | "stress" | "recovery" | "general";
  protocolInput: ProtocolInput;
}

export function parseJeffreyRequest(request: JeffreyRequest): JeffreyIntent {
  const normalized = request.message.toLowerCase();

  if (normalized.includes("sleep") || normalized.includes("tired") || normalized.includes("insomnia")) {
    return {
      type: "sleep",
      protocolInput: {
        biomarkers: [{ code: "HRV", name: "HRV", category: "custom", value: 35, unit: "ms", observedAt: new Date().toISOString(), source: "derived", direction: "low" }],
        symptoms: request.context?.symptoms || ["fatigue", "poor sleep"],
        goals: request.context?.goals || ["better sleep", "more recovery"],
      },
    };
  }

  if (normalized.includes("energy") || normalized.includes("focus")) {
    return {
      type: "energy",
      protocolInput: {
        biomarkers: [],
        symptoms: request.context?.symptoms || ["low energy"],
        goals: request.context?.goals || ["more focus", "better daytime performance"],
      },
    };
  }

  return {
    type: "general",
    protocolInput: {
      biomarkers: [],
      symptoms: request.context?.symptoms || [],
      goals: request.context?.goals || [],
    },
  };
}
