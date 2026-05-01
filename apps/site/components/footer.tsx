import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Pill } from "@/components/pill";
import { RallyCry } from "@/components/rally-cry";

/**
 * Footer — wordmark, nav set, waitlist contact line, legal set with the
 * pending-counsel banner. One beat of brand red on the closer rally cry
 * (only when not muted), the rest stays in neutral.
 *
 * M3 arbitration (CEO, 2026-04-30):
 *   · /contact retired. Footer now carries the waitlist email + CTA in
 *     its place — the soft contact path.
 *   · /legal/* pages exist as a deferred phase. Until counsel signs,
 *     every legal link is shadowed by a [LEGAL REVIEW PENDING] banner.
 *
 * Note on rally cry placement: Brand Bible v1.1 allows one rally cry per
 * page. When a page already uses the rally cry in its hero, the footer
 * should set `muted={true}` to suppress this closer. The shared shell
 * passes muted by default — pages that need a closer rally cry render
 * <RallyCry /> themselves above the footer.
 */

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/science", label: "Science" },
  { href: "/jeffrey", label: "Jeffrey" },
  { href: "/about", label: "About" },
] as const;

const LEGAL_LINKS = [
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/hipaa", label: "HIPAA" },
] as const;

const WAITLIST_EMAIL = "hello@aissisted.com";

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

        {/* Waitlist contact — replaces /contact per M3 arbitration. */}
        <div
          id="waitlist"
          className={cn(
            "py-12 md:py-16",
            !muted && "border-t border-ink/5"
          )}
        >
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-2xl">
              <p
                className={cn(
                  "font-system text-xs uppercase tracking-[0.16em] text-ink/60"
                )}
              >
                Stay in touch
              </p>
              <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.01em] text-ink md:text-3xl">
                Write to us, or join the wait.
              </p>
              <p className="mt-3 max-w-xl text-sm text-ink/70 md:text-base">
                Questions, partnerships, press — the founder reads every
                note. For an invitation, request access; we will write back
                when a seat opens.
              </p>
              <p className="mt-4">
                <a
                  href={`mailto:${WAITLIST_EMAIL}`}
                  className={cn(
                    "font-system text-sm tracking-[0.04em] text-ink",
                    "underline decoration-ink/30 underline-offset-4",
                    "hover:decoration-ink"
                  )}
                >
                  {WAITLIST_EMAIL}
                </a>
              </p>
            </div>

            <Link
              href="/request-access"
              className={cn(
                "inline-flex h-11 items-center justify-center px-6",
                "bg-brand text-white",
                "font-system text-xs font-medium uppercase tracking-[0.16em]",
                "hover:brightness-110 transition-[filter]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
              )}
            >
              Request access
            </Link>
          </div>
        </div>

        {/* Nav set — mirrors top bar, plus the pages a quiet visitor reaches at the bottom. */}
        <div className="border-t border-ink/5 py-10">
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "font-system text-xs uppercase tracking-[0.16em]",
                    "text-ink/70 hover:text-ink transition-colors"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal set — shadowed by the pending-counsel banner until M3 legal pass. */}
        <div className="border-t border-ink/5 py-10">
          <div className="mb-5">
            <Pill tone="warn">[LEGAL REVIEW PENDING]</Pill>
            <p className="mt-3 max-w-2xl text-xs text-ink/60">
              Privacy, Terms, and HIPAA copy are staged from industry
              templates. Counsel-drafted swap-in is in flight; nothing on
              these pages is final until that banner is removed.
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-3">
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

        <div
          className={cn(
            "flex flex-col gap-4 border-t border-ink/5 py-8",
            "md:flex-row md:items-center md:justify-between"
          )}
        >
          <Link
            href="/"
            aria-label="aissisted — home"
            className="font-display text-base font-bold tracking-[-0.01em] text-ink"
          >
            aissisted
          </Link>
          <p
            className={cn(
              "font-system text-xs uppercase tracking-[0.16em]",
              "text-ink/60"
            )}
          >
            © {new Date().getFullYear()} aissisted
          </p>
        </div>
      </Container>
    </footer>
  );
}
