/**
 * GET /api/investor/live-metrics
 *
 * Read-only system-status payload for the LiveMetrics module on the
 * investor room. Honest by design: returns architecture-level signal
 * (system status, integration count, schema version, build cadence) —
 * NOT user counts, revenue, or fabricated traction.
 *
 * Values are static today and ship as a credible placeholder. When the
 * underlying systems publish real metrics, swap the sources here without
 * touching the visual surface.
 *
 * Public surface. No PHI. No userId. No memory.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Metric = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  context: string;
  status: "live" | "in-flight" | "scheduled";
};

const METRICS: Metric[] = [
  {
    key: "system_status",
    label: "System status",
    value: "Online",
    context: "Investor room, Jeffrey console, lead capture — all live.",
    status: "live",
  },
  {
    key: "integrations",
    label: "Integrations",
    value: "4",
    unit: "active",
    context: "Epic MyChart · WHOOP · Apple Health · Oura.",
    status: "live",
  },
  {
    key: "cadence",
    label: "Adaptation cadence",
    value: "30",
    unit: "days",
    context: "Re-read the body. Re-weight the protocol. Every cycle.",
    status: "live",
  },
  {
    key: "cohort",
    label: "Founder cohort",
    value: "Invitational",
    context: "First cohort closing — operators, clinicians, advisors only.",
    status: "in-flight",
  },
];

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      metrics: METRICS,
    },
    {
      status: 200,
      headers: {
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
