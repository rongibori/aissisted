import React from "react";

/*
 * PreLabel — pre-headline label primitive.
 *
 * IBM Plex Mono 11px / 0.18em / uppercase, the structural register that
 * sits above every onboarding headline. Per design spec §2.2 (Pre-headline
 * label row) and cowork-briefs/jeffrey-intro.md §3.
 *
 * Variants:
 *   "graphite" — Cover surface ("EST. 2026 · PERSONALIZED INTELLIGENCE")
 *   "aqua"     — Jeffrey identity surfaces ("● VOICE COMPANION · V1.2")
 *
 * `bullet` prepends a leading "●" decorative marker — used on Aqua-variant
 * Jeffrey-identity moments. The bullet is aria-hidden; surrounding text
 * carries the meaning.
 */

type PreLabelVariant = "graphite" | "aqua";

interface PreLabelProps {
  children: React.ReactNode;
  variant?: PreLabelVariant;
  bullet?: boolean;
  className?: string;
}

const VARIANT_TO_COLOR: Record<PreLabelVariant, string> = {
  graphite: "text-soft",
  aqua: "text-signal",
};

export function PreLabel({
  children,
  variant = "graphite",
  bullet = false,
  className = "",
}: PreLabelProps) {
  return (
    <p
      className={[
        "font-system uppercase font-medium",
        "text-[11px] tracking-[0.18em]",
        VARIANT_TO_COLOR[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {bullet ? (
        <span aria-hidden="true" className="mr-1">
          ●
        </span>
      ) : null}
      {children}
    </p>
  );
}
