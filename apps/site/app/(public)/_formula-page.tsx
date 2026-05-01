import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Pill } from "@/components/pill";
import { Body, H1, H2, H3, Lede, UILabel } from "@/components/typography";

/**
 * FormulaPage — shared template for the three formula deep-dives
 * (/morning, /day, /night). M3 Phase 2.
 *
 * The three pages must read as siblings: same section rhythm, same component
 * vocabulary, only the content varies. This file owns the rhythm; the route
 * files own the content.
 *
 * Constraints carried in from the brief:
 *   · M2 primitives only (Heading roles, Body, Lede, UILabel, Card, Pill,
 *     Divider, Container, Eyebrow). No new component primitives.
 *   · Brand Bible v1.1 palette: signal red lives in the two CTA links and
 *     nowhere else on this page (2% of the 70/20/8/2 budget).
 *   · 0 forbidden words (lib/brand-rules.ts → FORBIDDEN_WORDS).
 *   · 0 medical claims — every ingredient rationale stays inside
 *     "supports / associated with / studied for". No verb stronger than that.
 *   · Briston Bold via var(--font-display), falling back to IBM Plex Sans
 *     Bold; the Heading components handle that wiring.
 *
 * The canonical freemium line is repeated verbatim across all three pages
 * by the closing CTA block — same as the homepage pricing teaser.
 */

const PRIMARY_CTA = cn(
  "inline-flex h-12 items-center justify-center px-6",
  "bg-brand text-white",
  "font-system text-xs font-medium uppercase tracking-[0.18em]",
  "rounded-[2px]",
  "transition-[filter,transform] duration-150 ease-out",
  "hover:brightness-110 hover:-translate-y-px active:brightness-95 active:translate-y-0",
  "motion-reduce:transition-none motion-reduce:transform-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
);

const SECONDARY_CTA = cn(
  "inline-flex h-12 items-center justify-center px-6",
  "bg-white text-ink ring-1 ring-inset ring-ink/15",
  "font-system text-xs font-medium uppercase tracking-[0.18em]",
  "rounded-[2px]",
  "transition-[box-shadow,transform] duration-150 ease-out",
  "hover:ring-ink/30 hover:-translate-y-px active:ring-ink/40 active:translate-y-0",
  "motion-reduce:transition-none motion-reduce:transform-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
);

const CANONICAL_FREEMIUM =
  "Start with the free baseline. Upgrade when you're ready for your formula.";

export type Ingredient = {
  /** Active name as it would appear on a label. */
  name: string;
  /** Starting dose label — e.g. "200 mg" or "3–5 g". */
  dose: string;
  /** One-to-two-sentence rationale. Compliance: supports / associated with / studied for. */
  rationale: string;
};

export type CrossLink = {
  href: "/morning" | "/day" | "/night";
  label: string;
  oneLiner: string;
};

export type FormulaContent = {
  slug: "morning" | "day" | "night";
  /** Time-of-day eyebrow — e.g. "Morning · 6–10 AM". */
  eyebrow: string;
  /** SEO h1 — single word formula name. */
  h1: string;
  /** Display promise paired with the h1 — e.g. "Wake into clarity." */
  promise: string;
  /** 2–3 sentences in butler cadence. */
  heroSub: string;
  biology: {
    heading: string;
    /** 2–3 paragraphs of butler-cadence prose. */
    paragraphs: string[];
    /** Single biomarker / system spotlight rendered as a quiet card. */
    spotlight?: { title: string; body: string };
  };
  ingredients: Ingredient[];
  /** 3 short personas. */
  builtFor: string[];
  /** The other two formulas, with one-liners describing the pairing. */
  pair: [CrossLink, CrossLink];
};

export function FormulaPage({ content }: { content: FormulaContent }) {
  return (
    <div className="bg-surface text-ink">
      <Hero content={content} />
      <Biology content={content} />
      <Ingredients content={content} />
      <BuiltFor content={content} />
      <PairRail content={content} />
      <ClosingCTA />
    </div>
  );
}

