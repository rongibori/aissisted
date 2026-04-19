import { cn } from "@/lib/cn";

/**
 * Divider — hairline horizontal rule in brand line color.
 *
 * Semantic: use `decorative={false}` only when the divider carries structural
 * meaning (separates truly distinct content regions). Default is decorative.
 *
 * Spacing above/below: apply margin via className — the component has no
 * intrinsic margin so callers control breathing room explicitly.
 */

type Props = {
  decorative?: boolean;
  className?:  string;
};

export function Divider({ decorative = true, className }: Props) {
  return (
    <hr
      role={decorative ? "presentation" : undefined}
      aria-hidden={decorative}
      className={cn("border-0 border-t border-line w-full", className)}
    />
  );
}
