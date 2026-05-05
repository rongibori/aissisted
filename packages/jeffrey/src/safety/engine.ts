/**
 * @aissisted/jeffrey/safety — engine
 *
 * Evaluates the loaded rule pack at the appropriate checkpoint.
 *
 *   evaluateStage1(ctx, candidate) → { decision, firings }
 *     Pre-AI. Excludes ingredients from the candidate pool.
 *
 *   evaluateSafetyGate(ctx) → SafetyResult
 *     Post-AI. Blocks/flags/escalates the assembled response before brand filter.
 *
 * Order of operations:
 *   1. Run all rules at the checkpoint.
 *   2. Highest severity wins (escalate > block > flag > pass).
 *   3. ALL firings are returned for audit, even when overridden by severity.
 *   4. responseOverride is set from the first firing of the winning severity.
 */

import { SAFETY_RULES_V1 } from "./rules.js";
import type {
  SafetyContext,
  SafetyFiring,
  SafetyResult,
  SafetyRule,
  SafetySeverity,
} from "./types.js";

type SafetyDecision = SafetyResult["decision"];

const SEVERITY_RANK: Record<SafetySeverity | "pass", number> = {
  pass: 0,
  flag: 1,
  block: 2,
  escalate: 3,
};

const SEVERITY_TO_DECISION: Record<SafetySeverity, SafetyDecision> = {
  flag: "flag",
  block: "block",
  escalate: "escalate",
};

export function evaluateStage1(ctx: SafetyContext): SafetyResult {
  return runCheckpoint("stage_1", ctx);
}

export function evaluateSafetyGate(ctx: SafetyContext): SafetyResult {
  return runCheckpoint("safety_gate", ctx);
}

export function runCheckpoint(
  checkpoint: SafetyRule["checkpoint"],
  ctx: SafetyContext,
  rules: SafetyRule[] = SAFETY_RULES_V1,
): SafetyResult {
  const firings: SafetyFiring[] = [];

  for (const rule of rules) {
    if (rule.checkpoint !== checkpoint) continue;
    let fired = false;
    try {
      fired = rule.condition(ctx);
    } catch (err) {
      // A rule throwing is itself a deploy gate signal — log it loud, treat as
      // false (rule didn't fire) so the engine doesn't crash on user turns.
      // eslint-disable-next-line no-console
      console.error(`[safety] rule ${rule.id} threw:`, err);
      fired = false;
    }
    if (!fired) continue;

    firings.push({
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      checkpoint: rule.checkpoint,
      triggeredAt: new Date().toISOString(),
      reason: rule.action.auditMessage,
      contextSnapshot: snapshotContext(ctx),
    });
  }

  if (firings.length === 0) {
    return { decision: "pass", firings: [] };
  }

  // Highest severity wins
  const winning = firings.reduce<SafetyFiring>((acc, f) =>
    SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc.severity] ? f : acc,
  firings[0]);

  const winningRule = rules.find((r) => r.id === winning.ruleId);
  return {
    decision: SEVERITY_TO_DECISION[winning.severity],
    firings,
    responseOverride: winningRule?.action.responseTemplate,
  };
}

/**
 * Strip PII and large fields before snapshotting context into the audit log.
 * The ledger needs enough to debug — not to re-identify.
 */
function snapshotContext(ctx: SafetyContext): Record<string, unknown> {
  return {
    userId: ctx.profile.userId,
    candidate: ctx.candidate
      ? { name: ctx.candidate.name, doseMg: ctx.candidate.doseMg, timing: ctx.candidate.timing }
      : undefined,
    inputLen: ctx.input?.length,
    medicationsCount: ctx.profile.medications.length,
    conditionsCount: ctx.profile.conditions.length,
    pregnant: ctx.profile.pregnant,
    lactating: ctx.profile.lactating,
  };
}

/** Filter the candidate pool through Stage 1, returning only safe ingredients + audit. */
export function filterCandidatePool(
  candidates: SafetyContext["candidate"][],
  baseCtx: SafetyContext,
): { safe: NonNullable<SafetyContext["candidate"]>[]; firings: SafetyFiring[] } {
  const safe: NonNullable<SafetyContext["candidate"]>[] = [];
  const allFirings: SafetyFiring[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const result = evaluateStage1({ ...baseCtx, candidate });
    if (result.decision === "pass" || result.decision === "flag") {
      safe.push(candidate);
    }
    allFirings.push(...result.firings);
  }
  return { safe, firings: allFirings };
}