function Hero({ content }: { content: FormulaContent }) {
  const headingId = `${content.slug}-hero-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>{content.eyebrow}</Eyebrow>

          <H1 id={headingId} className="mt-6">
            {content.h1}
          </H1>

          <p
            className={cn(
              "mt-4 font-display font-bold",
              "text-3xl md:text-4xl lg:text-5xl",
              "tracking-[-0.01em] leading-[1.1]",
              "text-ink/85"
            )}
          >
            {content.promise}
          </p>

          <Lede className="mt-8 max-w-2xl">{content.heroSub}</Lede>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className={PRIMARY_CTA}>
              See pricing
            </Link>
            <Link href="/how-it-works" className={SECONDARY_CTA}>
              How it works
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Biology({ content }: { content: FormulaContent }) {
  const headingId = `${content.slug}-biology-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">Biology</Eyebrow>
            <H2 id={headingId} className="mt-4">
              {content.biology.heading}
            </H2>
          </div>

          <div>
            <div className="grid gap-6">
              {content.biology.paragraphs.map((p, i) => (
                <Body key={i}>{p}</Body>
              ))}
            </div>

            {content.biology.spotlight && (
              <Card variant="flat" padding="lg" className="mt-10">
                <UILabel>Spotlight</UILabel>
                <p className="mt-3 font-display text-xl font-semibold tracking-[-0.005em] text-ink md:text-2xl">
                  {content.biology.spotlight.title}
                </p>
                <Body className="mt-3">{content.biology.spotlight.body}</Body>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Ingredients({ content }: { content: FormulaContent }) {
  const headingId = `${content.slug}-ingredients-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">What's in it</Eyebrow>
          <H2 id={headingId} className="mt-4">
            Starting points, not endpoints.
          </H2>
          <Lede className="mt-6">
            A short list of the active components and why they earn a place.
            Doses below are a starting band — your formula refines from there.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.ingredients.map((ingredient) => (
            <Card
              key={ingredient.name}
              variant="flat"
              padding="lg"
              className="h-full"
            >
              <div className="flex items-start justify-between gap-4">
                <H3 className="text-xl md:text-2xl lg:text-2xl">
                  {ingredient.name}
                </H3>
              </div>
              <p className="mt-3 font-system text-xs uppercase tracking-[0.16em] text-ink/60">
                {ingredient.dose}
              </p>
              <Body className="mt-4 text-sm md:text-base">
                {ingredient.rationale}
              </Body>
            </Card>
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-system text-xs uppercase tracking-[0.14em] text-ink/55">
          Personalized dosing arrives from your data — these are starting
          points.
        </p>
      </Container>
    </section>
  );
}

function BuiltFor({ content }: { content: FormulaContent }) {
  const headingId = `${content.slug}-built-for-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">Built for</Eyebrow>
            <H2 id={headingId} className="mt-4">
              Who this formula answers to.
            </H2>
          </div>

          <ul className="grid gap-4">
            {content.builtFor.map((persona, i) => (
              <li key={i}>
                <Card variant="ghost" padding="md">
                  <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-5">
                    <span className="font-system text-xs tracking-[0.08em] text-ink/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base text-ink/85 md:text-lg">
                      {persona}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function PairRail({ content }: { content: FormulaContent }) {
  const headingId = `${content.slug}-pair-heading`;
  return (
    <section
      aria-labelledby={headingId}
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Pair this with</Eyebrow>
          <H2 id={headingId} className="mt-4">
            Three formulas. One system.
          </H2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {content.pair.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group block",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-data focus-visible:ring-offset-4"
              )}
            >
              <Card hover padding="lg" className="h-full">
                <UILabel>{link.label}</UILabel>
                <p className="mt-4 font-display text-2xl font-semibold tracking-[-0.005em] text-ink md:text-3xl">
                  {link.oneLiner}
                </p>
                <p
                  className={cn(
                    "mt-8 font-system text-xs uppercase tracking-[0.16em]",
                    "text-ink/60 group-hover:text-ink transition-colors"
                  )}
                >
                  Read the {link.label.toLowerCase()} formula →
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="formula-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="formula-cta-heading" className="mt-4">
            {CANONICAL_FREEMIUM}
          </H2>

          <Divider className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request-access" className={PRIMARY_CTA}>
              Request access
            </Link>
            <Link href="/pricing" className={SECONDARY_CTA}>
              See pricing
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-sm text-ink/65">
            The free baseline covers the conversation, the lab read, and your
            first protocol design. The formula ships when you're ready.
          </p>
        </div>
      </Container>

      {/* Quiet pill row — keeps the closing rhythm matched to the homepage
          without spending the brand-red budget a second time. */}
      <Container width="wide" className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">Free baseline</Pill>
          <Pill tone="ink">Adaptive re-formulation</Pill>
          <Pill tone="ink">Lab + wearable in</Pill>
          <Pill tone="ink">Shipping included</Pill>
        </div>
      </Container>
    </section>
  );
}
