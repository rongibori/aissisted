"use client";

/**
 * NeuralSystem — the only thing on screen.
 *
 * Tuned 2026-05-05 (round 2) for "inevitable and calm":
 *
 *  - Perception over reaction. Modules warm via SEMANTIC NEIGHBOR COUPLING:
 *    when a primary module activates, its conceptual neighbors receive a
 *    quiet boost. Investor says "recovery" → recovery climbs, but sleep,
 *    stress, performance also begin warming. The system reads as predictive.
 *  - No peaks. No spikes. Every transition is a slow arrival, never an
 *    arrival-and-decay. Easing curves favor symmetric ease-in-out.
 *  - Tightened contrast. Inactive 0.12 (not invisible). Active 0.74 (not
 *    glaring). Range collapsed; cohesion lifted.
 *  - Core is grounded. Scale deltas ≤0.8%. Internal motion (breathing,
 *    density) carries state. The orbit responds; the core IS.
 *  - Signals fade through opacity, never unmount. Interruption settles
 *    into listening; nothing snaps.
 *  - Removed decorative pulses. Every animation maps to attention,
 *    confidence, or transition. Nothing exists just to look alive.
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

// ─── Semantic neighbor coupling ─────────────────────────────────────────
//
// When one module's confidence rises, its conceptual neighbors receive a
// quiet share. The effect on screen: when Jeffrey says "recovery", sleep
// and stress and performance also begin warming a moment later, before he
// names them. The system reads as anticipating, not reacting.
//
// Tuned conservatively — the secondary warming is meant to be felt, not seen.

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

/** Coupling strength applied to neighbor confidence before max-merging. */
const COUPLING_STRENGTH = 0.42;

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

/**
 * Smooth visibility curve. pow(c, 0.55) lifts low confidences faster than
 * linear so warming reads as intentional, while higher confidences arrive
 * gradually instead of saturating quickly.
 */
function visibility(conf: number): number {
  if (conf <= 0) return 0;
  return Math.pow(Math.min(1, conf), 0.55);
}

// ─── Component ────────────────────────────────────────────────────────────

