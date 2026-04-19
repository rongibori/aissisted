import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";

/**
 * ArchitectureDiagram — the left-to-right flow block.
 *
 * Used to surface the Aissisted system at a glance (Input → Normalization →
 * Rules → AI → Output → Memory) or any sub-system (Jeffrey's pipeline,
 * lab ingestion).
 *
 * Intentionally flat, not SVG-heavy. Premium reads as a clear sentence in
 * shapes, not a genome browser. Each node is a thin bordered rectangle with
 * a Plex Mono label and (optionally) a one-line caption.
 *
 * Arrow glyph is a hair-line SVG so it scales cleanly and never bold-traps.
 */

type Node = {
  label: string;
  caption?: ReactNode;
  /** Highlight one node per diagram max — signals the current beat. */
  emphasized?: boolean;
};

type Props = {
  nodes: Node[]; // 3–6 nodes. Composition caps at call site.
  className?: string;
};

export function ArchitectureDiagram({ nodes, className }: Props) {
  const trimmed = nodes.slice(0, 6);

  return (
    <div
      className={cn(
        "w-full overflow-x-auto",
        "py-10 md:py-14",
        className
      )}
      role="group"
      aria-label="System architecture"
    >
      <div className="flex min-w-full items-stretch gap-4 md:gap-6">
        {trimmed.map((node, i) => (
          <div
            key={node.label}
            className="flex flex-1 items-center"
          >
            <div
              className={cn(
                "flex-1 min-w-[9rem] p-4 md:p-5",
                "ring-1 ring-inset",
                node.emphasized
                  ? "ring-brand bg-brand/5"
                  : "ring-ink/15 bg-surface"
              )}
            >
              <UILabel className={node.emphasized ? "text-brand" : undefined}>
                {node.label}
              </UILabel>
              {node.caption && (
                <p className="mt-2 font-body text-sm text-ink/70">
                  {node.caption}
                </p>
              )}
            </div>

            {i < trimmed.length - 1 && (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 8"
                className="mx-2 h-2 w-6 shrink-0 text-ink/30"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M0 4 L22 4 M18 1 L22 4 L18 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
