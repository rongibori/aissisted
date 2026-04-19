import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Container — single source of page gutters + max-widths.
 * Every section uses one of these; no bespoke max-w or px values elsewhere.
 */

type Width = "narrow" | "reading" | "wide" | "full";

const WIDTHS: Record<Width, string> = {
  narrow: "max-w-2xl", // ~672px · narrow text, forms
  reading: "max-w-3xl", // ~768px · default reading measure
  wide: "max-w-5xl", // ~1024px · sections, hero
  full: "max-w-7xl", // ~1280px · landing, investor room
};

type Props = {
  as?: ElementType;
  width?: Width;
  className?: string;
  children: ReactNode;
};

export function Container({
  as: As = "div",
  width = "wide",
  className,
  children,
}: Props) {
  return (
    <As
      className={cn("mx-auto w-full px-6 md:px-8", WIDTHS[width], className)}
    >
      {children}
    </As>
  );
}
