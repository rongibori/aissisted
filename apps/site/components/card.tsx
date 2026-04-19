import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Card — content container with one elevation level.
 *
 * Design direction (M2 arbitration): default card carries a single subtle
 * shadow (elevation-1: 0 1px 2px + 0 2px 8px, very understated). This
 * adds depth without floatiness — pairs with the Lemonade breathing-room
 * direction while staying within Brand Bible "precise / minimal" aesthetic.
 *
 * Variants:
 *   default · white surface, hairline border, elevation-1 shadow
 *   flat    · white surface, hairline border only — for densely tiled contexts
 *   data    · midnight surface, white text — data / intelligence panels
 *   ghost   · transparent, hairline border — subtle separation without mass
 *
 * Hover: default + flat cards lift slightly on hover (motion-safe only).
 */

type Variant = "default" | "flat" | "data" | "ghost";

const VARIANTS: Record<Variant, string> = {
  default: "bg-surface border border-line text-ink shadow-[var(--shadow-elevation-1)]",
  flat:    "bg-surface border border-line text-ink",
  data:    "bg-data border border-data text-white",
  ghost:   "bg-transparent border border-line text-ink",
};

const HOVER: Record<Variant, string> = {
  default: "hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:hover:translate-y-0",
  flat:    "hover:border-line-strong motion-reduce:hover:border-line",
  data:    "",
  ghost:   "hover:bg-ink/[0.02]",
};

type Props = {
  as?:      ElementType;
  variant?: Variant;
  padding?: "none" | "sm" | "md" | "lg";
  hover?:   boolean;
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
  hover = false,
  className,
  children,
}: Props) {
  return (
    <As
      className={cn(
        VARIANTS[variant],
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "motion-reduce:transition-none",
        hover && HOVER[variant],
        PADDING[padding],
        className
      )}
    >
      {children}
    </As>
  );
}
