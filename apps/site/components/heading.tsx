import type { ElementType, ReactNode } from "react";
import { H1, H2, H3, H4 } from "@/components/typography";

/**
 * Heading — polymorphic heading that routes to H1–H4 type-scale roles.
 *
 * Prefer this single component at call sites instead of importing H1/H2/H3/H4
 * directly. The `level` prop maps to the semantic element AND the type scale
 * in one step — you can't accidentally use an H2 scale on an h3 element.
 *
 * The `as` escape hatch lets you override the rendered element (e.g., render
 * a div with H1 styling in an aria-labelledby pattern).
 */

type Level = 1 | 2 | 3 | 4;

type Props = {
  level?:     Level;
  as?:        ElementType;
  className?: string;
  children:   ReactNode;
};

const ROLE = {
  1: H1,
  2: H2,
  3: H3,
  4: H4,
} as const;

export function Heading({ level = 1, ...props }: Props) {
  const Component = ROLE[level];
  return <Component {...props} />;
}
