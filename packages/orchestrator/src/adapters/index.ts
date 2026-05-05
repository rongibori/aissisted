/**
 * Public adapter surface — the realtime bridge + React hooks.
 */

export {
  createRealtimeAdapter,
  type RealtimeAdapterDeps,
  type RealtimeAdapterControls,
} from "./realtime-adapter.js";

export {
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
} from "./react-hooks.js";
