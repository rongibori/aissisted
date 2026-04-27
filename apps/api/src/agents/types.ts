import type { JeffreyMessage } from "@aissisted/jeffrey";

export type ConversationMessage = JeffreyMessage;
export type SideEffect = { type: string; payload: unknown };

export type IntentClass =
  | "question.general"
  | "question.personal"
  | "question.protocol"
  | "reflection.mood"
  | "reflection.progress"
  | "action.update_goal"
  | "action.log_biomarker"
  | "action.sync_device"
  | "action.update_preference"
  | "action.adjust_protocol"
  | "navigation.show_insights"
  | "navigation.show_protocol"
  | "navigation.show_history"
  | "onboarding.step"
  | "milestone.acknowledged"
  | "safety.symptom_reported"
  | "safety.crisis"
  | "system.scheduled.review"
  | "system.ingestion.tick";

export interface ClassifiedIntent {
  class: IntentClass;
  confidence: 0 | 1 | 2 | 3;
  modifiers: string[];
  entities: Record<string, unknown>;
  requiresPHIAccess: boolean;
}

export type StateSliceKey =
  | "profile"
  | "biomarkers"
  | "protocol"
  | "healthState"
  | "trends"
  | "adherence"
  | "medications"
  | "conditions"
  | "conversations";

export type {
  ProfileData,
  BiomarkerData,
  ProtocolData,
  HealthStateData,
  TrendData,
  AdherenceData,
  MedicationData,
  ConditionData,
} from "./slice-types.js";

import type {
  ProfileData,
  BiomarkerData,
  ProtocolData,
  HealthStateData,
  TrendData,
  AdherenceData,
  MedicationData,
  ConditionData,
} from "./slice-types.js";

export interface StateSlice {
  profile?: ProfileData;
  biomarkers?: BiomarkerData[];
  protocol?: ProtocolData;
  healthState?: HealthStateData;
  trends?: TrendData[];
  adherence?: AdherenceData;
  medications?: MedicationData[];
  conditions?: ConditionData[];
  conversations?: ConversationMessage[];
}

export interface AgentOutput {
  agentName: string;
  content: string;
  structured?: unknown;
  confidence: number;
  reasoning: string;
  sideEffects?: SideEffect[];
}

export interface AgentContext {
  userId: string;
  intent: ClassifiedIntent;
  state: StateSlice;
  conversationHistory: ConversationMessage[];
  previousAgentOutputs?: AgentOutput[];
}

export interface Agent<TInput = AgentContext, TOutput = AgentOutput> {
  name: string;
  version: string;
  requiredSlice: StateSliceKey[];
  execute(input: TInput): Promise<TOutput>;
}
