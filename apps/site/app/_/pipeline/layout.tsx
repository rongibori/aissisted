import type { Metadata } from "next";

/**
 * /_/pipeline — hidden admin dashboard for the investor lead pipeline.
 *
 * Underscore-prefix keeps this out of every sitemap generator and most
 * search bots. The metadata below explicitly no-indexes. Real auth is
 * token-based (ADMIN_PIPELINE_TOKEN) enforced in the page component.
 */

export const metadata: Metadata = {
  title: "Aissisted · Pipeline",
  description: "Private.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
