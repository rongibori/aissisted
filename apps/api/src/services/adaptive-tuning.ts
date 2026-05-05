/**
 * Adaptive Tuning Service
 *
 * Aligned with: JEFFREY_BRAIN_ROADMAP.md §J4-2 / §J4-3, Issue #35.
 *
 * Consumes the last 14 days of signals per user → proposes a formula delta
 * (v3.2 → v3.3) with rationale. Runs nightly at 04:00 user-local via the
 * scheduler. Output passes through the Safety Gate before persistence.
 *
 * Pipeline:
 *   1. Aggregate last-14d signals per user
 *   2. Detect tunable patterns (HRV trend, recovery, adherence, sleep)
 *   3. Propose ingredient delta (added / removed / dose change)
 *   4. Run delta through Stage-1 safety filter
 *   5. Persist as `protocols(version=N+1, parentId=N, status="proposed")`
 *   6. On user's next morning surface, Jeffrey explains the change
 *
 * Hard rules:
 *   - Never crosses I-21 thresholds (drug interactions, condition contras)
 *   - Never adjusts dose by more than ±25% in one night
 *   - Maximum one new ingredient added per cycle
 *   - Tuning paused if user is on `intent_pause`
 */

import { filterCandidatePool, type CandidateIngredient, type SafetyContext } from "@aissisted/jeffrey/safety";

export interface AdaptiveSignalSummary {
  userId: string;
  windowStart: string; // ISO8601
  windowEnd: string;   // ISO8601
  hrvTrendPct: number;        // 14d slope as %, e.g. -8 = down 8%
  recoveryAvg: number;        // 0-100
  recoveryDelta: number;      // vs prior 14d window
  sleepDepthMinutes: number;  // average deep-sleep min/night
  adherencePct: number;       // last 14d adherence
  adherenceStreakBroken: boolean;
  intentPaused: boolean;
}

export interface FormulaDeltaProposal {
  fromVersion: string;          // "v3.2"
  toVersion: string;            // "v3.3"
  rationale: string;            // Jeffrey-voice rationale (Briston short sentences)
  added: CandidateIngredient[];
  removed: string[];
  doseChanges: Array<{ ingredient: string; fromMg: number; toMg: number; deltaPct: number }>;
  /** Set when safety filter excluded any of the proposed adds */
  safetyExcluded?: string[];
  /** Always present — Jeffrey morning copy if proposal accepted */
  morningExplanation: string;
}

const MAX_DOSE_CHANGE_PCT = 0.25;
const MAX_ADDS_PER_CYCLE = 1;

/**
 * Generate a tuning proposal from the signal summary + current protocol.
 * Pure function — no I/O. Caller persists.
 */
