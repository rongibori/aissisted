"use client";

import React from "react";

/*
 * PillCTA — primary brand affordance.
 *
 * Distinct from the generic Button in components/ui.tsx: this is the
 * full-width, pill-shaped, IBM Plex Mono lockup used on hero / cover
 * surfaces. Hover *lightens* (graphite → soft graphite) rather than
 * darkens — matches the brand's "calm authority" register.
 */

type PillCTAProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  className?: string;
};

export function PillCTA({
  children,
  type = "button",
  ...props
}: PillCTAProps) {
  return (
    <button
      type={type}
      className={[
        "w-full rounded-pill",
        "bg-ink text-surface",
        "font-system font-medium text-[14px] tracking-[0.06em]",
        "py-[18px] px-6",
        "transition-colors duration-200 ease-out",
        "hover:bg-muted",
        "active:scale-[0.98] motion-safe:active:duration-[120ms]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        props.className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
