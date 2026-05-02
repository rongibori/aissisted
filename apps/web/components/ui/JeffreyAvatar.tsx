import React from "react";

/*
 * JeffreyAvatar — Aqua "j" identity primitive.
 *
 * Reusable across analytics LIVE card, voice modal state pill, and
 * recommendation cards. Per design spec §3.1 (Avatar component) and
 * cowork-briefs/jeffrey-intro.md §3 token table.
 *
 * The "j" is rendered as a styled span using the display font-stack —
 * inherits next/font Briston-fallback from layout.tsx without needing an
 * inline SVG. Switch to SVG only if letterform fidelity needs upgrading.
 *
 * Decorative — surrounding context provides the meaning (aria-hidden).
 */

type JeffreyAvatarSize = "sm" | "md" | "lg";

interface JeffreyAvatarProps {
  size?: JeffreyAvatarSize;
  className?: string;
}

const SIZE_TO_CLASSES: Record<JeffreyAvatarSize, { box: string; glyph: string }> = {
  sm: { box: "w-6 h-6", glyph: "text-[12px]" },
  md: { box: "w-8 h-8", glyph: "text-[16px]" },
  lg: { box: "w-14 h-14", glyph: "text-[28px]" },
};

export function JeffreyAvatar({ size = "lg", className = "" }: JeffreyAvatarProps) {
  const { box, glyph } = SIZE_TO_CLASSES[size];
  return (
    <div
      aria-hidden="true"
      className={[
        box,
        "flex items-center justify-center",
        "rounded-full bg-signal/20 border-2 border-signal",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={["font-display font-bold leading-none text-signal", glyph].join(" ")}
      >
        j
      </span>
    </div>
  );
}
