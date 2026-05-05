/**
 * AISSISTED Jeffrey AI System — type model
 *
 * Single source of truth for state, signals, and module identity. Pure types,
 * no runtime dependencies, importable from anywhere (R3F components, mock
 * data, signal router, server-side rendering).
 */

// ─── State machine ─────────────────────────────────────────────────────────

/**
 * SystemMode drives every visual layer:
 *  - idle:           low system hum, slow rotation, occasional ambient pings
 *  - listening:      voice/external streams flow INTO the core
 *  - thinking:       cross-module routing — modules talk to each other via core
 *  - speaking:       core radiates outward to relevant modules
 *  - recommendation: core → stack module specifically; supplement card surfaces
 */
export type SystemMode =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "recommendation";

// ─── Module identity ───────────────────────────────────────────────────────

/**
 * The 7 canonical modules orbiting the AI Core. Each has a fixed angular
 * position (see modulePosition() below) so the user's spatial memory survives
 * across renders.
 */
export type DataModuleType =
  | "sleep"
  | "recovery"
  | "stress"
  | "performance"
  | "metabolic"
  | "labs"
  | "stack";

/** Where a signal can originate or land. "voice" is external user input. */
export type SignalEndpoint = DataModuleType | "core" | "voice";

/** Restricted palette per Brand Bible. */
export type SignalColor = "aqua" | "white" | "red";

// ─── Signal model ──────────────────────────────────────────────────────────

/**
 * A single in-flight signal traveling along a path between two endpoints.
 * Progress is normalized 0→1; the SignalRouter ticks all signals each frame
 * and removes them when progress >= 1.
 */
export interface Signal {
  id: string;
  from: SignalEndpoint;
  to: SignalEndpoint;
  /** 0..1 along the path */
  progress: number;
  /** 0..1 — drives both alpha and trail length */
  intensity: number;
  /** Aqua = healthy/data, White = clarity/conclusion, Red = priority/out-of-range */
  color: SignalColor;
  /** Optional label that surfaces on hover or during speaking */
  label?: string;
  /** ms timestamp of creation, used for fade and ordering */
  createdAt: number;
  /** Speed in progress-per-second. Default ~0.6 (≈1.7s edge traversal). */
  speed: number;
}

// ─── Module data shape ─────────────────────────────────────────────────────

/**
 * Status of a single biomarker or biometric reading.
 *  - optimal: in-range (aqua signals)
 *  - watch:   trending toward out-of-range (white pulses, no red yet)
 *  - priority: out-of-range, demands attention (restrained red)
 */
export type ModuleStatus = "optimal" | "watch" | "priority";

/**
 * What each ModuleCard renders. Includes one primary value and up to 3
 * supporting metrics for context.
 */
export interface ModuleData {
  type: DataModuleType;
  label: string;
  /** e.g. "7h 41m", "92%", "64ms", "92↑" */
  primaryValue: string;
  /** Short status caption like "well rested", "ApoB out of range" */
  caption: string;
  status: ModuleStatus;
  /** Optional secondary readings displayed below primary */
  metrics?: { label: string; value: string; status?: ModuleStatus }[];
  /** History array for the micro-sparkline. 0..1 normalized. */
  spark?: number[];
}

// ─── Personalization ───────────────────────────────────────────────────────

export interface UserContext {
  name: string;
  /** ISO timestamp of the last data sync */
  lastSyncedAt: string;
  /** Aggregate health-state phrase shown in header */
  state: string;
}

/**
 * Top-level snapshot the JeffreyAISystem owns. The mock layer fills this
 * with realistic Ron data; production would hydrate it from the bridge layer.
 */
export interface SystemSnapshot {
  user: UserContext;
  modules: Record<DataModuleType, ModuleData>;
}

// ─── Geometry helpers ──────────────────────────────────────────────────────

/**
 * Fixed 7-position layout around the core. Returns a 3D position in scene
 * units (the Canvas is set up with units ≈ pixels / 100 — so 3.0 = 300px).
 *
 * Layout is intentional, NOT random:
 *  - Sleep on top (input we monitor most)
 *  - Recovery upper-right (paired with Sleep)
 *  - Performance right (active state)
 *  - Stack lower-right (output)
 *  - Stress lower-left (paired with Performance contrast)
 *  - Metabolic left (input we infer from labs)
 *  - Labs upper-left (input most precise)
 */
export function modulePosition(type: DataModuleType): [number, number, number] {
  // Radius in world units. Modules sit on a ring at r=3.2.
  const R = 3.2;
  const positions: Record<DataModuleType, number> = {
    sleep:        90,    // top
    recovery:     38,    // upper right
    performance:  -10,   // right (slightly below horizon)
    stack:        -60,   // lower right
    stress:       -125,  // lower left
    metabolic:    170,   // left
    labs:         128,   // upper left
  };
  const deg = positions[type];
  const rad = (deg * Math.PI) / 180;
  return [Math.cos(rad) * R, Math.sin(rad) * R, 0];
}

/** Brand colors as hex strings, suitable for ShaderMaterial uniforms. */
export const BRAND_COLOR = {
  aqua: "#00C2D1",
  red: "#EE2B37",
  white: "#FFFFFF",
  graphite: "#1C1C1E",
  midnight: "#0B1D3A",
} as const;

/** Numeric vec3 helpers (THREE.Color expects [r,g,b] in 0..1) */
export const BRAND_VEC3 = {
  aqua: [0.0, 0.760, 0.819] as [number, number, number],
  red: [0.933, 0.169, 0.216] as [number, number, number],
  white: [1.0, 1.0, 1.0] as [number, number, number],
  graphite: [0.110, 0.110, 0.118] as [number, number, number],
  midnight: [0.043, 0.114, 0.227] as [number, number, number],
};
