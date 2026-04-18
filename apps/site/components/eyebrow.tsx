import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Eyebrow — the short, uppercase, Plex Mono label that anchors a section.
 * Data-band, not decorative. Appears once per hero or section header.
 */

type Tone = "brand" | "data" | "muted";

const TONES: Record<Tone, string> = {
  brand: "text-brand",
  data: "text-data",
  muted: "text-ink/60",
};

type Props = {
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function Eyebrow({ tone = "brand", className, children }: Props) {
  return (
    <p
      className={cn(
        "font-system text-xs font-medium uppercase tracking-[0.18em]",
        TONES[tone],
        className
      )}
    >
      {children}
    </p>
  );
}
