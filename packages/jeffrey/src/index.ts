/**
 * @aissisted/jeffrey — public barrel.
 *
 * This is the server-only entry point for the operating intelligence of
 * Aissisted. Import from here in apps/api routes; never from the browser.
 */

// ----- config / client -----
export { loadConfig, requireVoiceConfig, resetConfigForTests, type JeffreyConfig } from "./config.js";
export { getOpenAIClient, resetClientForTests } from "./client.js";

// ----- identity / voice / memory -----
export {
  jeffreyIdentity,
  responseBeats,
  toneBySurface,
  preferredWords,
  forbiddenWords,
  forbiddenOpeners,
  checkBrandVoice,
  outOfScope,
} from "./personality.js";

export {
  elevenLabsVoice,
  openAiRealtimeVoice,
  defaultTransportBySurface,
} from "./voice.js";

export {
  createSessionMemory,
  noopMemoryAdapter,
  composeMemoryPreamble,
  type SessionMemory,
  type LongTermMemoryAdapter,
  type LongTermMemoryEntry,
} from "./memory.js";

// ----- errors -----
export {
  JeffreyError,
  JeffreyConfigError,
  JeffreyProviderError,
  JeffreyScopeError,
  JeffreyVoiceError,
} from "./errors.js";

// ----- surfaces -----
export {
  investorSurface,
  investorTopics,
  investorContextFor,
  detectInvestorTopic,
  type InvestorTopic,
} from "./investor.js";

export {
  onboardingSurface,
  onboardingSteps,
  getOnboardingStep,
  integrationNarration,
  type OnboardingStepId,
} from "./onboarding.js";

export {
  healthSurface,
  biomarkerFamilies,
  wearableSignals,
  clinicalEscalationPatterns,
  escalateIfPatternMatches,
  healthToolSchemas,
} from "./health-tools.js";

export {
  competitiveSurface,
  competitorShapes,
  differenceAgainst,
  listKnownCompetitors,
  type CompetitorShape,
} from "./competitive.js";

// ----- session orchestrator -----
export {
  createJeffreySession,
  type JeffreySession,
  type CreateSessionOptions,
} from "./session.js";

// ----- types -----
export type {
  JeffreySurface,
  JeffreyToneMode,
  JeffreyUserProfile,
  JeffreyMessage,
  JeffreySessionInput,
  JeffreyAskOptions,
  JeffreyReply,
  VoiceSessionInput,
  AudioChunk,
} from "./types.js";

// ----- prompts + data (re-exported for power-users) -----
export {
  systemPrompt,
  investorOverlay,
  onboardingOverlay,
  healthOverlay,
  competitiveOverlay,
  overlays,
} from "./prompts/index.js";

export {
  brandBible,
  investorFacts,
  competitors,
  integrations,
  type BrandBible,
  type CompetitorId,
  type IntegrationId,
} from "./data/index.js";
