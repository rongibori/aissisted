import { SupplementStack } from "./supplement";

export interface ProductBundle {
  userId: string;
  createdAt: string;
  morningPack: string[];
  eveningPack: string[];
}

export function buildProductBundle(stack: SupplementStack): ProductBundle {
  const morningPack: string[] = [];
  const eveningPack: string[] = [];

  for (const item of stack.items) {
    if (item.timing === "morning") {
      morningPack.push(item.name);
    } else if (item.timing === "evening") {
      eveningPack.push(item.name);
    }
  }

  return {
    userId: stack.userId,
    createdAt: new Date().toISOString(),
    morningPack,
    eveningPack,
  };
}
