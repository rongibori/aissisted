import { ProtocolOutput } from "./protocol";
import { SupplementStack } from "./supplement";

export function buildStack(userId: string, output: ProtocolOutput): SupplementStack {
  const items = output.recommendations.map((rec, index) => ({
    id: `${userId}-${index}`,
    name: rec.name,
    timing: rec.timing,
    dosage: rec.dosage,
    rationale: rec.rationale,
  }));

  return {
    userId,
    generatedAt: new Date().toISOString(),
    items,
    summary: "Personalized supplement stack generated from biomarker inputs.",
  };
}
