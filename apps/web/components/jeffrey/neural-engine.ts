/**
 * Jeffrey Neural Indicator — animation engine
 *
 * Pure logic. No React, no DOM. Returns the model state on each tick.
 * The renderer (NeuralVoiceIndicator.tsx or the vanilla HTML version) is
 * responsible for translating model state into SVG attributes.
 *
 * Aligned with: docs/specs/JEFFREY_NEURAL_INDICATOR_SPEC.md
 */

export type NeuralState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export interface NeuralStateProfile {
  /** Signals spawned per second across the whole network. */
  spawnRate: number;
  /** Baseline node activation everyone decays toward (0–1). */
  baselineActivation: number;
  /** Maximum drift amplitude in normalized coords (0..1 viewBox). */
  driftAmp: number;
  /** Cluster scale factor target. */
  scale: number;
  /** Probability a spawned signal is a red accent. */
  redAccentProb: number;
  /** If > 0, sync-burst from center every N ms (speaking state only). */
  burstIntervalMs: number;
}

export const STATE_PROFILES: Record<NeuralState, NeuralStateProfile> = {
  idle:        { spawnRate: 0.4,  baselineActivation: 0.20, driftAmp: 0.020, scale: 1.00, redAccentProb: 0.00, burstIntervalMs: 0    },
  listening:   { spawnRate: 2.0,  baselineActivation: 0.40, driftAmp: 0.028, scale: 1.04, redAccentProb: 0.00, burstIntervalMs: 0    },
  processing:  { spawnRate: 5.0,  baselineActivation: 0.60, driftAmp: 0.018, scale: 0.96, redAccentProb: 0.08, burstIntervalMs: 0    },
  speaking:    { spawnRate: 3.0,  baselineActivation: 0.50, driftAmp: 0.022, scale: 1.02, redAccentProb: 0.00, burstIntervalMs: 666  },
  error:       { spawnRate: 0.0,  baselineActivation: 0.15, driftAmp: 0.000, scale: 1.00, redAccentProb: 0.00, burstIntervalMs: 0    },
};

export interface NeuralNode {
  id: number;
  x: number; y: number;          // base position in 0..1
  driftSeed: number;             // phase offset for organic drift
  activation: number;            // 0..1 (smoothly decays)
  lastFiredAt: number;           // ms timestamp for biased spawning
  isCenter: boolean;
}

export interface NeuralEdge {
  from: number;
  to: number;
  signals: NeuralSignal[];
}

export interface NeuralSignal {
  /** Progress along edge, 0 (from) → 1 (to) */
  progress: number;
  /** Speed in fraction-per-second */
  speed: number;
  /** True for red accent signals. */
  red: boolean;
}

export interface NeuralModel {
  nodes: NeuralNode[];
  edges: NeuralEdge[];
  /** Smoothly interpolated current scale (separate from target) */
  scale: number;
  /** Smoothly interpolated drift amplitude */
  driftAmp: number;
  /** Smoothly interpolated baseline activation */
  baseline: number;
  /** Last burst time (speaking state) */
  lastBurstAt: number;
  /** ms timestamp of last update */
  lastTickAt: number;
}

// ─── Topology generator ────────────────────────────────────────────────────

/**
 * Deterministic 9-node brain cluster: 1 center + 4 inner ring + 4 outer ring,
 * with the outer ring slightly rotated for asymmetry. Edges connect each node
 * to its 2–3 nearest neighbors.
 */
export function buildTopology(seed = 1): { nodes: NeuralNode[]; edges: NeuralEdge[] } {
  const rand = mulberry32(seed);
  const nodes: NeuralNode[] = [];

  // Center node
  nodes.push({
    id: 0,
    x: 0.5, y: 0.5,
    driftSeed: rand(),
    activation: 0,
    lastFiredAt: 0,
    isCenter: true,
  });

  // Inner ring — radius 0.18, 4 nodes
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + rand() * 0.3;
    nodes.push({
      id: 1 + i,
      x: 0.5 + Math.cos(angle) * 0.18,
      y: 0.5 + Math.sin(angle) * 0.18,
      driftSeed: rand(),
      activation: 0,
      lastFiredAt: 0,
      isCenter: false,
    });
  }

  // Outer ring — radius 0.36, 4 nodes, rotated by 45°
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4 + rand() * 0.2;
    nodes.push({
      id: 5 + i,
      x: 0.5 + Math.cos(angle) * 0.36,
      y: 0.5 + Math.sin(angle) * 0.36,
      driftSeed: rand(),
      activation: 0,
      lastFiredAt: 0,
      isCenter: false,
    });
  }

  // Edges:
  //   - center → each inner-ring node (4 edges)
  //   - inner-ring neighbors loop (4 edges)
  //   - each outer-ring node → 2 inner-ring nodes (8 edges) — note the deliberate
  //     "k-nearest" assignment; not all combinations
  //   - outer-ring chord: 2 sparse long-range connections (2 edges)
  const edges: NeuralEdge[] = [];
  const addEdge = (from: number, to: number) => {
    edges.push({ from, to, signals: [] });
  };

  // Center → inner ring
  for (let i = 1; i <= 4; i++) addEdge(0, i);

  // Inner ring loop
  for (let i = 0; i < 4; i++) addEdge(1 + i, 1 + ((i + 1) % 4));

  // Outer ring → inner ring (each outer connects to its two nearest inners)
  for (let outer = 5; outer <= 8; outer++) {
    const distances = [1, 2, 3, 4]
      .map((inner) => ({ inner, d: dist(nodes[outer], nodes[inner]) }))
      .sort((a, b) => a.d - b.d);
    addEdge(outer, distances[0].inner);
    addEdge(outer, distances[1].inner);
  }

  // Outer ring sparse chords (2 long-range connections)
  addEdge(5, 7);
  addEdge(6, 8);

  return { nodes, edges };
}

