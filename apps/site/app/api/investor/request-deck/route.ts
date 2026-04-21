/**
 * POST /api/investor/request-deck
 *
 * Accepts an investor's contact for a follow-up with the deck + data room
 * link. Server-side logs the request; a downstream CRM/email integration
 * (Resend / HubSpot) picks up in the next PR.
 *
 * Public surface. No PHI. No session state. No memory adapter.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeckPayload = {
  name?: string;
  email?: string;
  firm?: string;
  checkSize?: string;
  note?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export async function POST(req: Request) {
  let body: DeckPayload;
  try {
    body = (await req.json()) as DeckPayload;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();
  const firm = (body.firm ?? "").trim();
  const checkSize = (body.checkSize ?? "").trim();
  const note = (body.note ?? "").trim().slice(0, 2000);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: { code: "INVALID_EMAIL", message: "A valid email is required." } },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json(
      { error: { code: "NAME_REQUIRED", message: "Name is required." } },
      { status: 400 },
    );
  }

  // Minimal, structured server log. A downstream integration
  // (Resend / HubSpot / Notion) can read these in the next PR.
  console.log(
    JSON.stringify({
      tag: "investor.deck_request",
      at: new Date().toISOString(),
      name,
      email,
      firm: firm || null,
      checkSize: checkSize || null,
      hasNote: note.length > 0,
    }),
  );

  return NextResponse.json(
    {
      ok: true,
      message:
        "Received. Ron will be in touch within a business day with the deck and data room.",
    },
    { status: 202 },
  );
}
