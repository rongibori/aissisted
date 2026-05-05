"use client";

/**
 * NeuralSystem — the only thing on screen.
 *
 * Tuned 2026-05-05 for "calm, intelligent, responsive, controlled":
 *
 * - Module visibility is a SMOOTH FUNCTION of confidence — no binary
 *   active/inactive switch. Inactive → barely visible. Warming → gradually
 *   present. Active → restrained but clear. Primary focus dominates by
 *   SIZE and HALO, not by color.
 * - Red is reserved for the brief recommendation flash. Primary focus stays
 *   in the aqua family.
 * - Tempos are slowed down — outer ring 80s, inner 120s (50s on speaking),
 *   core breathing 1.8s/2.4s/5.5s, signal pulse 2s.
 * - Core scale deltas reduced (≤2.5%) so the system feels alive, not jumpy.
 * - Listening uses opacity pulse, not stroke-dasharray (cleaner).
 *
 * Bound entirely to orchestrator selectors. The only prop is `connected`,
 * which lets the parent fade the system in when the realtime session begins.
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
  sleep: 90, // top
  recovery: 38, // upper right
  performance: -10, // right
  stack: -60, // lower right
  stress: -125, // lower left
  metabolic: 170, // left
  labs: 128, // upper left
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
      y: -Math.sin(rad) * r, // SVG y grows down; flip for canonical math
    };
  });
}

// ─── Confidence → visual mapping helpers ────────────────────────────────

/**
 * Map raw confidence (0..1) to a smooth visibility curve. Power < 1 means
 * low confidences get a noticeable lift (warming feels intentional), high
 * confidences saturate (active modules don't feel hotter than they need to).
 */
function visibility(conf: number): number {
  if (conf <= 0) return 0;
  // pow 0.65 ≈ "gentle ease-out". Tuned by feel, not theory.
  return Math.pow(Math.min(1, conf), 0.65);
}

// ─── Component ────────────────────────────────────────────────────────────

