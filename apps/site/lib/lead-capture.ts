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
    kicker: "Private request · allocation",
    heading: "Request allocation.",
    lede: "For leads and co-leads ready to discuss ticket, terms, and timing. Founder session within five business days.",
    cta: "Request allocation",
  },
  "founder-call": {
    kicker: "Private request · founder call",
    heading: "Book a founder call.",
    lede: "Thirty minutes with the founder. Walk the system, the model, the moat. No deck theater — working session.",
    cta: "Book the call",
  },
  waitlist: {
    kicker: "Private request · strategic waitlist",
    heading: "Join the strategic waitlist.",
    lede: "For operators, clinicians, and advisors. Early access to the cohort and to the thinking behind it.",
    cta: "Join the waitlist",
  },
  "deck-request": {
    kicker: "Private request · deck + data room",
    heading: "Request the deck.",
    lede: "Share enough context for a thoughtful reply. The deck and data room land in your inbox after a short review.",
    cta: "Request deck",
  },
  "founder-session": {
    kicker: "Private request · founder session",
    heading: "Request a founder session.",
    lede: "A working session with the founder. Walk the system end-to-end, see the moat, ask the hard questions.",
    cta: "Request session",
  },
  "thesis-memo": {
    kicker: "Private request · thesis memo",
    heading: "Request the thesis memo.",
    lede: "The complete thesis. The why-now, the wedge, the loop, the projections. Lands in your inbox after review.",
    cta: "Request memo",
  },
};
