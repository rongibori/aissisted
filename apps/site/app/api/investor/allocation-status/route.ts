/**
 * GET /api/investor/allocation-status
 *
 * Returns the cohort allocation state for the investor room:
 *   · total            · total seats in the founding cohort
 *   · filled           · committed seats
 *   · remaining        · total − filled
 *   · state            · "open" | "nearly-full" | "closed"
 *
 * Configured via env so Ron can move numbers without a deploy:
 *   · INVESTOR_COHORT_SEATS_TOTAL   · required to emit numbers
 *   · INVESTOR_COHORT_SEATS_FILLED  · required to emit numbers
 *   · INVESTOR_COHORT_NEARLY_PCT    · optional, default 70 (%)
 *
 * If the env vars are not set, the route returns { state: "unconfigured" }
 * and the client renders nothing — no fabricated scarcity. The honest
 * default for an investor room is silence until the numbers exist.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AllocationState = "open" | "nearly-full" | "closed" | "unconfigured";

type AllocationPayload = {
  ok: true;
  state: AllocationState;
  total: number | null;
  filled: number | null;
  remaining: number | null;
  nearlyFullAtPercent: number;
  label: string;
  updatedAt: string;
};

function parseNum(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

export async function GET() {
  const total = parseNum(process.env.INVESTOR_COHORT_SEATS_TOTAL);
  const filled = parseNum(process.env.INVESTOR_COHORT_SEATS_FILLED);
  const nearlyPct = parseNum(process.env.INVESTOR_COHORT_NEARLY_PCT) ?? 70;

  const base: AllocationPayload = {
    ok: true,
    state: "unconfigured",
    total: null,
    filled: null,
    remaining: null,
    nearlyFullAtPercent: nearlyPct,
    label: "Cohort · invitational",
    updatedAt: new Date().toISOString(),
  };

  if (total === null || filled === null) {
    return NextResponse.json(base, {
      headers: {
        "cache-control": "public, max-age=120, stale-while-revalidate=600",
      },
    });
  }

  const safeFilled = Math.min(filled, total);
  const remaining = Math.max(total - safeFilled, 0);

  let state: AllocationState;
  if (remaining === 0) state = "closed";
  else if (safeFilled / total >= nearlyPct / 100) state = "nearly-full";
  else state = "open";

  const label =
    state === "closed"
      ? `Cohort · closed · ${total} of ${total} taken`
      : state === "nearly-full"
        ? `Allocation · ${remaining} of ${total} remain`
        : `Allocation · ${remaining} of ${total} open`;

  const payload: AllocationPayload = {
    ok: true,
    state,
    total,
    filled: safeFilled,
    remaining,
    nearlyFullAtPercent: nearlyPct,
    label,
    updatedAt: new Date().toISOString(),
  };

  return NextResponse.json(payload, {
    headers: {
      "cache-control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
