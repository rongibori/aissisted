import { SupplementStack } from "./supplement";

export function evaluateClinicalSafety(stack: SupplementStack, medications: string[] = []): string[] {
  const warnings: string[] = [];

  const hasOmega3 = stack.items.find((i) => i.name.toLowerCase().includes("omega"));

  if (hasOmega3 && medications.some((m) => m.toLowerCase().includes("blood thinner"))) {
    warnings.push("Omega-3 may increase bleeding risk when combined with blood thinners.");
  }

  const hasMagnesium = stack.items.find((i) => i.name.toLowerCase().includes("magnesium"));

  if (hasMagnesium && medications.some((m) => m.toLowerCase().includes("antibiotic"))) {
    warnings.push("Magnesium may interfere with absorption of certain antibiotics if taken together.");
  }

  return warnings;
}