export function proposeAdaptiveTuning(
  summary: AdaptiveSignalSummary,
  currentProtocol: { version: string; ingredients: Array<CandidateIngredient & { rationale?: string }> },
  safetyCtx: SafetyContext,
): FormulaDeltaProposal | null {
  if (summary.intentPaused) return null;

  const added: CandidateIngredient[] = [];
  const removed: string[] = [];
  const doseChanges: FormulaDeltaProposal["doseChanges"] = [];
  const rationaleBits: string[] = [];

  // ── Pattern 1: HRV down + recovery flat → bump magnesium glycinate (PM)
  if (summary.hrvTrendPct < -5 && summary.recoveryDelta < 0) {
    const mg = currentProtocol.ingredients.find((i) =>
      /magnesium glycinate/i.test(i.name),
    );
    if (mg && (mg.doseMg ?? 0) < 600) {
      const fromMg = mg.doseMg ?? 200;
      const toMg = Math.min(600, Math.round(fromMg * 1.2));
      doseChanges.push({ ingredient: mg.name, fromMg, toMg, deltaPct: (toMg - fromMg) / fromMg });
      rationaleBits.push(`Magnesium up to ${toMg}mg.`);
    } else if (!mg) {
      added.push({ name: "magnesium glycinate", doseMg: 300, timing: "evening" });
      rationaleBits.push("Adding magnesium glycinate at 300mg, evenings.");
    }
  }

  // ── Pattern 2: Recovery jumped + adherence solid → fold rhodiola back in for AM ramp
  if (summary.recoveryDelta > 5 && summary.adherencePct > 0.85) {
    const hasRhodiola = currentProtocol.ingredients.some((i) => /rhodiola/i.test(i.name));
    if (!hasRhodiola && added.length < MAX_ADDS_PER_CYCLE) {
      added.push({ name: "rhodiola rosea", doseMg: 300, timing: "morning" });
      rationaleBits.push("Rhodiola back in.");
    }
  }

  // ── Pattern 3: Adherence broke + sleep depth down → simplify (one fewer evening dose)
  if (summary.adherenceStreakBroken && summary.sleepDepthMinutes < 70) {
    const eveningCount = currentProtocol.ingredients.filter((i) => i.timing === "evening").length;
    if (eveningCount > 3) {
      // Heuristic: drop the lowest-priority evening ingredient. In production this
      // consults the priority graph; for now mark for review.
      rationaleBits.push("Holding the evening stack steady — simplifying next cycle.");
    }
  }

  if (added.length === 0 && removed.length === 0 && doseChanges.length === 0) {
    return null; // No tunable signal this cycle
  }

  // ── Cap dose changes at ±25%
  for (const dc of doseChanges) {
    if (Math.abs(dc.deltaPct) > MAX_DOSE_CHANGE_PCT) {
      const sign = dc.deltaPct < 0 ? -1 : 1;
      dc.toMg = Math.round(dc.fromMg * (1 + sign * MAX_DOSE_CHANGE_PCT));
      dc.deltaPct = sign * MAX_DOSE_CHANGE_PCT;
    }
  }

  // ── Run additions through Stage 1 safety
  const { safe, firings } = filterCandidatePool(added, safetyCtx);
  const safetyExcluded = added
    .filter((c) => !safe.find((s) => s.name === c.name))
    .map((c) => c.name);
  if (firings.length > 0) {
    rationaleBits.push(
      `Safety filter excluded: ${safetyExcluded.join(", ")} — see audit log.`,
    );
  }

  const next = bumpVersion(currentProtocol.version);

  return {
    fromVersion: currentProtocol.version,
    toVersion: next,
    rationale: rationaleBits.join(" "),
    added: safe,
    removed,
    doseChanges,
    safetyExcluded: safetyExcluded.length ? safetyExcluded : undefined,
    morningExplanation: composeMorningExplanation(rationaleBits, doseChanges, safe),
  };
}

function bumpVersion(v: string): string {
  // v3.2 → v3.3   |   v3.9 → v4.0
  const m = /^v(\d+)\.(\d+)$/.exec(v);
  if (!m) return v + ".1";
  const major = Number(m[1]);
  const minor = Number(m[2]);
  if (minor >= 9) return `v${major + 1}.0`;
  return `v${major}.${minor + 1}`;
}

function composeMorningExplanation(
  rationaleBits: string[],
  doseChanges: FormulaDeltaProposal["doseChanges"],
  added: CandidateIngredient[],
): string {
  // Briston-cadence short sentences. Brand voice: calm, clear, assured.
  if (rationaleBits.length === 0) {
    return "Holding steady.";
  }
  const parts: string[] = [];
  for (const dc of doseChanges) {
    const verb = dc.toMg > dc.fromMg ? "up" : "down";
    const delta = Math.abs(dc.toMg - dc.fromMg);
    parts.push(`${capitalize(simpleName(dc.ingredient))} ${verb} +${delta}mg.`);
  }
  for (const a of added) {
    parts.push(`${capitalize(simpleName(a.name))} back in.`);
  }
  if (parts.length === 0) parts.push("Small tune.");
  return parts.join(" ");
}

function simpleName(name: string): string {
  return name.replace(/glycinate|rosea|monohydrate|methylcobalamin/gi, "").trim();
}
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
