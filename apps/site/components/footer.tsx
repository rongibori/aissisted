import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { RallyCry } from "@/components/rally-cry";

/**
 * Footer — rally-cry closure + legal set. One beat of brand red, the rest
 * lives in neutral. Legal block is Plex Mono.
 *
 * Note on rally cry placement: Brand Bible v1.1 allows one rally cry per
 * page. When a page already uses the rally cry in its hero, the footer
 * should set `muted={true}` to suppress this closer. That's a composition
 * concern — enforced at the page level, not here.
 */

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/hipaa", label: "HIPAA" },
  { href: "/contact", label: "Contact" },
] as const;

type Props = {
  /** If true, skip the rally cry closer (page already used one). */
  muted?: boolean;
};

export function Footer({ muted = false }: Props) {
  return (
    <footer className="mt-24 border-t border-ink/5 bg-surface">
      <Container width="full">
        {!muted && (
          <div className="py-20 md:py-28">
            <RallyCry size="display" />
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-6 py-10",
            "md:flex-row md:items-center md:justify-between",
            !muted && "border-t border-ink/5"
          )}
        >
          <p
            className={cn(
              "font-system text-xs uppercase tracking-[0.16em]",
              "text-ink/60"
            )}
          >
            © {new Date().getFullYear()} Aissisted
          </p>

          <ul className="flex flex-wrap items-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "font-system text-xs uppercase tracking-[0.16em]",
                    "text-ink/60 hover:text-ink transition-colors"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
