/**
 * @aissisted/jeffrey-evals — Runner Types
 *
 * Shared types for the eval runner. Calibrated to:
 * - OpenAI canonical brain (single key, all surfaces)
 * - ElevenLabs primary TTS, OpenAI Realtime fallback
 * - Postgres + pgvector for memory
 * - Drizzle for structured data
 *
 * No external test-framework dependencies — runs under Vitest.
 */

import type { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Persona / Cohort
// ─────────────────────────────────────────────────────────────────────────────

export type PersonaId = `C-${string}`;
export type EvalCaseId = string;
export type EvalSetId = 'H-T' | 'H-V' | 'DNR' | 'MR' | 'TI' | 'PT' | 'BV' | 'SR';

export type Channel = 'text' | 'voice';

export interface SyntheticPersona {
  id: PersonaId;
  meta: PersonaMeta;
  user: PersonaUser;
  healthProfile: PersonaHealthProfile;
  labHistory: LabPanel[];
  wearables: WearableConnection[];
  adherence: AdherenceSummary;
  currentProtocol: PersonaProtocol;
  priorConversations: PriorConversation[];
  memorySeed: MemoryItemSeed[];
  adversarialInputCategories?: AdversarialCategory[];
}

export interface PersonaMeta {
  persona: string;
  description: string;
  primaryStressTest: string;
  riskFlags: string[];
  fictionDisclaimer: string;
  notForProductionAnalogues?: boolean;
}

export interface PersonaUser {
  userId: string;
  displayName: string;
  sex: 'M' | 'F' | 'X';
  dob: string;
  heightCm: number;
  weightKg: number;
  createdAt: string;
  status: 'onboarding' | 'active' | 'paused' | 'churned';
}

export interface PersonaHealthProfile {
  goals: string[];
  demographics: Record<string, string>;
  conditions: { code: string; label: string; sinceMonth: string }[];
  medications: { name: string; dose: string; sinceMonth: string }[];
  allergies: string[];
  lifestyleNotes: string[];
}

export interface LabPanel {
  panelId: string;
  drawnAt: string;
  source: string;
  biomarkers: Biomarker[];
}

export interface Biomarker {
  metric: string;
  value: number;
  unit: string;
  refRange: [number, number];
  status: 'normal' | 'normal-low' | 'normal-high' | 'low' | 'borderline' | 'elevated' | 'elevated-prediabetic' | 'critical';
}

export interface WearableConnection {
  provider: 'whoop' | 'oura' | 'apple_health';
  connectedAt: string;
  summary: string;
  dailyDataRef: string;
}

export interface AdherenceSummary {
  summary: string;
  logRef: string | null;
}

export interface PersonaProtocol {
  version: number;
  activatedAt: string;
  ingredients: ProtocolIngredient[];
  explicitlyExcluded?: { ingredient: string; reason: string }[];
}

export interface ProtocolIngredient {
  ingredientId: string;
  name: string;
  doseAmount: number;
  doseUnit: string;
  timing: 'am' | 'pm' | 'split' | 'with_meal';
  rationale: string;
  confidence: number;
}

export interface PriorConversation {
  id: string;
  occurredAt: string;
  channel: Channel;
  summary: string;
  extractedFacts: { kind: MemoryKind; content: string; confidence: number }[];
}

export type MemoryKind = 'fact' | 'preference' | 'event' | 'commitment' | 'safety-flag' | 'clinical-context';

export interface MemoryItemSeed {
  kind: MemoryKind;
  content: string;
  source: 'jeffrey' | 'onboarding' | 'derived';
  createdAt: string;
}

export interface AdversarialCategory {
  category: string;
  description: string;
  exampleAttacks: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Eval Cases
// ─────────────────────────────────────────────────────────────────────────────

export interface EvalCase {
  id: EvalCaseId;
  setId: EvalSetId;
  personaId: PersonaId;
  channel: Channel;
  input: string;

  // Optional state overrides for the test
  personaStateOverride?: Record<string, unknown>;

  // Expectations
  expectedToolCalls?: ExpectedToolCall[];
  expectedBehaviors?: string[];
  mustNotContain?: string[];
  mustContainEmergencyResources?: boolean;
  mustContainCrisisResources?: boolean;
  expectedRule?: string;
  expectedAuditEntries?: ExpectedAuditEntry[];
  memoryItemsThatShouldBeRetrieved?: string[];

  // Quality controls
  qualityRubric?: string;
  maxResponseSentences?: number;
  alternateAcceptable?: string;

  // For PT set
  trigger?: string;
  triggerPayload?: Record<string, unknown>;

  // For SR set
  ruleId?: string;
  shouldFire?: boolean;
  rationale?: string;

  // Stub flag for unauthored cases
  stub?: boolean;
  topic?: string;
}

export interface ExpectedToolCall {
  tool: string;
  argsContains?: Record<string, unknown>;
}

export interface ExpectedAuditEntry {
  type: string;
  trigger?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Results
// ─────────────────────────────────────────────────────────────────────────────

export interface CaseResult {
  caseId: EvalCaseId;
  setId: EvalSetId;
  personaId: PersonaId;
  status: 'pass' | 'fail' | 'skip';
  hardFails: string[];
  qualityScore: number; // 0-5
  brandVoiceScore: number; // 0-5
  metrics: CaseMetrics;
  capturedResponse: CapturedResponse;
  scoringNotes: string[];
  startedAt: string;
  completedAt: string;
}

export interface CaseMetrics {
  firstTokenLatencyMs?: number;
  firstAudioLatencyMs?: number;
  totalLatencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  toolCallCount: number;
}

export interface CapturedResponse {
  text: string;
  audioRef?: string;
  toolCalls: { tool: string; args: Record<string, unknown> }[];
  auditEntriesWritten: { type: string; payload: Record<string, unknown> }[];
  memoryWritesAttempted: { kind: MemoryKind; content: string }[];
  /** Populated by execute.ts; consumed by score.ts to fill CaseResult.metrics. */
  turnMetrics?: CaseMetrics;
}

export interface RunReport {
  runId: string;
  startedAt: string;
  completedAt: string;
  gitSha?: string;
  models: { brain: string; embeddings: string; voiceTts: string };
  totals: {
    cases: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  perSet: Record<EvalSetId, { passed: number; failed: number; total: number }>;
  gate: {
    blocking: boolean;
    reasons: string[];
  };
  costUsd: number;
  durationSec: number;
  caseResults: CaseResult[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Runner contract
// ─────────────────────────────────────────────────────────────────────────────

export interface EvalRunnerOptions {
  setIds?: EvalSetId[]; // run a subset
  caseIds?: EvalCaseId[]; // run individual cases
  fast?: boolean; // skip voice + use small subset
  recordAudio?: boolean;
  reportPath?: string;
}

export interface EvalRunner {
  setup(): Promise<void>;
  loadCohort(): Promise<SyntheticPersona[]>;
  loadEvalSet(setId: EvalSetId): Promise<EvalCase[]>;
  runCase(testCase: EvalCase, persona: SyntheticPersona): Promise<CaseResult>;
  runSet(setId: EvalSetId, opts?: EvalRunnerOptions): Promise<CaseResult[]>;
  generateReport(results: CaseResult[]): Promise<RunReport>;
  teardown(): Promise<void>;
}
