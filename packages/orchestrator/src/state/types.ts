/**
 * @aissisted/orchestrator — state model
 *
 * Single source of truth for the orchestration layer. The visualization layer
 * (apps/web/components/JeffreyAISystem) and any other UI surface subscribe to
 * slices of this state; they do not care about voice events directly.
 *
 * Module identity and SystemMode mirror JeffreyAISystem/systemTypes.ts EXACTLY.
 * That file is the canonical source. We re-export the relevant types here so
 * downstream consumers don't reach into apps/web/components/* for type-only
 * imports, but any change to module identity must update both.
 */

// ─── Canonical module identity (mirrors apps/web/components/JeffreyAISystem/systemTypes.ts) ──

/**
 * The 7 canonical modules orbiting the AI Core. Order is intentional —
 * matches the spatial layout in JeffreyAISystem so any future UI binding
 * can use this list as the canonical iteration order.
 */
export const MODULE_IDS = [
  "sleep",
  "recovery",
  "stress",
  "performance",
  "metabolic",
  "labs",
  "stack",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

/**
 * SystemMode — drives every visual layer downstream.
 *
 *  - idle:           low system hum, slow rotation, occasional ambient pings
 *  - listening:      voice/external streams flow INTO the core
 *  - thinking:       cross-module routing — modules talk to each other via core
 *  - analyzing:      thinking + explicit data lookup in progress (e.g. fetching
 *                     biomarker history). Distinct from thinking so UI can
 *                     surface a "pulling from your data" cue.
 *  - speaking:       core radiates outward to relevant modules
 *  - recommendation: core → stack module specifically; supplement card surfaces
 *
 * NOTE: `analyzing` is an orchestrator-layer extension to the canonical 5
 * modes in JeffreyAISystem/systemTypes.ts. Visualization consumers that only
 * understand the canonical 5 should map `analyzing → thinking` — both are
 * valid "core is working" states.
 */
export type SystemMode =
  | "idle"
  | "listening"
  | "thinking"
  | "analyzing"
  | "speaking"
  | "recommendation";

// ─── Voice connection state (mirrors useJeffreyRealtime hook RealtimeState) ──

export type VoiceConnectionState =
  | "disconnected"
  | "connecting"
  | "ready"
  | "error";

// ─── Intent + topic types ────────────────────────────────────────────────

/**
 * Coarse-grained intent categories. Used by the LLM classifier on final
 * utterances to route the response strategy. Topic detection (which modules
 * to activate) is handled separately by the embedding classifier.
 */
export type Intent =
  | "question_about_data"      // "How is my recovery this week?"
  | "question_about_methodology" // "How does the formula work?"
  | "question_about_trust"     // "Where does my data go? Privacy?"
  | "objection"                 // skeptical pushback
  | "request_for_change"        // "I want more focus support"
  | "meta_navigation"           // "Go back / skip / wait"
  | "narrative_continue"        // tacit ack, keep going
  | "unknown";

/**
 * Output of a single classification pass. The embedding classifier emits
 * `topics` + `topicConfidence`; the LLM classifier additionally emits
 * `intent` + `urgency` + `requiresDataLookup`.
 */
export interface Classification {
  intent: Intent;
  topics: ModuleId[];
  topicConfidence: Partial<Record<ModuleId, number>>; // 0..1 per module
  urgency: "low" | "normal" | "high";
  requiresDataLookup: boolean;
  rawText: string;
  source: "embedding" | "llm";
  classifiedAt: number; // ms epoch
}

// ─── Narrative ────────────────────────────────────────────────────────────

/**
 * One node in the loosely-guided investor narrative tree. Each node maps to a
 * deck moment, includes a Jeffrey prompt, default active modules, and allowed
 * branches. Nodes are hand-built for v1; LLM-augmented branching comes later.
 */
export interface NarrativeNode {
  id: string;
  /** Human-readable name for debugging — e.g. "act-1-problem". */
  label: string;
  /** Master deck slide range covered by this node, e.g. [3, 5]. */
  deckSlides?: [number, number];
  /** Jeffrey's prompt content for this node — guides what he'll say. */
  jeffreyPrompt: string;
  /** Modules to activate by default while this node is current. */
  defaultModules: ModuleId[];
  /** Allowed forward transitions (next nodes by id). */
  branches: string[];
  /**
   * Resume behavior on interruption-then-question. Default is "natural".
   *
   *   "natural" — DEFAULT. After answering the deviation, Jeffrey resumes
   *               with a subtle, conversational transition like "Let's
   *               continue from where we left off." NOT phrased as a
   *               question. Feels like a person picking up the thread.
   *   "auto"    — Resume silently, no transition phrase. Use when the
   *               deviation was tiny and resuming is obviously the next move.
   *   "ask"     — Explicitly ask "Would you like me to continue?". Use
   *               only when context is genuinely ambiguous (e.g. user's
   *               question implies a topic shift).
   *   "never"   — Treat the deviation as the natural end of this node.
   *               Don't push back to the prior point. Use for nodes that
   *               are themselves an aside (e.g. mid-pitch open-ended Q&A).
   */
  resumeBehavior: "natural" | "auto" | "ask" | "never";
}

/**
 * Snapshot of where Jeffrey is in the narrative. interruptionStack holds nodes
 * that were interrupted; resume pops the most recent.
 */
export interface NarrativePosition {
  current: NarrativeNode | null;
  interruptionStack: NarrativeNode[];
  /** When the current node was entered (for analytics + decay). */
  enteredAt: number;
}

// ─── Live data binding ───────────────────────────────────────────────────

/**
 * Per-user personalization snapshot. Hydrated once from the API at session
 * start; module data values inside it can update from realtime context.
 */
export interface PersonalizationSnapshot {
  userId: string;
  name: string;
  state: string;
  lastSyncedAt: string;
}

/**
 * Live values for a single module — what gets rendered when that module is
 * active. Mirrors apps/web/components/JeffreyAISystem/systemTypes.ts
 * ModuleData but kept here as a structural duplicate to keep the orchestrator
 * package independent of the visualization package.
 */
export interface ModuleData {
  primaryValue: string;
  caption: string;
  status: "optimal" | "watch" | "priority";
  // Sparkline values 0..1 normalized.
  spark?: number[];
  metrics?: { label: string; value: string; status?: "optimal" | "watch" | "priority" }[];
}

// ─── Top-level state ─────────────────────────────────────────────────────

export interface OrchestrationState {
  // Voice + connection
  mode: SystemMode;
  voiceConnection: VoiceConnectionState;
  isAssistantSpeaking: boolean;

  // Topic awareness — confidence decays over time when not reinforced
  activeModules: Set<ModuleId>;
  primaryFocus: ModuleId | null;
  topicConfidence: Record<ModuleId, number>; // 0..1, fully populated

  // Narrative position
  narrative: NarrativePosition;

  // Live data
  userData: PersonalizationSnapshot | null;
  moduleData: Partial<Record<ModuleId, ModuleData>>;

  // Last classifications (debug + observability)
  lastClassification: Classification | null;
  lastUserUtterance: string;
  lastAssistantUtterance: string;
}

// ─── Event union — what reducers consume ─────────────────────────────────

export type OrchestrationEvent =
  // Voice connection
  | { type: "voice.connecting" }
  | { type: "voice.ready" }
  | { type: "voice.disconnected" }
  | { type: "voice.error"; error: string }

  // VAD / turn-taking
  | { type: "user.speech_started" } // triggers barge-in if assistant is speaking
  | { type: "user.speech_stopped" }
  | { type: "user.utterance_final"; text: string; turnId: string }
  | { type: "assistant.audio_started" }
  | { type: "assistant.text_delta"; text: string; turnId: string; partial: boolean }
  | { type: "assistant.audio_done" }
  | { type: "assistant.response_done" }

  // Classification
  | { type: "classification.partial"; classification: Classification } // embedding-driven, fast
  | { type: "classification.final"; classification: Classification }   // LLM-driven, accurate

  // Topic confidence decay (emitted by a tick scheduler)
  | { type: "tick"; nowMs: number }

  // Narrative
  | { type: "narrative.set"; node: NarrativeNode }
  | { type: "narrative.advance"; toNodeId: string }
  | { type: "narrative.interrupt" }                  // push current onto stack
  | { type: "narrative.resume" }                     // pop and continue
  | { type: "narrative.discard_interruption" }       // forget the stack

  // User data binding
  | { type: "user.snapshot_loaded"; snapshot: PersonalizationSnapshot }
  | { type: "module.data_updated"; moduleId: ModuleId; data: ModuleData };
