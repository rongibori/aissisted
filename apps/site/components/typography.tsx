import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Typography role helpers — Brand Bible v1.1 locked.
 *
 * Mapping (Ron lock 2026-04-18):
 *   H1 · IBM Plex Sans 700
 *   H2 · IBM Plex Sans 700
 *   H3 · IBM Plex Sans 600 · tracking −0.01em when ≥48px
 *   H4 · IBM Plex Sans 600 · tracking −0.01em when ≥48px
 *   Body prose · IBM Plex Sans 400
 *   UI labels · IBM Plex Mono (400/500/600)
 *   Data values · IBM Plex Mono (400/500/600), tabular numerics
 *   Emotional accents · IBM Plex Serif (400/600) — one beat per page max, never UI
 *   Jeffrey prose · IBM Plex Sans 400 (locked deviation)
 *   Jeffrey system affordances · IBM Plex Mono
 *
 * Every role is a component here so we never hand-wire font-family/weight
 * at the call site. That keeps the palette of choices narrow and stops drift.
 *
 * Pass-through DOM props supported: `id`, `style`. These are common and harmless;
 * any layout-grade transition or aria-labelledby anchor benefits from them.
 */

type Props = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  /** Optional inline style — used for CSS transitions / vars. */
  style?: CSSProperties;
  /** Optional DOM id — useful when a heading is the aria-labelledby target. */
  id?: string;
};

// ─── Headings ─────────────────────────────────────────────────────────────

export function H1({ as: As = "h1", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-display font-bold",
        "text-4xl md:text-5xl lg:text-6xl",
        "tracking-[-0.01em] leading-[1.05]",
        "text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

export function H2({ as: As = "h2", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-display font-bold",
        "text-3xl md:text-4xl lg:text-5xl",
        "tracking-[-0.01em] leading-[1.1]",
        "text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

export function H3({ as: As = "h3", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-display font-semibold",
        "text-2xl md:text-3xl lg:text-4xl",
        "tracking-[-0.01em] leading-[1.15]",
        "text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

export function H4({ as: As = "h4", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-display font-semibold",
        "text-xl md:text-2xl lg:text-3xl",
        "tracking-[-0.005em] leading-[1.2]",
        "text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────

export function Body({ as: As = "p", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-body font-normal",
        "text-base md:text-lg",
        "leading-[1.6] text-ink/80",
        className
      )}
    >
      {children}
    </As>
  );
}

export function Lede({ as: As = "p", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-body font-normal",
        "text-lg md:text-xl",
        "leading-[1.55] text-ink/85",
        className
      )}
    >
      {children}
    </As>
  );
}

// ─── UI + Data ────────────────────────────────────────────────────────────

export function UILabel({ as: As = "span", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-system font-medium",
        "text-xs uppercase tracking-[0.18em]",
        "text-ink/70",
        className
      )}
    >
      {children}
    </As>
  );
}

export function DataValue({ as: As = "span", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-system font-semibold",
        "tabular-nums",
        "text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

// ─── Emotional accent (rare — one per page max, never UI) ────────────────

export function ValueProp({ as: As = "p", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-accent font-normal",
        "text-2xl md:text-3xl",
        "italic leading-[1.35] text-ink",
        className
      )}
    >
      {children}
    </As>
  );
}

// ─── Jeffrey ──────────────────────────────────────────────────────────────

export function JeffreyText({ as: As = "p", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-body font-normal",
        "text-base md:text-lg",
        "leading-[1.65] text-ink/90",
        className
      )}
    >
      {children}
    </As>
  );
}

export function JeffreySystem({ as: As = "span", className, children, style, id }: Props) {
  return (
    <As
      id={id}
      style={style}
      className={cn(
        "font-system font-normal",
        "text-xs tracking-[0.08em]",
        "text-ink/60",
        className
      )}
    >
      {children}
    </As>
  );
}
