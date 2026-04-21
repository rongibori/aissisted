import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { H1, Lede, JeffreySystem } from "@/components/typography";
import { AskAffordance } from "./ask-affordance";

/**
 * InvestorHero — the fold.
 *
 * Midnight canvas, aqua signal, Plex Sans Bold headline. One emotional beat:
 * the thesis, stated the way Jeffrey would state it.
 *
 * No raise size, no "investing" language. The fold earns the rest of the
 * page — it doesn't pitch the round.
 */

type Props = {
  className?: string;
};

export function InvestorHero({ className }: Props) {
  return (
    <section
      aria-labelledby="investor-hero-heading"
      className={cn(
        "relative overflow-hidden",
        "bg-[color:var(--brand-midnight)] text-white",
        "py-24 md:py-36",
        className,
      )}
    >
      {/* Subtle grid wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Core glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 20%, rgba(0,194,209,0.18) 0%, transparent 60%), radial-gradient(40% 40% at 10% 80%, rgba(0,194,209,0.08) 0%, transparent 60%)",
        }}
      />
      <Container width="wide" className="relative">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-data"
          />
          <Eyebrow tone="data">Investor room · v1</Eyebrow>
        </div>
        <H1
          as="h1"
          className="mt-8 max-w-4xl text-white"
        >
          <span id="investor-hero-heading">
            We don't sell supplements.
            <br className="hidden md:block" />
            <span className="text-data">We sell a body understood.</span>
          </span>
        </H1>
        <Lede className="mt-8 max-w-2xl text-white/85">
          Aissisted is the operating intelligence for one person's body. Labs
          in. Wearables in. A protocol that adapts. Pressed, packed, and
          shipped every thirty days. The longer you're in, the sharper the
          system gets.
        </Lede>

        <div className="mt-12 flex flex-col md:flex-row md:items-center gap-6">
          <AskAffordance
            tone="inverse"
            label="Walk me through the thesis"
            question="Give me the thesis in two minutes — the shift, the wedge, and why now."
          />
          <JeffreySystem className="text-white/50">
            ⌘K · open the Jeffrey console anywhere on this page
          </JeffreySystem>
        </div>

        {/* Anchor nav for chapters */}
        <nav
          aria-label="Investor chapters"
          className="mt-16 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-8"
        >
          {CHAPTERS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              className={cn(
                "font-system text-[11px] uppercase tracking-[0.16em]",
                "text-white/60 hover:text-white transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--brand-midnight)]",
              )}
            >
              {c.label}
            </a>
          ))}
        </nav>
      </Container>
    </section>
  );
}

const CHAPTERS = [
  { href: "#chapter-thesis", label: "01 · Thesis" },
  { href: "#chapter-product", label: "02 · Product" },
  { href: "#chapter-model", label: "03 · Model" },
  { href: "#chapter-comparables", label: "04 · Comparables" },
  { href: "#chapter-projections", label: "05 · Projections" },
  { href: "#chapter-moat", label: "06 · Moat" },
  { href: "#chapter-roadmap", label: "07 · Roadmap" },
  { href: "#chapter-next", label: "08 · The next step" },
];
