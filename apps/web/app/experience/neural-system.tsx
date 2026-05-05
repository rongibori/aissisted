"use client";

/**
 * NeuralSystem — the only thing on screen.
 *
 * Final pass — the version I would ship.
 *
 * The standard for this pass: a first-time user must NOT perceive modules
 * turning on, a system reacting, or anything being triggered. They should
 * feel that the system is already oriented; understanding is emerging, not
 * switching; nothing competes for attention; nothing explains itself.
 *
 * Decisions made (no options exposed, no knobs to twist):
 *
 *  - Module dynamic range collapsed to 0.18 → 0.62 (was 0.12 → 0.74). The
 *    difference between dormant and active is now small enough that the
 *    eye cannot track an off→on transition. It can only feel a SHIFT in
 *    where the warmth lives.
 *
 *  - Per-module clock — each module gets a stable 1500–1850ms transition
 *    duration (hand-picked, not random). They never lock-step. When the
 *    classifier fires for multiple modules simultaneously, they arrive at
 *    slightly different rates. Decouples visual from speech timing.
 *
 *  - Core scale FROZEN at 1.0 across every mode. Internal motion (breath
 *    amplitude, ring stroke opacity) carries state. The core never grows
 *    or shrinks. It exists.
 *
 *  - Halo opacity range tightened (0.07 idle → 0.30 speaking). Less mode
 *    contrast — the system is one continuous presence, not five poses.
 *
 *  - Breath amplitude range tightened (1.020 idle → 1.035 speaking).
 *    Always a calm pace. The depth shifts; the rhythm doesn't.
 *
 *  - Recommendation bloom 1800 → 2400ms with gentler curve. Even rare
 *    moments arrive instead of land.
 *
 *  - Primary focus ring upper bound dropped (0.50 → 0.40). It is
 *    noticeable, never loud.
 *
 *  - All keyframe pulses removed. Three keyframes remain: outer rotation
 *    (180s, ambient — below conscious motion threshold), core breath (8s,
 *    proof of life), recommendation bloom (rare event).
 */

import { useMemo } from "react";
import {
  MODULE_IDS,
  useOrchestratorMode,
  usePrimaryFocus,
  useAllTopicConfidence,
  type ModuleId,
} from "@aissisted/orchestrator";

interface Props {
  connected: boolean;
}

// ─── Geometry — mirrors JeffreyAISystem.modulePosition() angles ─────────

const MODULE_ANGLES_DEG: Record<ModuleId, number> = {
  sleep: 90,
  recovery: 38,
  performance: -10,
  stack: -60,
  stress: -125,
  metabolic: 170,
  labs: 128,
};

interface NodePos {
  id: ModuleId;
  x: number;
  y: number;
}

function nodesAtRadius(r: number): NodePos[] {
  return MODULE_IDS.map((id) => {
    const rad = (MODULE_ANGLES_DEG[id] * Math.PI) / 180;
    return {
      id,
      x: Math.cos(rad) * r,
      y: -Math.sin(rad) * r,
    };
  });
}

// ─── Per-module clock — each module has its own slightly-different
// transition tempo so they never lock-step. Hand-picked, not random,
// so the values are stable across runs and easy to reason about. ────────

const MODULE_TRANSITION_MS: Record<ModuleId, number> = {
  sleep: 1600,
  recovery: 1750,
  stress: 1500,
  performance: 1850,
  metabolic: 1620,
  labs: 1700,
  stack: 1550,
};

// ─── Semantic neighbor coupling ─────────────────────────────────────────

type NeighborWeight = [ModuleId, number];

const NEIGHBORS: Record<ModuleId, NeighborWeight[]> = {
  sleep: [
    ["recovery", 0.55],
    ["stress", 0.4],
  ],
  recovery: [
    ["sleep", 0.55],
    ["stress", 0.4],
    ["performance", 0.45],
  ],
  stress: [
    ["recovery", 0.4],
    ["sleep", 0.4],
    ["performance", 0.3],
  ],
  performance: [
    ["recovery", 0.45],
    ["stress", 0.3],
    ["stack", 0.32],
  ],
  metabolic: [
    ["labs", 0.6],
    ["stack", 0.32],
  ],
  labs: [
    ["metabolic", 0.6],
    ["stack", 0.28],
  ],
  stack: [
    ["performance", 0.32],
    ["metabolic", 0.32],
    ["labs", 0.28],
  ],
};

const COUPLING_STRENGTH = 0.45;

function perceivedConfidence(
  id: ModuleId,
  raw: Record<ModuleId, number>,
): number {
  const direct = raw[id] ?? 0;
  let bestNeighbor = 0;
  for (const [neighborId, weight] of NEIGHBORS[id]) {
    const lifted = (raw[neighborId] ?? 0) * weight * COUPLING_STRENGTH;
    if (lifted > bestNeighbor) bestNeighbor = lifted;
  }
  return Math.min(1, Math.max(direct, bestNeighbor));
}

