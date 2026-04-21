/**
 * POST /api/investor/lead
 *
 * Unified investor-lead capture. Every public CTA on the investor room
 * (allocation, founder-call, waitlist, deck-request, founder-session,
 * thesis-memo) funnels through this endpoint with an intent tag.
 *
 * Pipeline:
 *   · Validate payload (email, name, length caps, intent allow-list)
 *   · Score the lead (hot / warm / cold) — deterministic, explainable
 *   · Structured log — authoritative record, scrape-able in Vercel logs
 *   · Fan-out in parallel (best-effort, never throws to client):
 *       — HubSpot Contacts API    (if HUBSPOT_PRIVATE_APP_TOKEN)
 *       — Airtable Investor Leads (if AIRTABLE_API_KEY + BASE_ID)
 *       — Investor confirmation email (if RESEND_API_KEY + INVESTOR_FROM_EMAIL)
 *       — Founder notification email  (if RESEND_API_KEY + FOUNDER_NOTIFY_EMAIL)
 *   · Return 202 with intent-specific confirmation copy
 *
 * The UX never breaks because of a missing integration. If everything is
 * unset, the endpoint still records the capture in structured logs — the
 * founder picks up manually.
 *
 * Public surface. No PHI. No memory. Minimal PII (name, email, firm, intent,
 * free-text note ≤ 2000 chars). No health data, no wearables, no labs.
 */

import { NextResponse } from "next/server";
import { scoreLead, scoreLabel } from "@/lib/investor-scoring";
import type { LeadScore } from "@/lib/investor-scoring";
import {
  sendInvestorConfirmation,
  sendFounderNotification,
} from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Intent =
  | "allocation"
  | "founder-call"
  | "waitlist"
  | "deck-request"
  | "founder-session"
  | "thesis-memo";

const VALID_INTENTS: ReadonlySet<Intent> = new Set<Intent>([
  "allocation",
  "founder-call",
  "waitlist",
  "deck-request",
  "founder-session",
  "thesis-memo",
]);

