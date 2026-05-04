"use client";

import React from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

export type VoiceOrbState = "idle" | "listening" | "processing" | "speaking";

const STATE_COLOR: Record<VoiceOrbState, { core: string; ring: string }> = {
  idle: { core: "#2EC4B6", ring: "#2EC4B6" },
  listening: { core: "#E63946", ring: "#E63946" },
  processing: { core: "#0F1B2D", ring: "#0F1B2D" },
  speaking: { core: "#2EC4B6", ring: "#2EC4B6" },
};

interface VoiceOrbProps {
  state: VoiceOrbState;
  onClick?: () => void;
  disabled?: boolean;
  size?: number;
  ariaLabel?: string;
  className?: string;
}

export function VoiceOrb({
  state,
  onClick,
  disabled,
  size = 56,
  ariaLabel,
  className = "",
}: VoiceOrbProps) {
  const reduced = useReducedMotion();
  const palette = STATE_COLOR[state];
  const center = size / 2;
  const innerR = size * 0.32;
  const outerR = size * 0.45;

  const innerClass =
    !reduced && state === "speaking"
      ? "neural-pulse"
      : !reduced && state === "listening"
        ? "neural-pulse"
        : "";

  const expandClass =
    !reduced && state === "listening" ? "neural-expand" : "";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        ariaLabel ??
        (state === "listening"
          ? "Stop voice input"
          : state === "speaking"
            ? "Jeffrey is speaking"
            : "Start voice input")
      }
      aria-pressed={state === "listening"}
      className={`relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={outerR}
          fill="#FFFFFF"
          stroke={palette.ring}
          strokeWidth="1.5"
          opacity="0.4"
        />
        {state === "listening" && (
          <circle
            cx={center}
            cy={center}
            r={outerR}
            fill="none"
            stroke={palette.ring}
            strokeWidth="2"
            opacity="0.7"
            className={expandClass}
            style={{ transformOrigin: `${center}px ${center}px` }}
          />
        )}
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill={palette.core}
          opacity="0.85"
          className={innerClass}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />
        {/* Mic icon */}
        <g transform={`translate(${center - size * 0.12}, ${center - size * 0.13})`}>
          <rect
            x={size * 0.06}
            y={0}
            width={size * 0.12}
            height={size * 0.18}
            rx={size * 0.06}
            fill="#FFFFFF"
            opacity="0.95"
          />
          <path
            d={`M ${size * 0.02} ${size * 0.13}
                a ${size * 0.1} ${size * 0.1} 0 0 0 ${size * 0.2} 0`}
            stroke="#FFFFFF"
            strokeWidth={size * 0.025}
            fill="none"
            opacity="0.95"
          />
          <line
            x1={size * 0.12}
            y1={size * 0.21}
            x2={size * 0.12}
            y2={size * 0.26}
            stroke="#FFFFFF"
            strokeWidth={size * 0.025}
            opacity="0.95"
          />
        </g>
      </svg>
    </button>
  );
}
