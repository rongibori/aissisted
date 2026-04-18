import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Design system · Aissisted",
  description: "Internal M2 primitive catalog — all components, all variants.",
  robots: { index: false, follow: false },
};

/**
 * /internal/design-system — M2 visual QA surface.
 *
 * Why this path (not /design):
 *   /internal/* is the canonical namespace for tooling routes that ship with
 *   the site but are never surfaced to visitors. The /design route that shipped
 *   with the M2 anchor commit is kept as a redirect alias so existing dev
 *   bookmarks don't break, but /internal/design-system is the durable URL.
 *
 * Not gated at M2 — robots meta + sitemap exclusion is sufficient. M8 can
 * add middleware matcher for /internal/* when the site goes public.
 */

export default function DesignSystemLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
