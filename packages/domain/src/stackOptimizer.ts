import { SupplementStack } from "./supplement";

export function optimizeStack(stack: SupplementStack): SupplementStack {
  const seen = new Set<string>();
  const optimizedItems = [];

  for (const item of stack.items) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      optimizedItems.push(item);
    }
  }

  return {
    ...stack,
    items: optimizedItems,
    summary: "Optimized stack with duplicate supplements removed.",
  };
}

export function detectConflicts(stack: SupplementStack): string[] {
  const conflicts: string[] = [];

  const hasMagnesium = stack.items.find((i) => i.name.toLowerCase().includes("magnesium"));
  const hasZinc = stack.items.find((i) => i.name.toLowerCase().includes("zinc"));

  if (hasMagnesium && hasZinc) {
    conflicts.push("Magnesium and Zinc may compete for absorption if taken together. Consider separating timing.");
  }

  return conflicts;
}