export function NeuralSystem({ connected }: Props) {
  const mode = useOrchestratorMode();
  const primary = usePrimaryFocus();
  const confidence = useAllTopicConfidence();

  // viewBox is 600×600 centered at (0, 0).
  const VB = 600;
  const HALF = VB / 2;
  const ORBIT_RADIUS = 210;
  const CORE_RADIUS = 56;

  const nodes = useMemo(() => nodesAtRadius(ORBIT_RADIUS), []);

  // Mode → core scaling. Restrained — alive, not jumpy.
  const coreScale =
    mode === "speaking"
      ? 1.025
      : mode === "listening"
        ? 1.015
        : mode === "recommendation"
          ? 1.04
          : 1.0;

  // Mode → halo opacity. Always aqua except recommendation, which gets a
  // brief red bloom overlay (separate <circle/>).
  const haloOpacity =
    mode === "speaking"
      ? 0.42
      : mode === "listening"
        ? 0.30
        : mode === "thinking" || mode === "analyzing"
          ? 0.24
          : 0.10;

  // Core inner ring breathing tempo by mode. Slower = calmer.
  const coreBreatheSeconds =
    mode === "speaking"
      ? 1.9
      : mode === "listening"
        ? 2.4
        : mode === "thinking" || mode === "analyzing"
          ? 3.2
          : 5.5;

  // Inner ring rotation tempo — slower under calm modes.
  const innerRingSeconds = mode === "speaking" ? 50 : 120;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: connected ? 1 : 0.94,
        transition: "opacity 800ms cubic-bezier(0.2, 0, 0, 1)",
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
            <stop offset="0%" stopColor="#00C2D1" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#00C2D1" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#00C2D1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rec-flash" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EE2B37" stopOpacity="0.34" />
            <stop offset="60%" stopColor="#EE2B37" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#EE2B37" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#00C2D1" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#0B1D3A" stopOpacity="0.78" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Halo — soft outer aqua presence, mode-driven */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS + 60}
          fill="url(#halo-grad)"
          opacity={haloOpacity}
          style={{ transition: "opacity 720ms cubic-bezier(0.2, 0, 0, 1)" }}
        />

        {/* Recommendation flash — brief red bloom overlay, never persistent */}
        {mode === "recommendation" && (
          <circle
            cx="0"
            cy="0"
            r={ORBIT_RADIUS + 80}
            fill="url(#rec-flash)"
            style={{
              animation: "aissisted-rec-bloom 900ms ease-out forwards",
            }}
          />
        )}

        {/* Outer ring — slow rotation conveys "the system is alive" */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(28,28,30,0.10)"
          strokeWidth="1"
          strokeDasharray="2 10"
          style={{
            transformOrigin: "center",
            animation: "aissisted-rotate-slow 80s linear infinite",
          }}
        />

        {/* Inner ring — counter-rotates, accelerates only when speaking */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS - 36}
          fill="none"
          stroke="rgba(28,28,30,0.06)"
          strokeWidth="1"
          strokeDasharray="1 18"
          style={{
            transformOrigin: "center",
            animation: `aissisted-rotate-rev ${innerRingSeconds}s linear infinite`,
          }}
        />

        {/* Speaking signals: outward strokes from core to active modules.
            Width + opacity scale with confidence — secondary actives are
            visibly less than primary without using a different color. */}
        {mode === "speaking" &&
          nodes.map((n) => {
            const conf = confidence[n.id] ?? 0;
            if (conf < 0.32) return null;
            const v = visibility(conf);
            return (
              <line
                key={`signal-${n.id}`}
                x1="0"
                y1="0"
                x2={n.x}
                y2={n.y}
                stroke="#00C2D1"
                strokeWidth={0.8 + v * 1.1}
                strokeOpacity={0.12 + v * 0.32}
                strokeLinecap="round"
                style={{
                  animation: "aissisted-signal-pulse 2.0s ease-in-out infinite",
                }}
              />
            );
          })}

        {/* Listening signal: opacity pulse on the line from primary focus
            to core. No dashed-stroke animation — that read as busy. */}
        {mode === "listening" && primary && (
          <line
            x1="0"
            y1="0"
            x2={
              Math.cos((MODULE_ANGLES_DEG[primary] * Math.PI) / 180) *
              ORBIT_RADIUS
            }
            y2={
              -Math.sin((MODULE_ANGLES_DEG[primary] * Math.PI) / 180) *
              ORBIT_RADIUS
            }
            stroke="#00C2D1"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{
              animation: "aissisted-signal-pulse 2.4s ease-in-out infinite",
            }}
          />
        )}

        {/* Module nodes — opacity + radius are smooth functions of
            confidence. No binary "active" state at the visual layer.
            Primary focus dominates by size + a soft outer ring, NOT by red. */}
        {nodes.map((n) => {
          const conf = confidence[n.id] ?? 0;
          const v = visibility(conf);
          const isPrimary = n.id === primary && conf >= 0.3;

          // Opacity: floor 0.06 (barely visible) → 0.92 (clear).
          const opacity = 0.06 + v * 0.86;
          // Radius: 4 (dormant) → 7 (active) → 8 if primary.
          const r = 4 + v * 3 + (isPrimary ? 1 : 0);

          // Color: graphite for dormant, lerp toward aqua as confidence rises.
          // We render two concentric circles: a graphite base + an aqua overlay
          // with opacity = v. As v → 1 the aqua fully replaces the graphite,
          // creating a smooth color crossfade with no transition flash.
          return (
            <g key={n.id}>
              {/* Soft outer glow — only meaningful when warming + active */}
              {v > 0.35 && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r + 5}
                  fill="#00C2D1"
                  opacity={(v - 0.35) * 0.22}
                  style={{
                    animation:
                      "aissisted-node-glow 3.0s ease-in-out infinite",
                  }}
                />
              )}
              {/* Primary-focus outer ring — single subtle aqua ring around
                  the dot, only one node ever shows this. */}
              {isPrimary && (
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r + 3.5}
                  fill="none"
                  stroke="#00C2D1"
                  strokeWidth="0.8"
                  strokeOpacity={0.55}
                  style={{
                    animation:
                      "aissisted-primary-ring 2.6s ease-in-out infinite",
                  }}
                />
              )}
              {/* Graphite base */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#1C1C1E"
                opacity={opacity * (1 - v * 0.85)}
                style={{
                  transition:
                    "r 480ms cubic-bezier(0.2, 0, 0, 1), opacity 480ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
              {/* Aqua overlay — fades in with confidence */}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill="#00C2D1"
                opacity={v * 0.92}
                style={{
                  transition:
                    "r 480ms cubic-bezier(0.2, 0, 0, 1), opacity 480ms cubic-bezier(0.2, 0, 0, 1)",
                }}
              />
            </g>
          );
        })}

        {/* Core — soft glow then crisp inner disk */}
        <g
          style={{
            transform: `scale(${coreScale})`,
            transformOrigin: "center",
            transition: "transform 720ms cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {/* Outer soft glow */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS + 8}
            fill="url(#core-grad)"
            opacity={0.62}
            filter="url(#soft-glow)"
          />
          {/* Main core disk */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS}
            fill="#FFFFFF"
            stroke="rgba(28,28,30,0.14)"
            strokeWidth="1"
          />
          {/* Inner aqua ring — tempo set by mode for "calm vs present" feel */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS - 12}
            fill="none"
            stroke="#00C2D1"
            strokeWidth="1.1"
            strokeOpacity={mode === "idle" ? 0.32 : 0.62}
            style={{
              transformOrigin: "center",
              animation: `aissisted-core-breathe ${coreBreatheSeconds}s ease-in-out infinite`,
            }}
          />
          {/* Center seed — stays midnight always; no red flip on
              recommendation (the bloom carries the red signal instead) */}
          <circle cx="0" cy="0" r="5.5" fill="#0B1D3A" opacity={0.78} />
        </g>
      </svg>

      {/* Keyframes — co-located so the component is self-contained */}
      <style>{`
        @keyframes aissisted-rotate-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aissisted-rotate-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes aissisted-core-breathe {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50%      { transform: scale(1.035); opacity: 1; }
        }
        @keyframes aissisted-node-glow {
          0%, 100% { opacity: 0.10; }
          50%      { opacity: 0.22; }
        }
        @keyframes aissisted-primary-ring {
          0%, 100% { stroke-opacity: 0.45; }
          50%      { stroke-opacity: 0.75; }
        }
        @keyframes aissisted-signal-pulse {
          0%, 100% { stroke-opacity: 0.18; }
          50%      { stroke-opacity: 0.55; }
        }
        @keyframes aissisted-rec-bloom {
          0%   { opacity: 0; transform: scale(0.92); }
          25%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: opacity 240ms linear, fill 240ms linear !important;
          }
        }
      `}</style>
    </div>
  );
}