// ─── Confidence → visual mapping ────────────────────────────────────────

function visibility(conf: number): number {
  if (conf <= 0) return 0;
  return Math.pow(Math.min(1, conf), 0.55);
}

// ─── Component ────────────────────────────────────────────────────────────

export function NeuralSystem({ connected }: Props) {
  const mode = useOrchestratorMode();
  const primary = usePrimaryFocus();
  const rawConfidence = useAllTopicConfidence();

  const perceived = useMemo(() => {
    const out = {} as Record<ModuleId, number>;
    for (const id of MODULE_IDS) out[id] = perceivedConfidence(id, rawConfidence);
    return out;
  }, [rawConfidence]);

  const VB = 600;
  const HALF = VB / 2;
  const ORBIT_RADIUS = 210;
  const CORE_RADIUS = 56;

  const nodes = useMemo(() => nodesAtRadius(ORBIT_RADIUS), []);

  // Core is FROZEN at scale 1. Mode lives in internal motion only.
  const coreScale = 1.0;

  // Breath amplitude — tightened to 1.020-1.035. Always calm pace; the
  // depth of the inhale shifts with mode, not the rhythm.
  const breatheAmplitude =
    mode === "speaking"
      ? 1.035
      : mode === "listening"
        ? 1.028
        : mode === "thinking" || mode === "analyzing"
          ? 1.025
          : 1.02;

  // Halo opacity — tightened range. Less contrast between modes; the
  // system is one continuous presence, not a state machine displaying
  // different costumes.
  const haloOpacity =
    mode === "speaking"
      ? 0.30
      : mode === "listening"
        ? 0.20
        : mode === "thinking" || mode === "analyzing"
          ? 0.16
          : 0.07;

  // Inner ring stroke opacity — also tighter range.
  const innerRingOpacity = mode === "idle" ? 0.32 : 0.42;

  // Pre-computed primary geometry.
  const primaryAngle = primary != null ? MODULE_ANGLES_DEG[primary] : null;
  const primaryRad = primaryAngle != null ? (primaryAngle * Math.PI) / 180 : 0;
  const primaryX =
    primaryAngle != null ? Math.cos(primaryRad) * ORBIT_RADIUS : 0;
  const primaryY =
    primaryAngle != null ? -Math.sin(primaryRad) * ORBIT_RADIUS : 0;

  const speakingSignalsOpacity = mode === "speaking" ? 1 : 0;
  const listeningSignalOpacity = mode === "listening" && primary != null ? 1 : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: connected ? 1 : 0.97,
        transition: "opacity 1600ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <svg
        viewBox={`-${HALF} -${HALF} ${VB} ${VB}`}
        style={{
          width: "min(94vw, 94vh)",
          height: "min(94vw, 94vh)",
          maxWidth: 720,
          maxHeight: 720,
        }}
        aria-hidden
      >
        <defs>
          <radialGradient id="halo-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00C2D1" stopOpacity="0.26" />
            <stop offset="60%" stopColor="#00C2D1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#00C2D1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rec-flash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EE2B37" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#EE2B37" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#EE2B37" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="55%" stopColor="#00C2D1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0B1D3A" stopOpacity="0.68" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Halo — single continuous presence, mode shifts the depth */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS + 60}
          fill="url(#halo-grad)"
          opacity={haloOpacity}
          style={{
            transition: "opacity 1800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Recommendation bloom — slowed further; arrives, never strikes */}
        {mode === "recommendation" && (
          <circle
            cx="0"
            cy="0"
            r={ORBIT_RADIUS + 80}
            fill="url(#rec-flash)"
            style={{
              animation: "aissisted-rec-bloom 2400ms ease-in-out forwards",
            }}
          />
        )}

        {/* Outer ring — 180s rotation, below conscious-motion threshold.
            The only proof, when nothing is being said, that the system is
            present. Pulled to graphite at 7% so it never reads as a UI
            chrome element. */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(28,28,30,0.07)"
          strokeWidth="1"
          strokeDasharray="2 14"
          style={{
            transformOrigin: "center",
            animation: "aissisted-rotate-slow 180s linear infinite",
          }}
        />

        {/* Speaking signals — always rendered; opacity gates mode. The
            per-module transition duration varies (1500-1850ms) so the lines
            appear and recede at slightly different rates. The eye cannot
            grab a single moment of "they all turned on." */}
        <g
          style={{
            opacity: speakingSignalsOpacity,
            transition: "opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {nodes.map((n) => {
            const conf = perceived[n.id];
            const v = visibility(conf);
            if (v < 0.20) return null;
            const ms = MODULE_TRANSITION_MS[n.id];
            return (
              <line
                key={`signal-${n.id}`}
                x1="0"
                y1="0"
                x2={n.x}
                y2={n.y}
                stroke="#00C2D1"
                strokeWidth={0.7 + v * 0.7}
                strokeOpacity={0.08 + v * 0.18}
                strokeLinecap="round"
                style={{
                  transition: `stroke-opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1), stroke-width ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                }}
              />
            );
          })}
        </g>

        {/* Listening signal — opacity-gated, no animation */}
        {primary != null && (
          <line
            x1="0"
            y1="0"
            x2={primaryX}
            y2={primaryY}
            stroke="#00C2D1"
            strokeWidth="1"
            strokeOpacity={0.25}
            strokeLinecap="round"
            style={{
              opacity: listeningSignalOpacity,
              transition:
                "opacity 1300ms cubic-bezier(0.4, 0, 0.2, 1), stroke-opacity 1300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}

        {/* Module nodes — collapsed dynamic range. Floor 0.18 (clearly
            present at rest), peak 0.62 (active but never glaring). The
            eye cannot track an off→on transition; it can only feel a
            shift in where warmth lives. Each module has its own slightly-
            different transition duration so they never lock-step. */}
        {nodes.map((n) => {
          const conf = perceived[n.id];
          const v = visibility(conf);
          const isPrimary = n.id === primary && conf >= 0.32;
          const ms = MODULE_TRANSITION_MS[n.id];

          // Tightened: 0.18 floor → 0.62 peak (was 0.12 → 0.74).
          const opacity = 0.18 + v * 0.44;

          // Radius eases; primary gets a small lift.
          const r = 4 + v * 2.2 + (isPrimary ? 0.6 : 0);

          // Glow only on genuinely warm modules.
          const glowOpacity = v > 0.45 ? (v - 0.45) * 0.28 : 0;

          // Primary ring — upper bound 0.40 (was 0.50). Noticed, never loud.
          const primaryRingOpacity = isPrimary ? 0.26 + v * 0.14 : 0;

          const transitionDecl = `r ${ms}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1), stroke-opacity ${ms}ms cubic-bezier(0.4, 0, 0.2, 1)`;

          return (
            <g key={n.id}>
              {/* Soft glow — steady, threshold-gated */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 5}
                fill="#00C2D1"
                opacity={glowOpacity}
                style={{ transition: transitionDecl }}
              />
              {/* Primary-focus outer ring — steady; only one node ever shows */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 3.2}
                fill="none"
                stroke="#00C2D1"
                strokeWidth="0.7"
                strokeOpacity={primaryRingOpacity}
                style={{ transition: transitionDecl }}
              />
              {/* Graphite base — fades down as confidence rises */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#1C1C1E"
                opacity={opacity * (1 - v * 0.78)}
                style={{ transition: transitionDecl }}
              />
              {/* Aqua overlay — fades in. Capped lower than before so the
                  active state never reads as glaring. */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#00C2D1"
                opacity={v * 0.62}
                style={{ transition: transitionDecl }}
              />
            </g>
          );
        })}

        {/* Core — frozen scale. Internal motion only. */}
        <g
          style={{
            transform: `scale(${coreScale})`,
            transformOrigin: "center",
          }}
        >
          {/* Outer soft glow — tighter opacity */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS + 8}
            fill="url(#core-grad)"
            opacity={0.46}
            filter="url(#soft-glow)"
            style={{
              transition: "opacity 1800ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Main core disk — pure white, faint stroke */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS}
            fill="#FFFFFF"
            stroke="rgba(28,28,30,0.10)"
            strokeWidth="1"
          />
          {/* Inner aqua ring — 8s breath always; amplitude carries mode */}
          <g
            style={
              {
                transformOrigin: "center",
                animation: "aissisted-core-breathe 8s ease-in-out infinite",
                ["--breathe-amp" as never]: breatheAmplitude.toString(),
              } as React.CSSProperties
            }
          >
            <circle
              cx="0"
              cy="0"
              r={CORE_RADIUS - 12}
              fill="none"
              stroke="#00C2D1"
              strokeWidth="1"
              strokeOpacity={innerRingOpacity}
              style={{
                transition:
                  "stroke-opacity 1800ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </g>
          {/* Center seed — midnight, the constant */}
          <circle cx="0" cy="0" r="5" fill="#0B1D3A" opacity={0.7} />
        </g>
      </svg>

      {/* Three keyframes. Each communicates. Outer rotation: ambient
          (system present, sub-conscious tempo). Core breath: proof of
          life. Recommendation bloom: rare event, slowest curve. */}
      <style>{`
        @keyframes aissisted-rotate-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aissisted-core-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(var(--breathe-amp, 1.025)); }
        }
        @keyframes aissisted-rec-bloom {
          0%   { opacity: 0; transform: scale(0.95); }
          45%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.03); }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: opacity 320ms linear !important;
          }
        }
      `}</style>
    </div>
  );
}
