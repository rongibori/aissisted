/**
 * AISSISTED Jeffrey AI System — signal router
 *
 * Pure logic. No React, no R3F. Owns the in-flight signal queue, advances
 * progress per frame, removes completed signals, and exposes mode-specific
 * spawn rules.
 *
 * Mode → spawn pattern:
 *   idle:           rare ambient pings from random module → core (≤1/s)
 *   listening:      voice → core continuous + biometric modules pulsing in
 *   thinking:       cross-module routing — random module pairs round-trip
 *   speaking:       core → activeModules outward
 *   recommendation: core → stack heavily; suppress all other paths
 */

import type {
  Signal,
  SystemMode,
  DataModuleType,
  SignalEndpoint,
  SignalColor,
  ModuleStatus,
} from "./systemTypes";

let _idSeq = 0;
const nextId = () => `sig-${++_idSeq}`;

export interface RouterOptions {
  /** Modules currently considered "active" for thinking/speaking targeting */
  activeModules: DataModuleType[];
  /** Map of module → status for color biasing (priority → red signals) */
  moduleStatus?: Record<DataModuleType, ModuleStatus>;
  /** Optional intensity boost (0..1) — used by demo controller for emphasis */
  intensity?: number;
}

/**
 * SignalRouter is the per-instance state container. The R3F components own
 * one of these and tick it each frame.
 */
export class SignalRouter {
  signals: Signal[] = [];
  private lastSpawnAt: number = 0;
  private modeStartedAt: number = 0;
  private currentMode: SystemMode = "idle";

  /**
   * Advance time by dt seconds. Returns the live signal list (mutated in place
   * for performance — caller should not retain prior arrays).
   */
  tick(now: number, dt: number, mode: SystemMode, options: RouterOptions): Signal[] {
    if (mode !== this.currentMode) {
      this.currentMode = mode;
      this.modeStartedAt = now;
    }

    // 1. Advance progress on every signal
    for (const s of this.signals) {
      s.progress += s.speed * dt;
    }

    // 2. Drop completed signals
    this.signals = this.signals.filter((s) => s.progress < 1);

    // 3. Spawn new signals based on mode
    const spawnRate = SPAWN_RATE_PER_S[mode] * (options.intensity ?? 1);
    const expected = spawnRate * dt;
    let toSpawn = Math.floor(expected);
    if (Math.random() < expected - toSpawn) toSpawn += 1;

    for (let i = 0; i < toSpawn; i++) {
      const sig = this.spawnForMode(mode, now, options);
      if (sig) this.signals.push(sig);
    }

    // Cap signal count to prevent runaway growth
    if (this.signals.length > MAX_SIGNALS) {
      this.signals = this.signals.slice(this.signals.length - MAX_SIGNALS);
    }

    return this.signals;
  }

  /** Manually inject a signal (used by demo controller for scripted moments) */
  inject(partial: Omit<Signal, "id" | "progress" | "createdAt">): Signal {
    const sig: Signal = {
      id: nextId(),
      progress: 0,
      createdAt: performance.now(),
      ...partial,
    };
    this.signals.push(sig);
    return sig;
  }

  /** Reset the queue (e.g. when switching modes abruptly) */
  reset() {
    this.signals = [];
  }

  // ─── Spawn rules ─────────────────────────────────────────────────────────

  private spawnForMode(mode: SystemMode, now: number, opts: RouterOptions): Signal | null {
    switch (mode) {
      case "idle":
        return this.spawnIdle(now, opts);
      case "listening":
        return this.spawnListening(now, opts);
      case "thinking":
        return this.spawnThinking(now, opts);
      case "speaking":
        return this.spawnSpeaking(now, opts);
      case "recommendation":
        return this.spawnRecommendation(now, opts);
      default:
        return null;
    }
  }

  private spawnIdle(now: number, opts: RouterOptions): Signal {
    // Rare ambient ping from a random module → core
    const module = this.pickRandomModule(["sleep", "recovery", "metabolic", "labs"]);
    return {
      id: nextId(),
      from: module,
      to: "core",
      progress: 0,
      intensity: 0.4,
      color: "aqua",
      createdAt: now,
      speed: 0.5,
    };
  }