export function NeuralSystem({ connected }: Props) {
  const mode = useOrchestratorMode();
  const primary = usePrimaryFocus();
  const rawConfidence = useAllTopicConfidence();

  // Compute perceived confidence per module (raw + neighbor coupling).
  // Memoized only weakly — values change every state tick but allocation is
  // tiny.
  const perceived = useMemo(() => {
    const out = {} as Record<ModuleId, number>;
    for (const id of MODULE_IDS) out[id] = perceivedConfidence(id, rawConfidence);
    return out;
  }, [rawConfidence]);

  // viewBox is 600×600 centered at origin.
  const VB = 600;
  const HALF = VB / 2;
  const ORBIT_RADIUS = 210;
  const CORE_RADIUS = 56;

  const nodes = useMemo(() => nodesAtRadius(ORBIT_RADIUS), []);

  // Core scale — almost imperceptible. The core is NOT what reacts.
  const coreScale =
    mode === "speaking"
      ? 1.008
      : mode === "listening"
        ? 1.005
        : mode === "recommendation"
          ? 1.012
          : 1.0;

  // Core inner-ring breathing amplitude varies with mode. The TEMPO is
  // constant (calm always); only the depth of the breath shifts.
  const breatheAmplitude =
    mode === "speaking"
      ? 1.045
      : mode === "listening"
        ? 1.03
        : mode === "thinking" || mode === "analyzing"
          ? 1.028
          : 1.022;

  // Halo opacity — outer presence carries the state, not the core.
  const haloOpacity =
    mode === "speaking"
      ? 0.36
      : mode === "listening"
        ? 0.24
        : mode === "thinking" || mode === "analyzing"
          ? 0.18
          : 0.08;

  // Pre-computed primary geometry.
  const primaryAngle = primary != null ? MODULE_ANGLES_DEG[primary] : null;
  const primaryRad = primaryAngle != null ? (primaryAngle * Math.PI) / 180 : 0;
  const primaryX =
    primaryAngle != null ? Math.cos(primaryRad) * ORBIT_RADIUS : 0;
  const primaryY =
    primaryAngle != null ? -Math.sin(primaryRad) * ORBIT_RADIUS : 0;

  // Mode-derived opacities for signals — drives the FADE rather than
  // mounting/unmounting elements.
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
        opacity: connected ? 1 : 0.96,
        transition: "opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
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
            <stop offset="0%" stopColor="#00C2D1" stopOpacity="0.30" />
            <stop offset="60%" stopColor="#00C2D1" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#00C2D1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rec-flash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EE2B37" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#EE2B37" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#EE2B37" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
            <stop offset="55%" stopColor="#00C2D1" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#0B1D3A" stopOpacity="0.72" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Halo — soft outer aqua presence. Mode-driven opacity, slow xfade. */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS + 60}
          fill="url(#halo-grad)"
          opacity={haloOpacity}
          style={{
            transition: "opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Recommendation bloom — slow arrive, slow leave, no peak event */}
        {mode === "recommendation" && (
          <circle
            cx="0"
            cy="0"
            r={ORBIT_RADIUS + 80}
            fill="url(#rec-flash)"
            style={{
              animation: "aissisted-rec-bloom 1800ms ease-in-out forwards",
            }}
          />
        )}

        {/* Outer ring — extremely slow rotation. Almost still. The system
            is alive but in no hurry. */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(28,28,30,0.085)"
          strokeWidth="1"
          strokeDasharray="2 14"
          style={{
            transformOrigin: "center",
            animation: "aissisted-rotate-slow 180s linear infinite",
          }}
        />

        {/* Speaking signals: outward strokes from core to active modules.
            Always rendered; opacity is the only mode gate so transitions
            fade rather than mount/unmount. Width + opacity scale with
            perceived confidence so secondary actives are visibly less
            than primary without using a different color. */}
        <g
          style={{
            opacity: speakingSignalsOpacity,
            transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {nodes.map((n) => {
            const conf = perceived[n.id];
            const v = visibility(conf);
            // Don't bother stroking truly cold modules even in speaking mode
            // — keeps the screen quiet.
            if (v < 0.18) return null;
            return (
              <line
                key={`signal-${n.id}`}
                x1="0"
                y1="0"
                x2={n.x}
                y2={n.y}
                stroke="#00C2D1"
                strokeWidth={0.7 + v * 0.9}
                strokeOpacity={0.10 + v * 0.24}
                strokeLinecap="round"
                style={{
                  transition:
                    "stroke-opacity 1000ms cubic-bezier(0.4, 0, 0.2, 1), stroke-width 1000ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            );
          })}
        </g>

        {/* Listening signal — opacity-faded line from primary focus to core.
            No animation; the line itself carries the state. */}
        {primary != null && (
          <line
            x1="0"
            y1="0"
            x2={primaryX}
            y2={primaryY}
            stroke="#00C2D1"
            strokeWidth="1"
            strokeOpacity={0.35}
            strokeLinecap="round"
            style={{
              opacity: listeningSignalOpacity,
              transition:
                "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1), stroke-opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}

        {/* Module nodes — opacity + radius are smooth functions of perceived
            confidence (which already includes neighbor coupling). No binary
            active state. Primary focus dominates by size + a soft outer ring,
            not by color. */}
        {nodes.map((n) => {
          const conf = perceived[n.id];
          const v = visibility(conf);
          const isPrimary = n.id === primary && conf >= 0.32;

          // Tightened range: 0.12 floor (still present at rest) → 0.74 ceiling
          // (active but not glaring). Less separation = more cohesion.
          const opacity = 0.12 + v * 0.62;

          // Radius eases gently. 4 → 6.5 → 7.2 (primary). Restrained.
          const r = 4 + v * 2.5 + (isPrimary ? 0.7 : 0);

          // Glow opacity threshold raised so glow is rare; when it appears,
          // it's earned. No animation — just steady scaled glow.
          const glowOpacity = v > 0.42 ? (v - 0.42) * 0.34 : 0;

          // Primary ring is steady (no pulse). Earned attention, not
          // demanded.
          const primaryRingOpacity = isPrimary ? 0.32 + v * 0.18 : 0;

          return (
            <g key={n.id}>
              {/* Soft glow — steady, only present when warm. */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 5}
                fill="#00C2D1"
                opacity={glowOpacity}
                style={{
                  transition:
                    "opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1), r 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* Primary-focus outer ring — steady, no pulse. Visible only on
                  the single most-confident module above threshold. */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 3.2}
                fill="none"
                stroke="#00C2D1"
                strokeWidth="0.7"
                strokeOpacity={primaryRingOpacity}
                style={{
                  transition:
                    "stroke-opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1), r 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* Graphite base — fades down as confidence rises. */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#1C1C1E"
                opacity={opacity * (1 - v * 0.78)}
                style={{
                  transition:
                    "r 1100ms cubic-bezier(0.4, 0, 0.2, 1), opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              {/* Aqua overlay — fades in as confidence rises, capped lower
                  than before so active modules feel calm. */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#00C2D1"
                opacity={v * 0.74}
                style={{
                  transition:
                    "r 1100ms cubic-bezier(0.4, 0, 0.2, 1), opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </g>
          );
        })}

        {/* Core — grounded. Internal density shifts with state; outer scale
            barely moves. The breath amplitude (the size of the inhale) is
            what carries listening/speaking, not the absolute size. */}
        <g
          style={{
            transform: `scale(${coreScale})`,
            transformOrigin: "center",
            transition: "transform 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Outer soft glow — restrained */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS + 8}
            fill="url(#core-grad)"
            opacity={0.52}
            filter="url(#soft-glow)"
            style={{
              transition: "opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Main core disk — pure white, faint stroke */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS}
            fill="#FFFFFF"
            stroke="rgba(28,28,30,0.12)"
            strokeWidth="1"
          />
          {/* Inner aqua ring — single tempo (8s), amplitude varies by mode.
              The breath is the signal, not the speed. */}
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
              strokeOpacity={mode === "idle" ? 0.28 : 0.5}
              style={{
                transition:
                  "stroke-opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </g>
          {/* Center seed — midnight always. The constant. */}
          <circle cx="0" cy="0" r="5" fill="#0B1D3A" opacity={0.74} />
        </g>
      </svg>

      {/* Keyframes — kept minimal. Only the breath, the slow rotation, and
          the recommendation bloom remain as kinetic motion. Everything else
          is driven by CSS transitions on data-bound properties, so the
          system "settles" into states rather than animating into them. */}
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
          0%   { opacity: 0; transform: scale(0.94); }
          40%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.04); }
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
