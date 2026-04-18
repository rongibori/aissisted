/**
 * cn — class composition utility.
 *
 * Intentionally zero-dep. We don't pull clsx or tailwind-merge here because:
 *   1. apps/site is Tailwind v4 CSS-first; token-based utilities rarely collide
 *      the way v3 arbitrary-value chains did.
 *   2. Every extra dep is brand-discipline overhead. If merge semantics become
 *      necessary later (conflicting utilities at runtime), we reach for
 *      tailwind-merge then — not now.
 *
 * Accepts: strings, falsy values, and nested arrays. Mirrors clsx surface.
 */

type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (typeof value === "string") {
      if (value.length > 0) out.push(value);
      return;
    }
    if (typeof value === "number") {
      out.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
    }
  };

  for (const input of inputs) walk(input);
  return out.join(" ");
}
