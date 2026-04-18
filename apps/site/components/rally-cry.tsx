import { cn } from "@/lib/cn";
import { assertRallyCry, RALLY_CRY } from "@/lib/brand-rules";

/**
 * RallyCry — the one brand sentence. Period-locked.
 *
 * "Your Body. Understood."
 *
 * Every render passes through assertRallyCry so the comma variant, the em-dash
 * variant, and any future drift throws in dev. Production logs and keeps going
 * so a stray reviewer edit doesn't crash the page — but the catalog flags it.
 *
 * Typography is the one emotional-accent beat per page. Use Plex Sans display
 * weight; the "Understood." clause takes brand red to anchor the 2% signal.
 *
 * Rules (Brand Bible v1.1):
 *   · Never underline
 *   · Never italicize
 *   · Never all-caps
 *   · Period mandatory between clauses
 *   · One per page max (enforced by composition, not by this component)
 */

type Size = "hero" | "display" | "inline";

const SIZES: Record<Size, string> = {
  hero: "text-5xl md:text-7xl lg:text-8xl tracking-[-0.02em] leading-[1.02]",
  display: "text-4xl md:text-6xl tracking-[-0.015em] leading-[1.05]",
  inline: "text-2xl md:text-3xl tracking-[-0.01em] leading-[1.1]",
};

type Props = {
  /**
   * Intentionally NOT a free-form prop. Only the locked rally cry renders.
   * Accepts the one accepted value so the type system itself blocks drift.
   */
  text?: typeof RALLY_CRY;
  size?: Size;
  className?: string;
};

export function RallyCry({
  text = RALLY_CRY,
  size = "hero",
  className,
}: Props) {
  assertRallyCry(text);

  // Split on the locked period to style "Understood." in brand red.
  // The period stays with the first clause typographically.
  const [first, second] = text.split(". ");

  return (
    <h1
      className={cn(
        "rally-cry font-display font-bold text-ink",
        "no-underline not-italic normal-case",
        SIZES[size],
        className
      )}
    >
      <span>{first}.</span>{" "}
      <span className="text-brand">{second}</span>
    </h1>
  );
}
