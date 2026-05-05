/**
 * /demo/orchestrator-test
 *
 * Minimal mobile-first surface that proves the orchestration layer works
 * end-to-end. Shows mode + module activations + transcript + interrupt
 * controls. Visual polish is intentionally minimal — the point is to
 * demonstrate the live system loop.
 *
 * Server entry — renders the client surface. No fetching, no SEO concerns;
 * the page is dev-only and not indexed.
 */

import type { Metadata } from "next";
import { OrchestratorTestSurface } from "./test-surface";

export const metadata: Metadata = {
  title: "Orchestrator Test · Aissisted",
  robots: { index: false, follow: false },
};

export default function OrchestratorTestPage() {
  return <OrchestratorTestSurface />;
}
