import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Button — three tones, two sizes, one motion system.
 *
 * Tones:
 *   primary  · brand red on white · conversion only (rally, lead, invite)
 *   secondary· ink on white with 1px ink border · navigation, secondary CTA
 *   ghost    · no border, ink text, subtle hover · inline / tertiary
 *
 * Palette budget: primary button is the 2% signal. Use sparingly — a hero
 * has ONE primary CTA per beat.
 */

type Tone = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const TONE_STYLES: Record<Tone, string> = {
  primary: cn(
    "bg-brand text-white",
    "hover:brightness-110 active:brightness-95",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
  secondary: cn(
    "bg-white text-ink ring-1 ring-inset ring-ink/15",
    "hover:ring-ink/30 active:ring-ink/40",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
  ghost: cn(
    "bg-transparent text-ink",
    "hover:bg-ink/5 active:bg-ink/10",
    "focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
  ),
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
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
        "rounded-none", // premium reads as precise. No pill buttons.
        "font-system font-medium tracking-[0.02em]",
        "transition-[background,box-shadow,filter] duration-150 ease-out",
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
