/**
 * @aissisted/jeffrey/safety — public exports
 *
 * Aligned with SAFETY_RULE_PACK_V1.md v1.1 and roadmap §5.4 / Jeffrey Brain
 * Roadmap §J2-1. Two checkpoints, one rule pack, one audit ledger.
 */

export {
  evaluateStage1,
  evaluateSafetyGate,
  runCheckpoint,
  filterCandidatePool,
} from "./engine.js";

export { SAFETY_RULES_V1 } from "./rules.js";

export type {
  SafetyAction,
  SafetyCategory,
  SafetyCheckpoint,
  SafetyContext,
  SafetyFiring,
  SafetyResult,
  SafetyRule,
  SafetySeverity,
  SafetyUserProfile,
  SafetyLabValue,
  CandidateIngredient,
  AgentResponseDraft,
  ProtocolDelta,
} from "./types.js";
