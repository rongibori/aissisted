"use client";

/**
 * NeuralSystem — the only thing on screen.
 *
 * One central core. Seven module nodes orbiting at fixed angles (same as
 * apps/web/components/JeffreyAISystem/systemTypes.ts modulePosition() so the
 * spatial memory carries across surfaces). Subtle SVG signal lines from
 * primary focus → core → active modules during speaking.
 *
 * Driven entirely by the orchestrator state. No props for "active" or
 * "speaking" — those come from useOrchestrator* hooks. The only prop is
 * `connected`, which lets the parent fade in the system when the realtime
 * session is alive.
 */

import { useMemo } from "react";
import {
  MODULE_IDS,
  useOrchestratorMode,
  useActiveModules,
  usePrimaryFocus,
  useAllTopicConfidence,
  type ModuleId,
} from "@aissisted/orchestrator";

interface Props {
  connected: boolean;
}

// ─── Geometry — mirrors JeffreyAISystem.modulePosition() angles ─────────

/**
 * Module angles in degrees. Same as the canonical JeffreyAISystem layout so
 * users build spatial memory: top = sleep, upper-right = recovery, etc.
 *
 * NOTE: SVG y axis grows downward, while the canonical math expects y up.
 * We flip the y component when projecting to SVG coords below.
 */
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
      y: -Math.sin(rad) * r, // flip for SVG
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────

