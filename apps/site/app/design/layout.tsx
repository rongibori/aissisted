import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Design catalog · Aissisted",
  description: "Internal primitive catalog for apps/site.",
  robots: { index: false, follow: false },
};

/**
 * /design — in-app design catalog.
 *
 * Replacement for Storybook at M2. Storybook-in-Next15-with-Tailwind-v4 is
 * heavy and unstable; this route gives us the same affordance (every
 * primitive rendered in isolation, linkable, deployed alongside the site
 * preview) with zero build-tooling overhead.
 *
 * Access: noindex via metadata. Not gated at M2 — internal use only. When
 * the site goes public, M8 can add middleware matcher for /design.
 */

export default function DesignLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
