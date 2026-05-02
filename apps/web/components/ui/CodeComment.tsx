import React from "react";

/*
 * CodeComment — system-register subline primitive.
 *
 * Renders one or more lines of IBM Plex Mono "// text" sublines.
 * Per design spec §2.2 (Code-comment row) and cowork-briefs/jeffrey-intro.md
 * §3. Used on Jeffrey introduction, voice modal, and analytics surfaces.
 *
 * The "//" prefix is aria-hidden so screen readers don't announce "slash
 * slash" — the body of each line carries the meaning. Body color is
 * graphite at 70%, prefix at 50% (dimmer — establishes the code-comment
 * register without taking emphasis from the headline).
 *
 * Left-aligned by default — code comments are left-aligned by convention,
 * even when the surrounding surface is centered.
 */

interface CodeCommentProps {
  lines: ReadonlyArray<string>;
  className?: string;
}

export function CodeComment({ lines, className = "" }: CodeCommentProps) {
  return (
    <div
      className={[
        "font-system text-[13px] leading-relaxed text-left",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {lines.map((line, index) => (
        <p key={index} className="text-ink/70">
          <span aria-hidden="true" className="text-ink/50">
            //{" "}
          </span>
          {line}
        </p>
      ))}
    </div>
  );
}
