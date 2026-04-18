import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pill — Plex Mono small label. Sequence tags, status badges, category chips.
 *
 * Usage examples: "01 / 10", "BETA", "SCIENCE", "PENDING"
 * Never use for primary navigation or body text — this is a data affordance.
 *
 * Tones:
 *   ink    · neutral — default, on white surfaces
 *   brand  · accent red — use within 8% palette budget
 *   data   · midnight — intelligence / system category
 *   signal · aqua — activation, new, live states
 *   ok     · success state
 *   warn   · caution state
 */

type Tone = "ink" | "brand" | "data" | "signal" | "ok" | "warn";

const TONES: Record<Tone, string> = {
  ink:    "bg-surface-2 text-soft border-line",
  brand:  "bg-danger-soft text-brand border-danger/20",
  data:   "bg-data text-white border-transparent",
  signal: "bg-signal/10 text-signal border-signal/30",
  ok:     "bg-ok-soft text-ok border-ok/20",
  warn:   "bg-warn-soft text-warn border-warn/20",
};

type Props = {
  tone?:      Tone;
  className?: string;
  children:   ReactNode;
};

export function Pill({ tone = "ink", className, children }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center",
        "font-system text-[11px] font-medium tracking-[0.08em] uppercase",
        "px-2 py-0.5 border",
        "transition-opacity duration-150 ease-out",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
