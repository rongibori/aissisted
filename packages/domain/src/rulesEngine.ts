import { ProtocolInput, ProtocolOutput, SupplementRecommendation } from "./protocol";

function findBiomarker(input: ProtocolInput, code: string) {
  return input.biomarkers?.find((b) => b.code === code);
}

export function runProtocolRules(input: ProtocolInput): ProtocolOutput {
  const recommendations: SupplementRecommendation[] = [];
  const notes: string[] = [];
  const warnings: string[] = [];

  const ldl = findBiomarker(input, "LDL");
  const triglycerides = findBiomarker(input, "TRIGLYCERIDES");
  const vitaminD = findBiomarker(input, "VITAMIN_D");
  const hrv = findBiomarker(input, "HRV");

  if (ldl && Number(ldl.value) > 160) {
    recommendations.push({
      name: "Omega-3",
      dosage: "2000 mg daily",
      timing: "morning",
      rationale: "Supports cardiovascular health in the setting of elevated LDL.",
    });
  }

  if (triglycerides && Number(triglycerides.value) > 150) {
    recommendations.push({
      name: "Curcumin",
      dosage: "500 mg daily",
      timing: "midday",
      rationale: "May support inflammation balance and metabolic health alongside elevated triglycerides.",
    });
    notes.push("Elevated triglycerides may indicate nutrition, insulin sensitivity, or recovery issues.");
  }

  if (vitaminD && Number(vitaminD.value) < 30) {
    recommendations.push({
      name: "Vitamin D3",
      dosage: "2000 IU daily",
      timing: "morning",
      rationale: "Supports vitamin D restoration when levels are below target.",
    });
  }

  if (hrv && Number(hrv.value) < 40) {
    recommendations.push({
      name: "Magnesium Glycinate",
      dosage: "300 mg nightly",
      timing: "evening",
      rationale: "May support relaxation, sleep quality, and autonomic recovery when HRV is suppressed.",
    });
    notes.push("Low HRV may reflect stress load, poor sleep, illness, or recovery debt.");
  }

  if (!recommendations.length) {
    warnings.push("No matching protocol rules fired. More biomarker inputs or symptoms may be needed.");
  }

  return { recommendations, notes, warnings };
}