type LeadPayload = {
  intent?: string;
  name?: string;
  email?: string;
  firm?: string;
  checkSize?: string;
  note?: string;
  sourceUrl?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const HUBSPOT_URL = "https://api.hubapi.com/crm/v3/objects/contacts";
const AIRTABLE_URL = (base: string, table: string) =>
  `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;

type EnrichedLead = {
  intent: Intent;
  name: string;
  email: string;
  firm: string | null;
  checkSize: string | null;
  note: string | null;
  sourceUrl: string | null;
  receivedAt: string;
  score: LeadScore;
  scorePoints: number;
  scoreReasons: string[];
};

export async function POST(req: Request) {
  let body: LeadPayload;
  try {
    body = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const rawIntent = (body.intent ?? "").trim();
  const intent = (VALID_INTENTS.has(rawIntent as Intent)
    ? rawIntent
    : "deck-request") as Intent;
  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();
  const firm = (body.firm ?? "").trim();
  const checkSize = (body.checkSize ?? "").trim();
  const note = (body.note ?? "").trim().slice(0, 2000);
  const sourceUrl = (body.sourceUrl ?? "").trim().slice(0, 500);

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

  const scoring = scoreLead({
    intent,
    checkSize: checkSize || null,
    firm: firm || null,
    note: note || null,
  });

  const receivedAt = new Date().toISOString();
  const lead: EnrichedLead = {
    intent,
    name,
    email,
    firm: firm || null,
    checkSize: checkSize || null,
    note: note || null,
    sourceUrl: sourceUrl || null,
    receivedAt,
    score: scoring.score,
    scorePoints: scoring.points,
    scoreReasons: scoring.reasons,
  };

  // Always log — structured, scrape-able, and the fallback of record.
  console.log(
    JSON.stringify({
      tag: "investor.lead",
      ...lead,
    }),
  );

  // Fan out in parallel. Best-effort, never throws to client.
  const [hubspot, airtable, investorMail, founderMail] = await Promise.all([
    pushToHubSpot(lead).catch((err) => fail(err)),
    pushToAirtable(lead).catch((err) => fail(err)),
    sendInvestorConfirmation(lead).catch((err) => fail(err)),
    sendFounderNotification(lead).catch((err) => fail(err)),
  ]);

  logSkip("hubspot", hubspot);
  logSkip("airtable", airtable);
  logSkip("email_investor", investorMail);
  logSkip("email_founder", founderMail);

  return NextResponse.json(
    {
      ok: true,
      intent,
      message: confirmationFor(intent),
    },
    { status: 202 },
  );
}

type FanOutResult = { ok: boolean; reason?: string };

function fail(err: unknown): FanOutResult {
  return { ok: false, reason: errorMessage(err) };
}

function logSkip(channel: string, r: FanOutResult) {
  if (r.ok) return;
  console.log(
    JSON.stringify({
      tag: `investor.lead.${channel}_skipped`,
      reason: r.reason ?? "unknown",
    }),
  );
}

async function pushToHubSpot(lead: EnrichedLead): Promise<FanOutResult> {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) return { ok: false, reason: "HUBSPOT_PRIVATE_APP_TOKEN unset" };

  const [firstname, ...rest] = lead.name.split(/\s+/);
  const lastname = rest.join(" ") || undefined;

  const properties: Record<string, string> = {
    email: lead.email,
    firstname: firstname || lead.name,
    aissisted_intent: lead.intent,
    aissisted_source: lead.sourceUrl ?? "investor-room",
    aissisted_score: lead.score,
    aissisted_score_label: scoreLabel(lead.score),
    aissisted_score_points: String(lead.scorePoints),
    lifecyclestage: "lead",
  };
  if (lastname) properties.lastname = lastname;
  if (lead.firm) properties.company = lead.firm;
  if (lead.checkSize) properties.aissisted_check_size = lead.checkSize;
  if (lead.note) properties.aissisted_note = lead.note;

  const res = await fetch(HUBSPOT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ properties }),
  });

  // HubSpot returns 409 if contact already exists — treat as success.
  if (res.ok || res.status === 409) return { ok: true };
  const text = await res.text().catch(() => "");
  return { ok: false, reason: `HubSpot ${res.status}: ${text.slice(0, 200)}` };
}

async function pushToAirtable(lead: EnrichedLead): Promise<FanOutResult> {
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_LEADS_TABLE ?? "Investor Leads";
  if (!key || !base) return { ok: false, reason: "Airtable env unset" };

  const res = await fetch(AIRTABLE_URL(base, table), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      records: [
        {
          fields: {
            Intent: lead.intent,
            Score: lead.score,
            "Score Points": lead.scorePoints,
            Name: lead.name,
            Email: lead.email,
            Firm: lead.firm ?? "",
            "Check Size": lead.checkSize ?? "",
            Note: lead.note ?? "",
            Source: lead.sourceUrl ?? "investor-room",
            "Received At": lead.receivedAt,
          },
        },
      ],
      typecast: true,
    }),
  });

  if (res.ok) return { ok: true };
  const text = await res.text().catch(() => "");
  return { ok: false, reason: `Airtable ${res.status}: ${text.slice(0, 200)}` };
}

function confirmationFor(intent: Intent): string {
  switch (intent) {
    case "allocation":
      return "Received. Confirmation in your inbox. Founder session within five business days to discuss ticket, terms, and timing.";
    case "founder-call":
      return "Received. Confirmation in your inbox. A private calendar lands within one business day.";
    case "waitlist":
      return "On the list. A confirmation is on its way. We'll write when there's something worth your time.";
    case "founder-session":
      return "Received. Confirmation in your inbox. Scheduling privately within one business day.";
    case "thesis-memo":
      return "Received. Confirmation in your inbox. The thesis memo lands after a short review.";
    case "deck-request":
    default:
      return "Received. Confirmation in your inbox. Ron follows up within a business day with the deck and data room.";
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return "unknown";
  }
}
