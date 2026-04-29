/**
 * Shared types for @aissisted/jeffrey.
 *
 * Types only — no runtime imports. Safe to reference from any module in this
 * package. Still server-only at import-graph level.
 */

/**
 * Every Aissisted surface Jeffrey can power. Adding one here is a conscious
 * product decision — it means Jeffrey has a persona adaptation for it.
 */
export type JeffreySurface =
  | "investor"
  | "onboarding"
  | "product-walkthrough"
  | "health"
  | "brand"
  | "concierge";

/**
 * Tone mode is the knob we turn per surface. Identity is constant; tone adapts.
 */
export type JeffreyToneMode =
  | "strategy"
  | "product"
  | "health"
  | "brand";

export interface JeffreyUserProfile {
  userId: string;
  displayName?: string;
  /** Connected data sources — drives what Jeffrey can reference. */
  connectedSources: Array<
    "mychart" | "whoop" | "apple-health" | "oura" | "labs-upload"
  >;
  /** Freeform notes Jeffrey has earned about this person. */
  memorySummary?: string;
}

export interface JeffreyMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Optional tool-call metadata when role === "tool". */
  toolName?: string;
  toolCallId?: string;
}

export interface JeffreySessionInput {
  surface: JeffreySurface;
  userId?: string;
  /** Optional profile snapshot; session loader will fetch if omitted. */
  profile?: JeffreyUserProfile;
  /** Override the model for this session. Defaults per surface. */
  model?: string;
  /** Pass additional reference data into context (e.g. an investor deck excerpt). */
  extraContext?: string[];
}

export interface JeffreyAskOptions {
  /** Max tokens for the response. */
  maxTokens?: number;
  /** Temperature override. Jeffrey runs cool by default. */
  temperature?: number;
  /** Abort signal for long-running calls. */
  signal?: AbortSignal;
  /** Attach the raw OpenAI completion object to the result for debugging. */
  captureRaw?: boolean;
}

export interface TurnTiming {
  /** Wall-clock time for the entire ask() call body. */
  totalMs: number;
  /** Time spent inside openai.chat.completions.create() only. */
  llmMs: number;
}

export interface TurnCost {
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Derived USD cost. null when model string is unrecognized. */
  usd: number | null;
}

export interface CapturedTurnResult {
  reply: JeffreyReply;
  timing: TurnTiming;
  cost: TurnCost;
  /** Unmodified OpenAI completion object. Only present when captureRaw: true. */
  raw?: unknown;
}

export interface JeffreyReply {
  text: string;
  /** Tokens used — surfaces for billing dashboards. */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Which model answered — surfaces per-surface routing. */
  model: string;
  /** When this reply was generated. */
  createdAt: string;
}

export interface VoiceSessionInput extends JeffreySessionInput {
  /** Which voice delivery transport to use. */
  transport: "openai-realtime" | "elevenlabs" | "hybrid";
}

/** A chunk of synthesised audio in the streaming voice pipeline. */
export interface AudioChunk {
  /** PCM or mp3 bytes depending on transport. */
  bytes: Uint8Array;
  /** Monotonic sequence number for ordering. */
  seq: number;
  /** True once this is the final chunk for the current turn. */
  final: boolean;
  mime: "audio/mpeg" | "audio/pcm" | "audio/wav";
}
