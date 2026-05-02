"use client";

import React from "react";

/*
 * TextLink — secondary text-button primitive.
 *
 * Plain-text affordance for soft-secondary actions ("Skip voice", "Skip
 * for now", "Pay annually — save 15%"). IBM Plex Mono, graphite-soft by
 * default, deepens to ink on hover. No underline by default — the
 * register is "calm secondary action", not "navigation link".
 *
 * Renders as <button type="button"> because every TextLink in the
 * onboarding flow advances local state rather than navigating to a URL.
 * Pass `type="submit"` if used inside a form.
 */

type TextLinkProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  className?: string;
};

export function TextLink({
  children,
  type = "button",
  className,
  ...props
}: TextLinkProps) {
  return (
    <button
      type={type}
      className={[
        "font-system text-[14px] text-soft hover:text-ink",
        "transition-colors duration-200 ease-out",
        "rounded-sm",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
