/**
 * @aissisted/jeffrey/safety — types
 *
 * Aligned with SAFETY_RULE_PACK_V1.md v1.1. Two checkpoints:
 *   - stage_1: pre-AI ingredient pool filtering (Protocol Engine Stage 1)
 *   - safety_gate: post-AI output check (before Brand Filter)
 */

export type SafetyCheckpoint = "stage_1" | "safety_gate";

export type SafetyCategory =
  | "interaction"
  | "dosing"
  | "critical_value"
  | "red_flag"
  | "freshness"
  | "contradiction"
  | "compound_risk";

export type SafetySeverity = "block" | "flag" | "escalate";

export interface SafetyRule {
  id: string;             // e.g. "SAFE-001" (numeric) or "I-18-statin-red-yeast-rice" (eval-aligned)
  name: string;
  version: string;        // semver
  checkpoint: SafetyCheckpoint;
  category: SafetyCategory;
  severity: SafetySeverity;
  description: string;
  /** Deterministic predicate. Returns true when the rule fires. */
  condition: (ctx: SafetyContext) => boolean;
  /** What the user sees + how to resolve when fired */
  action: SafetyAction;
  evidence?: string;      // Clinical basis — citation or DOI
  reviewedBy?: string;    // Clinician name + credential
  reviewedAt?: string;    // ISO8601
  effectiveFrom?: string; // ISO8601
}

export interface SafetyAction {
  /** Internal: what the engine does on trigger */
  onTrigger: "exclude_ingredient" | "block_response" | "flag_response" | "escalate_to_clinician";
  /** Outward: in-character response template (optional — dynamic per-case overrides allowed) */
  responseTemplate?: string;
  /** Audit message for the ledger entry */
  auditMessage: string;
  /** Suggested remediation surfaced to the user */
  remediation?: string;
}

/**
 * Context passed to every rule's condition predicate.
 * Stage 1 rules see {profile, candidate}.  Safety-gate rules see everything including {response}.
 */
export interface SafetyContext {
  profile: SafetyUserProfile;
  /** Stage 1: the candidate ingredient under evaluation */
  candidate?: CandidateIngredient;
  /** Safety gate: the assembled agent response prior to brand filter */
  response?: AgentResponseDraft;
  /** Safety gate: the user input that triggered this turn */
  input?: string;
  /** ISO timestamp of the data points used (for freshness checks) */
  dataAsOf?: string;
}

export interface SafetyUserProfile {
  userId: string;
  age?: number;
  sexAtBirth?: "male" | "female" | "intersex";
  pregnant?: boolean;
  lactating?: boolean;
  conditions: string[];               // canonical condition codes
  medications: string[];              // canonical medication names (lowercase)
  allergies: string[];                // canonical allergen names
  recentLabs?: SafetyLabValue[];      // last 90 days of relevant biomarkers
  mentalHealthFlags?: string[];       // e.g. ["history-eating-disorder"]
}

export interface SafetyLabValue {
  biomarker: string;
  value: number;
  unit: string;
  measuredAt: string; // ISO8601
  /** Optional: "critical_low" | "low" | "normal" | "high" | "critical_high" if pre-classified */
  status?: "critical_low" | "low" | "normal" | "high" | "critical_high";
}

export interface CandidateIngredient {
  name: string;          // canonical name (lowercase)
  doseMg?: number;
  unit?: string;
  timing?: "morning" | "day" | "evening" | "with_meal" | "anytime";
}

export interface AgentResponseDraft {
  text: string;
  citedTools: string[];
  protocolDelta?: ProtocolDelta;
  /**
   * Free-form per-agent metadata for downstream consumers — used by the
   * chat route to thread back fields the orchestrator's standard contract
   * doesn't model (intent classification, protocol-triggered flag,
   * conversation id). Optional; agents may omit.
   */
  metadata?: Record<string, unknown>;
}

export interface ProtocolDelta {
  added: CandidateIngredient[];
  removed: string[];
  doseChanges: Array<{ ingredient: string; fromMg: number; toMg: number }>;
}

export interface SafetyFiring {
  ruleId: string;
  ruleName: string;
  severity: SafetySeverity;
  checkpoint: SafetyCheckpoint;
  triggeredAt: string;       // ISO
  reason: string;
  contextSnapshot: Record<string, unknown>;
}

export interface SafetyResult {
  decision: "pass" | "block" | "flag" | "escalate";
  firings: SafetyFiring[];
  /** When decision !== "pass", this is what the user sees */
  responseOverride?: string;
}
