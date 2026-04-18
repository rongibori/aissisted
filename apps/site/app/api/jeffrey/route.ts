import { NextResponse } from "next/server";

/**
 * POST /api/jeffrey
 *
 * Stub only. Milestone 10 wires:
 *   guardrails → intent classifier → retrieval (pgvector) → Claude Sonnet 4.6 → post-process.
 *
 * Expected request shape (subject to change):
 *   { message: string, sessionId?: string, mode?: "voice" | "chat" | "tour" }
 *
 * Do NOT wire the Anthropic key, the knowledge base, or the CRM handoff here
 * until Milestone 10. Returning 501 keeps the route addressable for smoke
 * tests without leaking a half-built surface.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Not implemented",
      detail:
        "Jeffrey is still being taught the house. Milestone 10 wires the prompt + retrieval layer.",
    },
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json(
    { status: "scaffold", milestone: "M1" },
    { status: 200 }
  );
}
