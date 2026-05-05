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
} from "./state/index.js";

// Classifier
export {
  MODULE_CONCEPTS,
  flattenAnchors,
  TOTAL_ANCHORS,
  INTENTS,
  URGENCY_LEVELS,
  type ModuleConcept,
  type FlatAnchor,
  type Urgency,
} from "./classifier/index.js";