  private spawnListening(now: number, opts: RouterOptions): Signal {
    // 60% voice → core, 40% biometric → core
    if (Math.random() < 0.6) {
      return {
        id: nextId(),
        from: "voice",
        to: "core",
        progress: 0,
        intensity: 0.85,
        color: "white",
        createdAt: now,
        speed: 0.9,
      };
    }
    const module = this.pickActiveOrAny(opts, ["sleep", "recovery", "stress"]);
    return {
      id: nextId(),
      from: module,
      to: "core",
      progress: 0,
      intensity: 0.6,
      color: this.colorFor(module, opts),
      createdAt: now,
      speed: 0.7,
    };
  }

  private spawnThinking(now: number, opts: RouterOptions): Signal {
    // Cross-module routing — module → core, core → another module, alternating.
    // Pick a source module (active + biased toward priority status)
    const source = this.pickActiveOrAny(opts);
    const direction = Math.random() < 0.55;
    if (direction) {
      // Module → core
      return {
        id: nextId(),
        from: source,
        to: "core",
        progress: 0,
        intensity: 0.7 + Math.random() * 0.2,
        color: this.colorFor(source, opts),
        createdAt: now,
        speed: 1.0,
      };
    }
    // Core → another active module (interpretation moving outward briefly)
    const target = this.pickActiveOrAny(opts);
    return {
      id: nextId(),
      from: "core",
      to: target,
      progress: 0,
      intensity: 0.65,
      color: "aqua",
      createdAt: now,
      speed: 0.95,
    };
  }

  private spawnSpeaking(now: number, opts: RouterOptions): Signal {
    // Core → active modules in a wavelike sequence. Biased toward stack at the tail.
    const target = this.pickActiveOrAny(opts);
    const isStackEnd = target === "stack" && Math.random() < 0.4;
    return {
      id: nextId(),
      from: "core",
      to: target,
      progress: 0,
      intensity: isStackEnd ? 0.95 : 0.75,
      color: isStackEnd ? "white" : "aqua",
      createdAt: now,
      speed: 0.85,
    };
  }

  private spawnRecommendation(now: number, opts: RouterOptions): Signal {
    // Heavy: core → stack with white emphasis pulses
    return {
      id: nextId(),
      from: "core",
      to: "stack",
      progress: 0,
      intensity: 0.95,
      color: Math.random() < 0.5 ? "white" : "aqua",
      createdAt: now,
      speed: 0.9,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private pickRandomModule(pool: DataModuleType[]): DataModuleType {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pickActiveOrAny(
    opts: RouterOptions,
    fallback?: DataModuleType[],
  ): DataModuleType {
    if (opts.activeModules.length > 0) {
      return opts.activeModules[Math.floor(Math.random() * opts.activeModules.length)];
    }
    const all: DataModuleType[] = fallback ?? [
      "sleep", "recovery", "stress", "performance", "metabolic", "labs", "stack",
    ];
    return all[Math.floor(Math.random() * all.length)];
  }

  /** Color a signal based on the source module's status. Priority → red. */
  private colorFor(module: DataModuleType, opts: RouterOptions): SignalColor {
    const status = opts.moduleStatus?.[module];
    if (status === "priority") return Math.random() < 0.65 ? "red" : "aqua";
    if (status === "watch") return Math.random() < 0.18 ? "white" : "aqua";
    return "aqua";
  }
}

// ─── Mode parameters ───────────────────────────────────────────────────────

const SPAWN_RATE_PER_S: Record<SystemMode, number> = {
  idle: 0.6,
  listening: 4.5,
  thinking: 7.0,
  speaking: 5.5,
  recommendation: 8.0,
};

const MAX_SIGNALS = 60;

// ─── Stateless utility ─────────────────────────────────────────────────────

/**
 * Linear interpolation along a quadratic Bezier from `from` to `to` with a
 * curvature kick toward the center. Used by DataStreams to position signal
 * dots without per-frame allocation.
 */
export function bezierPoint(
  from: [number, number, number],
  to: [number, number, number],
  t: number,
  curveBias = 0.18,
): [number, number, number] {
  // Control point: midpoint pulled slightly toward origin (the core),
  // creating a gentle inward curve.
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const cx = mx * (1 - curveBias);
  const cy = my * (1 - curveBias);
  const cz = 0;

  const u = 1 - t;
  const x = u * u * from[0] + 2 * u * t * cx + t * t * to[0];
  const y = u * u * from[1] + 2 * u * t * cy + t * t * to[1];
  const z = u * u * from[2] + 2 * u * t * cz + t * t * to[2];
  return [x, y, z];
}
