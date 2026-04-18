import { NextResponse } from "next/server";

/**
 * POST /api/lead
 *
 * Stub only. Milestone 12 wires HubSpot (custom investor-lead pipeline stage)
 * via the existing connector.
 *
 * Expected request shape (subject to change):
 *   { email: string, name?: string, source: "request-access" | "contact" | "jeffrey-handoff",
 *     intent?: number, notes?: string }
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Not implemented",
      detail:
        "Lead capture not yet wired. Milestone 12 connects HubSpot and routes to the investor pipeline.",
    },
    { status: 501 }
  );
}