function dist(a: NeuralNode, b: NeuralNode): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Engine: per-tick update ───────────────────────────────────────────────

const ACTIVATION_DECAY_TAU_MS = 600; // exponential decay time constant
const STATE_LERP_TAU_MS = 320;       // smoothing time constant for state changes
const SCALE_LERP_TAU_MS = 400;
const SIGNAL_SPEED_PER_S = 2.8;      // fraction-per-second along an edge

export function createModel(seed = 1): NeuralModel {
  const { nodes, edges } = buildTopology(seed);
  const idle = STATE_PROFILES.idle;
  return {
    nodes,
    edges,
    scale: idle.scale,
    driftAmp: idle.driftAmp,
    baseline: idle.baselineActivation,
    lastBurstAt: 0,
    lastTickAt: 0,
  };
}

/**
 * Advance the model. Returns the same model mutated in place for performance.
 * `now` is performance.now() in ms.
 */
export function tick(
  model: NeuralModel,
  state: NeuralState,
  intensity: number,
  now: number,
): NeuralModel {
  const dt = model.lastTickAt === 0 ? 16 : Math.min(64, now - model.lastTickAt);
  model.lastTickAt = now;

  const profile = STATE_PROFILES[state];

  // ── 1. Smoothly interpolate cluster-level params toward state targets
  const lerpA = 1 - Math.exp(-dt / STATE_LERP_TAU_MS);
  model.driftAmp += (profile.driftAmp - model.driftAmp) * lerpA;
  model.baseline += (profile.baselineActivation - model.baseline) * lerpA;

  const lerpS = 1 - Math.exp(-dt / SCALE_LERP_TAU_MS);
  model.scale += (profile.scale - model.scale) * lerpS;

  // ── 2. Decay node activations toward baseline
  const decay = Math.exp(-dt / ACTIVATION_DECAY_TAU_MS);
  for (const n of model.nodes) {
    const target = model.baseline;
    n.activation = target + (n.activation - target) * decay;
    if (n.activation > 1) n.activation = 1;
    if (n.activation < 0) n.activation = 0;
  }

  // ── 3. Advance signals along edges
  for (const e of model.edges) {
    if (e.signals.length === 0) continue;
    for (const s of e.signals) {
      s.progress += s.speed * (dt / 1000);
    }
    // Fire destination nodes for any completed signals; drop them
    e.signals = e.signals.filter((s) => {
      if (s.progress >= 1) {
        const dest = model.nodes[e.to];
        dest.activation = 1;
        dest.lastFiredAt = now;
        return false;
      }
      return true;
    });
  }

  // ── 4. Spawn new signals
  const spawnExpected = profile.spawnRate * intensity * (dt / 1000);
  let toSpawn = Math.floor(spawnExpected);
  if (Math.random() < spawnExpected - toSpawn) toSpawn += 1;

  for (let i = 0; i < toSpawn; i++) {
    const edge = pickEdgeWeighted(model);
    if (!edge) break;
    edge.signals.push({
      progress: 0,
      speed: SIGNAL_SPEED_PER_S * (0.85 + Math.random() * 0.3),
      red: Math.random() < profile.redAccentProb,
    });
  }

  // ── 5. Speaking state — synchronized burst from center
  if (profile.burstIntervalMs > 0 && now - model.lastBurstAt > profile.burstIntervalMs) {
    model.lastBurstAt = now;
    // Fire all edges incident to center node
    for (const e of model.edges) {
      if (e.from === 0 || e.to === 0) {
        e.signals.push({
          progress: 0,
          speed: SIGNAL_SPEED_PER_S * 1.3,
          red: false,
        });
      }
    }
    model.nodes[0].activation = 1;
    model.nodes[0].lastFiredAt = now;
  }

  return model;
}

/**
 * Bias spawning toward edges incident on recently-fired nodes — produces
 * propagating cascades rather than scattered noise.
 */
function pickEdgeWeighted(model: NeuralModel): NeuralEdge | null {
  if (model.edges.length === 0) return null;
  const weights: number[] = [];
  let total = 0;
  for (const e of model.edges) {
    const fromAct = model.nodes[e.from].activation;
    const w = 0.2 + fromAct * 1.5; // edges from active nodes are more likely to fire
    weights.push(w);
    total += w;
  }
  let r = Math.random() * total;
  for (let i = 0; i < model.edges.length; i++) {
    r -= weights[i];
    if (r <= 0) return model.edges[i];
  }
  return model.edges[model.edges.length - 1];
}

/**
 * Get the displayed (drifted) position of a node at time `now`.
 * Drift amplitude is smoothed via model.driftAmp.
 */
export function nodeDisplayPos(
  node: NeuralNode,
  driftAmp: number,
  now: number,
): { x: number; y: number } {
  if (driftAmp < 1e-4) return { x: node.x, y: node.y };
  const t = now;
  const dx = Math.sin(t * 0.0006 + node.driftSeed * 6.2832) * driftAmp;
  const dy = Math.cos(t * 0.0008 + node.driftSeed * 4.7124) * driftAmp;
  return { x: node.x + dx, y: node.y + dy };
}
