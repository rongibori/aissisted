/**
 * @aissisted/orchestrator — public API
 *
 * The orchestration layer that binds Jeffrey's voice to system behavior.
 *
 *   voice input → semantic intent → system state → visual response → product
 *
 * Architecture:
 *
 *   Realtime hook (existing useJeffreyRealtime)
 *      │ events
 *      ▼
 *   Realtime adapter ──── classifier (embedding + LLM)
 *      │
 *      ▼
 *   Zustand store (single source of truth)
 *      │ reactive selectors
 *      ▼
 *   UI subscribers (Neural Core, module tiles, transcript)
 *
 * UI components are dumb consumers — they subscribe to state slices via the
 * hooks in ./adapters/react-hooks.ts and don't know about voice or narrative.
 */

// State + types
export {
  MODULE_IDS,
  type ModuleId,
  type SystemMode,
  type VoiceConnectionState,
  type Intent,
  type Classification,
  type NarrativeNode,
  type NarrativePosition,
  type PersonalizationSnapshot,
  type ModuleData,
  type OrchestrationState,
  type OrchestrationEvent,
  useOrchestratorStore,
  dispatch,
  getOrchestrationState,
  subscribe,
  reduce,
  INITIAL_STATE,
  TUNABLES,
} from "./state/index";

// Classifier
export {
  MODULE_CONCEPTS,
  flattenAnchors,
  TOTAL_ANCHORS,
  INTENTS,
  URGENCY_LEVELS,
  initAnchorCache,
  clearAnchorCache,
  cosine,
  classifyEmbedding,
  classifyResponseToClassification,
  type ModuleConcept,
  type FlatAnchor,
  type Urgency,
  type Embedding,
  type CachedAnchor,
  type EmbedRequest,
  type EmbedResponse,
  type EmbedFn,
  type ClassifyOptions,
  type ClassifyRequest,
  type ClassifyResponse,
  type ClassifyFn,
} from "./classifier/index";

// Adapters + React hooks
export {
  createRealtimeAdapter,
  useOrchestratorMode,
  useVoiceConnection,
  useIsAssistantSpeaking,
  usePrimaryFocus,
  useActiveModules,
  useAllTopicConfidence,
  useTopicConfidence,
  useCurrentNarrativeNode,
  useInterruptionStackDepth,
  useIsInterrupted,
  useLastClassification,
  useLastUserUtterance,
  useLastAssistantUtterance,
  useOrchestrationDebugSnapshot,
  type RealtimeAdapterDeps,
  type RealtimeAdapterControls,
} from "./adapters/index";
