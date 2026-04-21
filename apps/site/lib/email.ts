/**
 * email — transactional email fan-out via Resend.
 *
 * Called from /api/investor/lead on every capture. Sends:
 *   · Investor confirmation   · intent-specific copy, from the founder
 *   · Founder notification    · internal alert with score + full context
 *
 * Env-gated. If RESEND_API_KEY / FOUNDER_NOTIFY_EMAIL / INVESTOR_FROM_EMAIL
 * are not set, the helper logs "skipped" and returns {ok:false} — the lead
 * route still returns 202 so the surface never breaks.
 *
 * Brand voice:
 *   · British-elite · calm · certain · no exclamation points
 *   · Plain text only · investor inboxes strip HTML heavily
 *   · No "AI-powered" framing · no over-explanation
 */

import type { LeadIntent } from "./lead-capture";
import type { LeadScore } from "./investor-scoring";

const RESEND_URL = "https://api.resend.com/emails";

export type EmailLead = {
  intent: LeadIntent;
  name: string;
  email: string;
  firm: string | null;
  checkSize: string | null;
  note: string | null;
  sourceUrl: string | null;
  receivedAt: string;
  score: LeadScore;
  scorePoints: number;
};

export type EmailResult = { ok: boolean; reason?: string };

/**
 * Send the intent-specific confirmation email back to the investor.
 */
export async function sendInvestorConfirmation(
  lead: EmailLead,
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.INVESTOR_FROM_EMAIL;
  if (!key || !from) return { ok: false, reason: "Resend env unset" };

  const subject = subjectFor(lead.intent);
  const body = bodyFor(lead);

  return sendViaResend({
    apiKey: key,
    from,
    to: [lead.email],
    replyTo: process.env.FOUNDER_REPLY_TO_EMAIL || undefined,
    subject,
    text: body,
  });
}

/**
 * Send the internal alert to the founder (and optionally one operator).
 */
export async function sendFounderNotification(
  lead: EmailLead,
): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.INVESTOR_FROM_EMAIL;
  const notify = process.env.FOUNDER_NOTIFY_EMAIL;
  if (!key || !from || !notify) {
    return { ok: false, reason: "Resend env unset (founder)" };
  }

  const recipients = notify
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);

  const tag = lead.score === "hot" ? "HOT" : lead.score === "warm" ? "WARM" : "cold";
  const subject = `[${tag}] Investor lead · ${lead.name}${lead.firm ? ` · ${lead.firm}` : ""} · ${lead.intent}`;
  const text = [
    `Investor lead captured · ${lead.receivedAt}`,
    ``,
    `Score       : ${lead.score.toUpperCase()} (${lead.scorePoints} pts)`,
    `Intent      : ${lead.intent}`,
    `Name        : ${lead.name}`,
    `Email       : ${lead.email}`,
    `Firm        : ${lead.firm ?? "—"}`,
    `Check size  : ${lead.checkSize ?? "—"}`,
    `Source URL  : ${lead.sourceUrl ?? "—"}`,
    ``,
    `Note`,
    `----`,
    lead.note ?? "(none)",
  ].join("\n");

  return sendViaResend({
    apiKey: key,
    from,
    to: recipients,
    subject,
    text,
    replyTo: lead.email,
  });
}

function subjectFor(intent: LeadIntent): string {
  switch (intent) {
    case "allocation":
      return "Allocation request received";
    case "founder-call":
      return "Founder call — confirmed privately";
    case "waitlist":
      return "On the strategic waitlist";
    case "founder-session":
      return "Founder session — scheduling privately";
    case "thesis-memo":
      return "Thesis memo — queued for release";
    case "deck-request":
    default:
      return "Deck and data room — on the way";
  }
}

function bodyFor(lead: EmailLead): string {
  const opener = `${lead.name.split(/\s+/)[0] ?? "Hello"},`;
  const line = lineFor(lead.intent);
  const sig =
    process.env.FOUNDER_EMAIL_SIGNATURE ??
    "— Ron\nFounder, Aissisted";

  return [opener, "", line, "", sig].join("\n");
}

function lineFor(intent: LeadIntent): string {
  switch (intent) {
    case "allocation":
      return [
        "Thank you for the allocation request. I read every one personally.",
        "",
        "You'll hear back within five business days with a founder session if fit is there. I'll share the deck, the data room, and the live system walk — and I'll ask direct questions back. The round is kept small on purpose.",
      ].join("\n");
    case "founder-call":
      return [
        "Thank you for asking for the call.",
        "",
        "I'll reply within one business day with a time. Thirty minutes, working session — you'll see the product, the model, and the moat. No deck theater.",
      ].join("\n");
    case "waitlist":
      return [
        "You're on the strategic waitlist.",
        "",
        "I'll write when there's something worth your time — not a moment before. Quarterly at most.",
      ].join("\n");
    case "founder-session":
      return [
        "Thank you for requesting a founder session.",
        "",
        "I'll send a private calendar within one business day. We'll walk the system end-to-end — the loop, the integrations, the data model, the moat.",
      ].join("\n");
    case "thesis-memo":
      return [
        "Thank you for asking for the memo.",
        "",
        "The complete thesis — why-now, the wedge, the loop, the projections — lands in your inbox after a short review. Usually a business day.",
      ].join("\n");
    case "deck-request":
    default:
      return [
        "Thank you for asking for the deck.",
        "",
        "I'll be in touch within a business day with the deck and the data room. Share any context that matters — thesis fit, timing, questions — and I'll reply in kind.",
      ].join("\n");
  }
}

async function sendViaResend(args: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<EmailResult> {
  try {
    const body: Record<string, unknown> = {
      from: args.from,
      to: args.to,
      subject: args.subject,
      text: args.text,
    };
    if (args.replyTo) body.reply_to = args.replyTo;

    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, reason: `Resend ${res.status}: ${text.slice(0, 200)}` };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "resend fetch failed",
    };
  }
}
