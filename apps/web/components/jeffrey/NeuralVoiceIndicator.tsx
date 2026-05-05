"use client";
/**
 * Jeffrey Neural Voice Indicator
 *
 * Replaces the deprecated 5-bar voice indicator. Renders a small living
 * neural network whose activity reflects Jeffrey's current state.
 *
 * Aligned with: docs/specs/JEFFREY_NEURAL_INDICATOR_SPEC.md
 *
 * Usage:
 *   <NeuralVoiceIndicator state="processing" size="lg" />
 *   <NeuralVoiceIndicator state="idle" size="sm" />        // dock chip
 *
 * The animation engine lives in `./neural-engine.ts` (no React deps) so it
 * can be tested + reused in non-React surfaces (HTML prototype, native).
 */

import React, { useEffect, useRef, useState } from "react";
import {
  STATE_PROFILES,
  createModel,
  tick,
  nodeDisplayPos,
  type NeuralModel,
  type NeuralState,
} from "./neural-engine";

export type { NeuralState } from "./neural-engine";
export type NeuralSize = "sm" | "md" | "lg";

interface Props {
  state?: NeuralState;
  size?: NeuralSize;
  intensity?: number;     // 0–1, multiplier on spawn rate + activation amp
  seed?: number;          // topology seed; same seed = same brain
  ariaLabel?: string;     // overrides state-derived default
  className?: string;
}

const SIZE_PX: Record<NeuralSize, number> = {
  sm: 24,
  md: 80,
  lg: 240,
};

const STATE_LABEL: Record<NeuralState, string> = {
  idle: "Jeffrey ambient",
  listening: "Jeffrey listening",
  processing: "Jeffrey thinking",
  speaking: "Jeffrey speaking",
  error: "Jeffrey error",
};

/**
 * VIEWBOX is normalized 0..1 internally; we scale via SVG viewBox so all
 * geometry stays in clean fractional coordinates regardless of pixel size.
 */
const VB = 1000; // viewBox is 0..VB so we can use integer-ish numbers

export function NeuralVoiceIndicator({
  state = "idle",
  size = "md",
  intensity = 1,
  seed = 1,
  ariaLabel,
  className,
}: Props) {
  const modelRef = useRef<NeuralModel | null>(null);
  if (modelRef.current === null) modelRef.current = createModel(seed);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [, force] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  // Run the rAF loop. Pause when document is hidden.
  useEffect(() => {
    if (reducedMotion) return; // no rAF in reduced motion — single render

    let cancelled = false;
    const step = (now: number) => {
      if (cancelled) return;
      tick(modelRef.current!, state, intensity, now);
      // Force re-render via state bump; the render reads modelRef directly.
      force((n) => (n + 1) % 1024);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, intensity, reducedMotion]);

  const px = SIZE_PX[size];
  const model = modelRef.current!;
  const profile = STATE_PROFILES[state];
  const label = ariaLabel ?? STATE_LABEL[state];
  const now = typeof performance !== "undefined" ? performance.now() : 0;

  // Visual constants per size — node radius and signal radius scale gracefully
  const nodeRBase = size === "sm" ? 18 : size === "md" ? 22 : 26;
  const nodeRPeak = size === "sm" ? 32 : size === "md" ? 42 : 52;
  const signalR   = size === "sm" ? 14 : size === "md" ? 18 : 22;
  const edgeWidth = size === "sm" ? 3  : size === "md" ? 3  : 3;

  // Node display positions (with drift)
  const positions = model.nodes.map((n) => nodeDisplayPos(n, model.driftAmp, now));

  // For static reduced-motion render: ignore drift, ignore signals.
  const baselineActivation = profile.baselineActivation;

  return (
    <span
      role="img"
      aria-label={label}
      data-state={state}
      data-size={size}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: px,
        height: px,
        borderRadius: "50%",
        background: `rgba(0, 194, 209, ${chromeAlpha(state)})`,
        transition: "background 320ms cubic-bezier(0.2, 0, 0, 1)",
        flexShrink: 0,
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <g transform={`translate(${VB / 2}, ${VB / 2}) scale(${reducedMotion ? 1 : model.scale}) translate(${-VB / 2}, ${-VB / 2})`}>
          {/* Edges */}
          {model.edges.map((e, i) => {
            const a = positions[e.from];
            const b = positions[e.to];
            return (
              <line
                key={`e${i}`}
                x1={a.x * VB}
                y1={a.y * VB}
                x2={b.x * VB}
                y2={b.y * VB}
                stroke="#1C1C1E"
                strokeOpacity={0.12}
                strokeWidth={edgeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {/* Signals — circles at interpolated positions along edges */}
          {!reducedMotion &&
            model.edges.flatMap((e, ei) => {
              const a = positions[e.from];
              const b = positions[e.to];
              return e.signals.map((s, si) => {
                const x = (a.x + (b.x - a.x) * s.progress) * VB;
                const y = (a.y + (b.y - a.y) * s.progress) * VB;
                const fade = 1 - Math.abs(s.progress - 0.5) * 0.4;
                return (
                  <circle
                    key={`s${ei}-${si}`}
                    cx={x}
                    cy={y}
                    r={signalR}
                    fill={s.red ? "#EE2B37" : "#00C2D1"}
                    opacity={fade}
                  />
                );
              });
            })}

          {/* Nodes — base + activation core */}
          {model.nodes.map((n, i) => {
            const p = positions[i];
            const a = reducedMotion ? baselineActivation : n.activation;
            // Base ring stays constant; core radius and opacity track activation
            const coreR = nodeRBase + (nodeRPeak - nodeRBase) * a;
            return (
              <g key={`n${i}`}>
                {/* Halo (only when activation is high) */}
                {a > 0.5 && (
                  <circle
                    cx={p.x * VB}
                    cy={p.y * VB}
                    r={coreR * 1.6}
                    fill="#00C2D1"
                    opacity={(a - 0.5) * 0.3}
                  />
                )}
                {/* Outer ring — always visible at low opacity */}
                <circle
                  cx={p.x * VB}
                  cy={p.y * VB}
                  r={nodeRBase}
                  fill="#00C2D1"
                  opacity={0.35 + a * 0.35}
                />
                {/* Bright core — opacity tracks activation */}
                <circle
                  cx={p.x * VB}
                  cy={p.y * VB}
                  r={Math.max(0, coreR * 0.55)}
                  fill={a > 0.7 ? "#FFFFFF" : "#00C2D1"}
                  opacity={a}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </span>
  );
}

/**
 * Chrome (background tint of the circular container) saturation per state.
 * Mirrors the legacy bar indicator's chrome vibe so existing layouts inherit.
 */
function chromeAlpha(state: NeuralState): number {
  switch (state) {
    case "idle":       return 0.10;
    case "listening":  return 0.16;
    case "processing": return 0.22;
    case "speaking":   return 0.20;
    case "error":      return 0.10;
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}
