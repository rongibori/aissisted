import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";

/**
 * Nav — sticky top bar. Plex Mono for system affordance (navigation is UI,
 * not prose). Minimal set: wordmark, three links, one primary CTA.
 *
 * Brand discipline:
 *   · Wordmark is text-only — no logomark pixel art in this scaffold. Design
 *     pass in M13 may promote to an SVG once the mark is locked.
 *   · One brand-red element max (the CTA).
 *   · 56px height — the quiet frame. Premium reads as restraint.
 */

const PRIMARY_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/science", label: "Science" },
  { href: "/pricing", label: "Formulas" },
] as const;

export function Nav() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "bg-surface/85 backdrop-blur-md",
        "border-b border-ink/5"
      )}
    >
      <Container width="full">
        <nav className="flex h-14 items-center justify-between">
          <Link
            href="/"
            aria-label="Aissisted — home"
            className={cn(
              "font-display text-base font-bold tracking-[-0.01em]",
              "text-ink hover:opacity-80 transition-opacity"
            )}
          >
            Aissisted
          </Link>

          <div className="flex items-center gap-8">
            <ul className="hidden items-center gap-8 md:flex">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "font-system text-xs font-medium uppercase tracking-[0.16em]",
                      "text-ink/70 hover:text-ink transition-colors"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/request-access"
              className={cn(
                "inline-flex h-9 items-center px-4",
                "bg-brand text-white",
                "font-system text-xs font-medium uppercase tracking-[0.16em]",
                "hover:brightness-110 transition-[filter]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
              )}
            >
              Request access
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}
