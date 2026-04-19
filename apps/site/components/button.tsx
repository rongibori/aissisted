import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Button — three tones, three sizes, one motion system.
 *
 * Tones:
 *   primary  · brand red on white · conversion only (rally, lead, invite)
 *   secondary· ink on white with 1px ink border · navigation, secondary CTA
 *   ghost    · no border, ink text, subtle hover · inline / tertiary
 *
 * Sizes: sm (compact), md (default), lg (hero CTAs)
 *
 * Palette budget: primary button sits in the 8% accent budget. Use sparingly
 * — a hero has ONE primary CTA per beat.
 *
 * Motion (M2 arbitration): 150ms ease-out on background, shadow, and subtle
 * translate — earned motion that confirms intent without feeling laggy.
 * Translate collapses to zero under prefers-reduced-motion.
 *
 * Radius (M2 arbitration): 2px. Squared but not brutal — warm precision.
 */

type Tone = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const TONE_STYLES: Record<Tone, string> = {
  primary: cn(
    "bg-brand text-white",
    "hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
  secondary: cn(
    "bg-white text-ink ring-1 ring-inset ring-ink/15",
    "hover:ring-ink/30 hover:-translate-y-px active:ring-ink/40 active:translate-y-0",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
  ghost: cn(
    "bg-transparent text-ink",
    "hover:bg-ink/5 hover:-translate-y-px active:bg-ink/10 active:translate-y-0",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
};

export function Button({
  tone = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-[2px]",
        "font-system font-medium tracking-[0.02em]",
        "transition-[background-color,box-shadow,filter,transform] duration-150 ease-out",
        "motion-reduce:transition-none motion-reduce:transform-none",
        "disabled:opacity-50 disabled:pointer-events-none",
        TONE_STYLES[tone],
        SIZE_STYLES[size],
        className
      )}
    >
      {children}
    </button>
  );
}
