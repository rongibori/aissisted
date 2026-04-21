/**
 * POST /api/investor/waitlist
 *
 * Captures investor / strategic-watcher interest. Returns 202 + a short
 * confirmation message. Server-side log only — CRM/email integration lands
 * in the next PR.
 *
 * Public surface. No PHI. No memory adapter. Email-only payload.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type WaitlistPayload = {
  email?: string;
  context?: string; // optional one-liner ("VC", "operator", "strategic")
};

export async function POST(req: Request) {
  let body: WaitlistPayload;
  try {
    body = (await req.json()) as WaitlistPayload;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim();
  const context = (body.context ?? "").trim().slice(0, 200);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: { code: "INVALID_EMAIL", message: "A valid email is required." } },
      { status: 400 },
    );
  }

  console.log(
    JSON.stringify({
      tag: "investor.waitlist",
      at: new Date().toISOString(),
      email,
      context: context || null,
    }),
  );

  return NextResponse.json(
    {
      ok: true,
      message: "On the list. We'll write when there's something worth your time.",
    },
    { status: 202 },
  );
}
