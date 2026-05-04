"use client";

import React, { useId } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

export type NeuralCoreState = "idle" | "thinking" | "speaking" | "listening" | "alert";

const MODE_HUE: Record<string, { core: string; ring: string; label: string }> = {
  optimal: { core: "#2EC4B6", ring: "#2EC4B6", label: "Optimal" },
  cardiovascular_risk: { core: "#E63946", ring: "#E63946", label: "Cardiovascular Risk" },
  metabolic_dysfunction: { core: "#F59E0B", ring: "#F59E0B", label: "Metabolic Concern" },
  hormonal_imbalance: { core: "#8B5CF6", ring: "#8B5CF6", label: "Hormonal Imbalance" },
  micronutrient_deficient: { core: "#F4D35E", ring: "#F4D35E", label: "Micronutrient Gap" },
  renal_caution: { core: "#F97316", ring: "#F97316", label: "Renal Caution" },
  inflammatory: { core: "#E63946", ring: "#E63946", label: "Inflammation" },
  data_insufficient: { core: "#4A4A55", ring: "#4A4A55", label: "Insufficient Data" },
};

interface NeuralCoreProps {
  mode: string;
  confidenceScore: number;
  signalCount?: number;
  state?: NeuralCoreState;
  size?: number;
  className?: string;
}

export function NeuralCore({
  mode,
  confidenceScore,
  signalCount = 0,
  state = "idle",
  size = 280,
  className = "",
}: NeuralCoreProps) {
  const reduced = useReducedMotion();
  const reactId = useId();
  // Sanitize useId output (e.g. ":r0:") for use as SVG ID
  const id = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const palette = MODE_HUE[mode] ?? MODE_HUE.data_insufficient;

  const innerOpacity = Math.max(0.35, 0.4 + confidenceScore * 0.6);
  const center = size / 2;
  const outerR = size * 0.46;
  const orbitR = size * 0.34;
  const innerR = size * 0.22;

  const orbitDots = Array.from({ length: 3 }, (_, i) => {
    const active = i < Math.min(3, Math.max(1, signalCount));
    return {
      angle: (i * 120 + 30) * (Math.PI / 180),
      size: active ? size * 0.025 : size * 0.015,
      opacity: active ? 0.9 : 0.4,
      delayMs: i * 800,
    };
  });

  const ringClass = !reduced
    ? state === "thinking"
      ? "neural-spin-fast"
      : "neural-spin"
    : "";
  const innerClass = !reduced && state === "speaking" ? "neural-pulse" : "";

  return (
    <div
      role="img"
      aria-label={`Neural core: ${palette.label} mode, ${Math.round(
        confidenceScore * 100
      )}% confidence${signalCount > 0 ? `, ${signalCount} active signal${signalCount > 1 ? "s" : ""}` : ""}`}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.core} stopOpacity="0.95" />
            <stop offset="60%" stopColor={palette.core} stopOpacity="0.55" />
            <stop offset="100%" stopColor={palette.core} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2EC4B6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0F1B2D" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <circle cx={center} cy={center} r={outerR} fill="#FFFFFF" stroke="#E5E5E0" strokeWidth="1" />

        {/* Outer rotating ring */}
        <g
          className={ringClass}
          style={{ transformOrigin: `${center}px ${center}px` }}
        >
          <circle
            cx={center}
            cy={center}
            r={outerR - 2}
            fill="none"
            stroke={`url(#${id}-ring)`}
            strokeWidth="1.5"
            strokeDasharray="4 8"
            opacity="0.85"
          />
        </g>

        {/* Listening: expanding red ring */}
        {state === "listening" && !reduced && (
          <circle
            cx={center}
            cy={center}
            r={outerR - 6}
            fill="none"
            stroke="#E63946"
            strokeWidth="2"
            opacity="0.7"
            className="neural-expand"
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        )}

        {/* Mid-orbit signal dots */}
        {orbitDots.map((dot, i) => {
          const x = center + Math.cos(dot.angle) * orbitR;
          const y = center + Math.sin(dot.angle) * orbitR;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={dot.size}
              fill={palette.ring}
              opacity={dot.opacity}
              className={reduced ? "" : "neural-blink"}
              style={{
                animationDelay: `${dot.delayMs}ms`,
                transformOrigin: `${x}px ${y}px`,
              }}
            />
          );
        })}

        {/* Thinking: two extra mid-orbit dots */}
        {state === "thinking" &&
          !reduced &&
          [60, 240].map((deg, i) => {
            const a = (deg * Math.PI) / 180;
            const x = center + Math.cos(a) * orbitR;
            const y = center + Math.sin(a) * orbitR;
            return (
              <circle
                key={`t${i}`}
                cx={x}
                cy={y}
                r={size * 0.018}
                fill="#0F1B2D"
                opacity="0.7"
                className="neural-blink"
                style={{
                  animationDelay: `${i * 250}ms`,
                  transformOrigin: `${x}px ${y}px`,
                }}
              />
            );
          })}

        {/* Inner core */}
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill={`url(#${id}-core)`}
          opacity={innerOpacity}
          className={innerClass}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Inner highlight */}
        <circle
          cx={center - innerR * 0.3}
          cy={center - innerR * 0.3}
          r={innerR * 0.18}
          fill="#FFFFFF"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
