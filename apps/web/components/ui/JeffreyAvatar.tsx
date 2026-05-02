import React from "react";
import "./jeffrey-avatar.css";

/*
 * JeffreyAvatar — Aqua voice-pattern identity primitive.
 *
 * Replaces the static "j" character with a 5-bar animated waveform that
 * communicates real-time Jeffrey presence + state. The bars are pure CSS
 * (no JS animation loop), so the component remains a server component
 * and renders correctly with reduced-motion overrides.
 *
 * Reusable across:
 *   · Onboarding Surface 2 (Jeffrey intro) — state="speaking"
 *   · Analytics LIVE card                  — state="idle"
 *   · Voice modal chrome                   — state per modal phase
 *   · Recommendation cards                 — state="idle"
 *
 * State machine (controls animation rhythm + chrome saturation):
 *   idle       2.4s wave, 0.50 amp, signal/15  — ambient presence  [default]
 *   listening  1.2s wave, 0.85 amp, signal/20  — user is speaking
 *   thinking   2.8s pulse (synchronized), 0.45 amp, signal/15
 *   speaking   0.8s wave, 1.00 amp, signal/25  — Jeffrey responding
 *   error      frozen, signal-red               — fault / disconnected
 *
 * Reduced motion: bars freeze at mid-height with a single 3s opacity
 * breathe; identity preserved, motion collapsed to ambient signal.
 *
 * Decorative — meaning sourced from surrounding context (aria-hidden).
 * Keyframes + state styling live in ./jeffrey-avatar.css.
 */

type JeffreyAvatarSize = "sm" | "md" | "lg";
type JeffreyAvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

interface JeffreyAvatarProps {
  size?: JeffreyAvatarSize;
  state?: JeffreyAvatarState;
  className?: string;
}

interface SizeConfig {
  container: string;
  barW: number;
  barGap: number;
  barMaxH: number;
}

/*
 * Size table — bar dimensions chosen so 5 bars + 4 gaps fit within
 * the circular chrome with breathing room.
 *   sm: 5×2 + 4×1.5 = 16px wide; container 24px →  8px slack (4px each side)
 *   md: 5×2 + 4×2   = 18px wide; container 32px → 14px slack (7px each side)
 *   lg: 5×3 + 4×3   = 27px wide; container 56px → 29px slack
 */
const SIZE_CONFIG: Record<JeffreyAvatarSize, SizeConfig> = {
  sm: { container: "w-6 h-6", barW: 2, barGap: 1.5, barMaxH: 12 },
  md: { container: "w-8 h-8", barW: 2, barGap: 2, barMaxH: 16 },
  lg: { container: "w-14 h-14", barW: 3, barGap: 3, barMaxH: 28 },
};

/*
 * Per-state chrome treatment. Saturation modulates with energy — a
 * speaking avatar feels brighter than an idle one without changing
 * the identity color. Error swaps to the danger token (signal-red).
 */
const STATE_CHROME: Record<JeffreyAvatarState, string> = {
  idle: "bg-signal/15 border-signal",
  listening: "bg-signal/20 border-signal",
  thinking: "bg-signal/15 border-signal",
  speaking: "bg-signal/25 border-signal",
  error: "bg-danger/15 border-danger",
};

export function JeffreyAvatar({
  size = "lg",
  state = "idle",
  className = "",
}: JeffreyAvatarProps) {
  const { container, barW, barGap, barMaxH } = SIZE_CONFIG[size];

  return (
    <div
      aria-hidden="true"
      className={[
        container,
        "flex items-center justify-center",
        "rounded-full border-2",
        STATE_CHROME[state],
        `jeffrey-state-${state}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="flex items-center"
        style={{ gap: `${barGap}px`, height: `${barMaxH}px` }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`jeffrey-bar jeffrey-bar-${n}`}
            style={{ width: `${barW}px`, height: `${barMaxH}px` }}
          />
        ))}
      </span>
    </div>
  );
}
