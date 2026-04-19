import type { ElementType, ReactNode } from "react";
import { Body, Lede, UILabel, DataValue, JeffreyText, JeffreySystem } from "@/components/typography";

/**
 * Text — unified text component that routes to the correct typography role.
 *
 * Variants:
 *   body       · IBM Plex Sans 400 — default prose
 *   body-sm    · IBM Plex Sans 400, text-sm — secondary prose
 *   lede       · IBM Plex Sans 400, text-lg/xl — intro paragraphs
 *   label      · IBM Plex Mono 500, uppercase tracked — UI labels, eyebrows
 *   data       · IBM Plex Mono 600, tabular-nums — metric values, data
 *   jeffrey    · IBM Plex Sans 400 — Jeffrey voice prose (locked deviation)
 *   system     · IBM Plex Mono 400, small — system affordances, timestamps
 *
 * Never wire font-family or tracking manually at call sites. Use this
 * component or the explicit role helpers from typography.tsx.
 */

type Variant = "body" | "body-sm" | "lede" | "label" | "data" | "jeffrey" | "system";

type Props = {
  variant?:   Variant;
  as?:        ElementType;
  className?: string;
  children:   ReactNode;
};

const ROLE: Record<Variant, React.ComponentType<{ as?: ElementType; className?: string; children: ReactNode }>> = {
  body:     Body,
  "body-sm": Body,
  lede:     Lede,
  label:    UILabel,
  data:     DataValue,
  jeffrey:  JeffreyText,
  system:   JeffreySystem,
};

const EXTRA_CLASS: Partial<Record<Variant, string>> = {
  "body-sm": "text-sm leading-snug",
};

export function Text({ variant = "body", className, ...props }: Props) {
  const Component = ROLE[variant];
  const extra = EXTRA_CLASS[variant];
  return <Component className={extra ? `${extra}${className ? " " + className : ""}` : className} {...props} />;
}
