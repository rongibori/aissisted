import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Card — minimal content container, one-border-no-shadow aesthetic.
 *
 * Brand Bible: "design that feels like luxury; simplicity that feels effortless."
 * No drop shadows at M2. A single hairline border is the only elevation signal.
 *
 * Variants:
 *   default · white surface, hairline line border — standard content
 *   data    · midnight surface, white text — data / intelligence panels
 *   ghost   · transparent, hairline border — subtle separation without mass
 */

type Variant = "default" | "data" | "ghost";

const VARIANTS: Record<Variant, string> = {
  default: "bg-surface border border-line text-ink",
  data:    "bg-data border border-data text-white",
  ghost:   "bg-transparent border border-line text-ink",
};

type Props = {
  as?:      ElementType;
  variant?: Variant;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children:  ReactNode;
};

const PADDING: Record<NonNullable<Props["padding"]>, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export function Card({
  as: As = "div",
  variant = "default",
  padding = "md",
  className,
  children,
}: Props) {
  return (
    <As
      className={cn(
        VARIANTS[variant],
        PADDING[padding],
        className
      )}
    >
      {children}
    </As>
  );
}