export function NeuralSystem({ connected }: Props) {
  const mode = useOrchestratorMode();
  const activeModules = useActiveModules();
  const primary = usePrimaryFocus();
  const confidence = useAllTopicConfidence();

  // viewBox is 600×600 centered at (0, 0) so positive coords are simple.
  const VB = 600;
  const HALF = VB / 2;
  const ORBIT_RADIUS = 210;
  const CORE_RADIUS = 56;

  const nodes = useMemo(() => nodesAtRadius(ORBIT_RADIUS), []);
  const activeSet = new Set(activeModules);

  // Mode → core scaling and ring widths
  const coreScale =
    mode === "speaking"
      ? 1.06
      : mode === "listening"
        ? 1.03
        : mode === "thinking" || mode === "analyzing"
          ? 1.0
          : mode === "recommendation"
            ? 1.08
            : 1.0;

  // Mode → halo opacity. Idle = whisper. Speaking = present. Recommendation = brief red.
  const haloOpacity =
    mode === "speaking"
      ? 0.55
      : mode === "listening"
        ? 0.4
        : mode === "thinking" || mode === "analyzing"
          ? 0.35
          : mode === "recommendation"
            ? 0.65
            : 0.18;

  const haloColor =
    mode === "recommendation" ? "#EE2B37" : "#00C2D1"; // red bloom rare; aqua otherwise

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: connected ? 1 : 0.92,
        transition: "opacity 600ms cubic-bezier(0.2, 0, 0, 1)",
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
            <stop offset="0%" stopColor={haloColor} stopOpacity="0.4" />
            <stop offset="60%" stopColor={haloColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={haloColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#00C2D1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0B1D3A" stopOpacity="0.92" />
          </radialGradient>
          <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Halo — soft outer glow, mode-driven */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS + 60}
          fill="url(#halo-grad)"
          opacity={haloOpacity}
          style={{ transition: "opacity 480ms cubic-bezier(0.2, 0, 0, 1)" }}
        />

        {/* Outer ring — slow rotation conveys "system is alive" */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(28,28,30,0.12)"
          strokeWidth="1"
          strokeDasharray="2 8"
          style={{
            transformOrigin: "center",
            animation: "aissisted-rotate-slow 60s linear infinite",
          }}
        />

        {/* Inner ring — opposes outer rotation, accelerates with speaking */}
        <circle
          cx="0"
          cy="0"
          r={ORBIT_RADIUS - 36}
          fill="none"
          stroke="rgba(28,28,30,0.08)"
          strokeWidth="1"
          strokeDasharray="1 14"
          style={{
            transformOrigin: "center",
            animation: `aissisted-rotate-rev ${
              mode === "speaking" ? 24 : 90
            }s linear infinite`,
          }}
        />

        {/* Speaking signals: outward strokes from core to active modules */}
        {mode === "speaking" &&
          nodes.map((n) => {
            const isActive = activeSet.has(n.id);
            if (!isActive) return null;
            const conf = confidence[n.id] ?? 0;
            return (
              <line
                key={`signal-${n.id}`}
                x1="0"
                y1="0"
                x2={n.x}
                y2={n.y}
                stroke="#00C2D1"
                strokeWidth={1 + conf * 1.2}
                strokeOpacity={0.18 + conf * 0.4}
                strokeLinecap="round"
                style={{
                  animation: "aissisted-signal-pulse 1.4s ease-in-out infinite",
                }}
              />
            );
          })}

        {/* Listening signals: inward strokes from primary focus → core */}
        {mode === "listening" && primary && (
          <line
            x1={(MODULE_ANGLES_DEG[primary] * 0) || 0}
            y1={0}
            x2={Math.cos((MODULE_ANGLES_DEG[primary] * Math.PI) / 180) * ORBIT_RADIUS}
            y2={-Math.sin((MODULE_ANGLES_DEG[primary] * Math.PI) / 180) * ORBIT_RADIUS}
            stroke="#00C2D1"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            strokeLinecap="round"
            style={{
              animation: "aissisted-signal-inward 1.6s ease-in-out infinite",
            }}
          />
        )}

        {/* Module nodes */}
        {nodes.map((n) => {
          const isActive = activeSet.has(n.id);
          const isPrimary = n.id === primary;
          const conf = confidence[n.id] ?? 0;
          const baseR = 5;
          const r = isPrimary ? baseR + 3 : isActive ? baseR + 1.5 : baseR;
          const opacity = isActive
            ? 0.95
            : 0.18 + conf * 0.55;
          const fill = isActive
            ? isPrimary
              ? "#EE2B37" // primary focus = signal red
              : "#00C2D1" // active = aqua
            : "#1C1C1E"; // dormant = graphite
          return (
            <g key={n.id}>
              {isActive && (
                // Active node halo — small glow expands the dot's presence
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r + 6}
                  fill={fill}
                  opacity={0.22}
                  style={{
                    animation: "aissisted-node-pulse 2.2s ease-in-out infinite",
                  }}
                />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={fill}
                opacity={opacity}
                style={{
                  transition:
                    "r 480ms cubic-bezier(0.2, 0, 0, 1), opacity 480ms cubic-bezier(0.2, 0, 0, 1), fill 480ms cubic-bezier(0.2, 0, 0, 1)",
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
            transition: "transform 520ms cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {/* outer soft glow */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS + 8}
            fill="url(#core-grad)"
            opacity={0.7}
            filter="url(#soft-glow)"
          />
          {/* main core disk */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS}
            fill="#FFFFFF"
            stroke="rgba(28,28,30,0.18)"
            strokeWidth="1"
          />
          {/* inner aqua ring — breathing speed depends on mode */}
          <circle
            cx="0"
            cy="0"
            r={CORE_RADIUS - 12}
            fill="none"
            stroke="#00C2D1"
            strokeWidth="1.2"
            strokeOpacity={mode === "idle" ? 0.4 : 0.78}
            style={{
              animation:
                mode === "speaking"
                  ? "aissisted-core-breathe 1.1s ease-in-out infinite"
                  : mode === "listening"
                    ? "aissisted-core-breathe 1.6s ease-in-out infinite"
                    : "aissisted-core-breathe 4s ease-in-out infinite",
              transformOrigin: "center",
            }}
          />
          {/* center seed */}
          <circle
            cx="0"
            cy="0"
            r="6"
            fill={mode === "recommendation" ? "#EE2B37" : "#0B1D3A"}
            opacity={0.85}
            style={{ transition: "fill 480ms" }}
          />
        </g>
      </svg>

      {/* Keyframes — co-located so this component is self-contained */}
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
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%      { transform: scale(1.04); opacity: 1; }
        }
        @keyframes aissisted-node-pulse {
          0%, 100% { transform: scale(1); opacity: 0.22; }
          50%      { transform: scale(1.6); opacity: 0.05; }
          transform-origin: center;
        }
        @keyframes aissisted-signal-pulse {
          0%, 100% { stroke-opacity: 0.2; }
          50%      { stroke-opacity: 0.7; }
        }
        @keyframes aissisted-signal-inward {
          0%   { stroke-dasharray: 0 240; stroke-opacity: 0.0; }
          50%  { stroke-dasharray: 120 240; stroke-opacity: 0.6; }
          100% { stroke-dasharray: 240 240; stroke-opacity: 0.0; }
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: opacity 200ms linear, fill 200ms linear !important;
          }
        }
      `}</style>
    </div>
  );
}
