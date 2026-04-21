/**
 * investor-scoring — deterministic hot/warm/cold scoring for investor leads.
 *
 * Called server-side on every /api/investor/lead write. The score is pushed
 * into HubSpot custom property `aissisted_score` and the Airtable `Score`
 * column so follow-up can be prioritized without re-reading every note.
 *
 * Signal weights (pure rules, no ML, explainable):
 *   · Check size     · strongest signal
 *   · Intent         · allocation > founder-session > founder-call >
 *                      thesis-memo > deck-request > waitlist
 *   · Firm present   · light positive
 *   · Note length    · shows seriousness
 *
 * Thresholds are intentionally high. A cold score is the default — the room
 * needs to earn its "hot" reads, not hand them out.
 */
import type { LeadIntent } from "./lead-capture";

export type LeadScore = "hot" | "warm" | "cold";

export type ScoringInput = {
  intent: LeadIntent;
  checkSize?: string | null;
  firm?: string | null;
  note?: string | null;
};

export type ScoringOutput = {
  score: LeadScore;
  points: number;
  reasons: string[];
};

const CHECK_SIZE_POINTS: Record<string, number> = {
  "<250k": 1,
  "250k-1m": 2,
  "1m-5m": 4,
  "5m+": 6,
  strategic: 5,
};

const INTENT_POINTS: Record<LeadIntent, number> = {
  allocation: 4,
  "founder-session": 3,
  "founder-call": 2,
  "thesis-memo": 2,
  "deck-request": 1,
  waitlist: 0,
};

/**
 * Score a lead. Returns the score bucket, the raw point total (for debugging
 * / auditing), and the list of reasons that drove the decision.
 */
export function scoreLead(input: ScoringInput): ScoringOutput {
  const reasons: string[] = [];
  let points = 0;

  const intentPts = INTENT_POINTS[input.intent] ?? 0;
  points += intentPts;
  reasons.push(`intent:${input.intent}(+${intentPts})`);

  const csKey = (input.checkSize ?? "").trim();
  if (csKey && CHECK_SIZE_POINTS[csKey] !== undefined) {
    const pts = CHECK_SIZE_POINTS[csKey];
    points += pts;
    reasons.push(`check:${csKey}(+${pts})`);
  }

  const firm = (input.firm ?? "").trim();
  if (firm) {
    points += 1;
    reasons.push("firm(+1)");
  }

  const note = (input.note ?? "").trim();
  if (note.length >= 40) {
    points += 1;
    reasons.push("note>=40(+1)");
  }
  if (note.length >= 200) {
    points += 1;
    reasons.push("note>=200(+1)");
  }

  // Bucket thresholds — earn hot, earn warm.
  let score: LeadScore;
  if (points >= 8) score = "hot";
  else if (points >= 4) score = "warm";
  else score = "cold";

  return { score, points, reasons };
}

/**
 * Short, human-readable label used in server logs, admin dashboard cells,
 * and notification emails.
 */
export function scoreLabel(score: LeadScore): string {
  switch (score) {
    case "hot":
      return "Hot · priority reply";
    case "warm":
      return "Warm · queue for reply";
    case "cold":
      return "Cold · waitlist cadence";
  }
}
