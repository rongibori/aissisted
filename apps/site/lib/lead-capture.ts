/**
 * lead-capture — single client-side helper to POST any investor lead
 * with an intent tag through the unified /api/investor/lead endpoint.
 *
 * Every public CTA on the investor room funnels through this helper. Intent
 * is preserved end-to-end (UI → API → HubSpot custom property + Airtable
 * column) so the founder can route follow-ups by signal.
 */

export type LeadIntent =
  | "allocation"
  | "founder-call"
  | "waitlist"
  | "deck-request"
  | "founder-session"
  | "thesis-memo";

export type LeadFields = {
  name: string;
  email: string;
  firm?: string;
  checkSize?: string;
  note?: string;
};

export type SubmitLeadResult =
  | { ok: true; intent: LeadIntent; message: string }
  | { ok: false; error: string };

export async function submitLead(
  intent: LeadIntent,
  fields: LeadFields,
): Promise<SubmitLeadResult> {
  try {
    const sourceUrl =
      typeof window !== "undefined" ? window.location.href : undefined;

    const res = await fetch("/api/investor/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intent, sourceUrl, ...fields }),
    });

    const data = (await res.json().catch(() => null)) as
      | {
          ok?: boolean;
          intent?: LeadIntent;
          message?: string;
          error?: { message?: string };
        }
      | null;

    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.error?.message ?? "Something went wrong. Try again.",
      };
    }

    return {
      ok: true,
      intent: data.intent ?? intent,
      message: data.message ?? "Received.",
    };
  } catch {
    return { ok: false, error: "Network error. Please try again in a moment." };
  }
}

/**
 * Human-readable framing per intent — used as modal heading + lede so the
 * capture surface reads like it was built for that specific path.
 */
export const INTENT_COPY: Record<
  LeadIntent,
  { kicker: string; heading: string; lede: string; cta: string }
> = {
  allocation: {
    kicker: "Private · allocation",
    heading: "Take a seat in the round.",
    lede: "For leads and co-leads. Ticket, terms, timing — handled in a founder session inside five business days. The round is kept small on purpose.",
    cta: "Request allocation",
  },
  "founder-call": {
    kicker: "Private · founder call",
    heading: "Thirty minutes with the founder.",
    lede: "Working session — not a pitch. Walk the live product, the model, and the moat. Direct questions, direct answers, on camera.",
    cta: "Book the call",
  },
  waitlist: {
    kicker: "Private · strategic waitlist",
    heading: "Hold a seat for later.",
    lede: "For operators, clinicians, and advisors who want early access to the cohort and to the thinking behind it. Quarterly at most.",
    cta: "Join the waitlist",
  },
  "deck-request": {
    kicker: "Private · deck and data room",
    heading: "Request the deck.",
    lede: "Share enough context for a real reply. The deck and the data room land in your inbox after a short review — usually a business day.",
    cta: "Request deck",
  },
  "founder-session": {
    kicker: "Private · founder session",
    heading: "Walk the system with the founder.",
    lede: "End-to-end. Integrations live, rules engine traceable, data isolation enforceable. See the moat from inside.",
    cta: "Request session",
  },
  "thesis-memo": {
    kicker: "Private · thesis memo",
    heading: "Read the full thesis.",
    lede: "Why-now, wedge, loop, projections. The memo that closes the reads that matter.",
    cta: "Request memo",
  },
};
