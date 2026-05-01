import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Pill } from "@/components/pill";
import { RallyCry } from "@/components/rally-cry";
import {
  Body,
  H2,
  H3,
  JeffreyText,
  JeffreySystem,
  Lede,
  UILabel,
} from "@/components/typography";

/**
 * Home — M3 Phase 1.
 *
 * Hero · three Formula teaser cards · How-it-works teaser · Pricing teaser
 * with the canonical freemium line · Jeffrey transcript-only sample · Footer
 * (carried by the (public) layout shell).
 *
 * Brand canon (CEO arbitration, 2026-04-30):
 *   · Rally cry rendered ONCE, here in the hero. Footer is muted by the
 *     shell layout — there is no second rally cry on this page.
 *   · Brand red appears on: "Understood." inside RallyCry, the primary
 *     CTA, and a single Pill on the recommended pricing tier. That is
 *     the entire 2% signal allocation for this page.
 *   · Jeffrey on the public surface is transcript-only. No live console.
 *   · Canonical freemium line: "Start with the free baseline. Upgrade
 *     when you're ready for your formula." — used verbatim, no variants.
 *
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS
 * across hero, formula cards, how-it-works, pricing teaser, and transcript.
 */

export const metadata: Metadata = {
  title: "aissisted — Your Body. Understood.",
  description:
    "A formula built from your data. Refined by the science we trust. Yours alone.",
};

const CANONICAL_FREEMIUM =
  "Start with the free baseline. Upgrade when you're ready for your formula.";

const FORMULAS = [
  {
    href: "/morning",
    eyebrow: "Morning",
    title: "Energy. Focus. A clean start.",
    body:
      "Designed for the first hours. Adjusted as your sleep, training load, and bloodwork tell us to.",
  },
  {
    href: "/day",
    eyebrow: "Day",
    title: "Sustain through the load.",
    body:
      "Designed for focus through cognitive load and recovery between sessions. Steady through what the day demands.",
  },
  {
    href: "/night",
    eyebrow: "Night",
    title: "Sleep, repair, and the quiet work.",
    body:
      "Designed for depth of sleep and parasympathetic ease. Adjusted as your recovery scores move.",
  },
] as const;

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

export default function HomePage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <FormulaTeasers />
      <HowItWorksTeaser />
      <PricingTeaser />
      <JeffreySample />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate pt-20 pb-24 md:pt-28 md:pb-32"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>Built for one body</Eyebrow>

          <div className="mt-6">
            <RallyCry size="hero" />
          </div>

          <Lede className="mt-8 max-w-2xl">
            A formula built from your data. Refined by the science we
            trust. Yours alone.
          </Lede>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request-access" className={PRIMARY_CTA}>
              Request access
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

function FormulaTeasers() {
  return (
    <section
      aria-labelledby="formulas-heading"
      id="formulas"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">The system</Eyebrow>
          <H2 id="formulas-heading" className="mt-4">
            Three formulas. One system.
          </H2>
          <Lede className="mt-6">
            Morning to start, Day to sustain, Night to repair. Each one
            shaped to what your body asked for this week.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FORMULAS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={cn(
                "group block",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-data focus-visible:ring-offset-4"
              )}
            >
              <Card hover padding="lg" className="h-full">
                <UILabel>{f.eyebrow}</UILabel>
                <H3 className="mt-3">{f.title}</H3>
                <Body className="mt-4">{f.body}</Body>
                <p
                  className={cn(
                    "mt-8 font-system text-xs uppercase tracking-[0.16em]",
                    "text-ink/60 group-hover:text-ink transition-colors"
                  )}
                >
                  Read the {f.eyebrow.toLowerCase()} formula →
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorksTeaser() {
  return (
    <section
      aria-labelledby="how-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">How it works</Eyebrow>
            <H2 id="how-heading" className="mt-4">
              Signal. Interpretation. Formula. Evolution.
            </H2>
          </div>

          <div>
            <Body>
              Your wearable. Your bloodwork. Your habits. Read against the
              science we trust. Designed into a precise formula. Refined
              every week as your body changes.
            </Body>

            <ol className="mt-8 grid gap-5">
              {[
                {
                  step: "01",
                  label: "Signal",
                  body: "Your wearable, your bloodwork, your habits. The body is already speaking.",
                },
                {
                  step: "02",
                  label: "Interpretation",
                  body: "Read against peer-reviewed evidence and clinical reference ranges. Nothing decorative.",
                },
                {
                  step: "03",
                  label: "Formula",
                  body: "A precise formula. Designed for your body, in this season, under these conditions.",
                },
                {
                  step: "04",
                  label: "Evolution",
                  body: "You re-test. The formula evolves. The system learns you, week by week.",
                },
              ].map((row) => (
                <li
                  key={row.step}
                  className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-5"
                >
                  <span className="font-system text-xs tracking-[0.08em] text-ink/50">
                    {row.step}
                  </span>
                  <span className="font-system text-xs uppercase tracking-[0.18em] text-ink">
                    {row.label}
                  </span>
                  <span className="text-sm text-ink/75 md:text-base">
                    {row.body}
                  </span>
                </li>
              ))}
            </ol>

            <Divider className="mt-10" />

            <div className="mt-8">
              <Link href="/how-it-works" className={SECONDARY_CTA}>
                Read the full walkthrough
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section
      aria-labelledby="pricing-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Pricing</Eyebrow>
          <H2 id="pricing-heading" className="mt-4">
            Free to design. Paid only when a formula ships.
          </H2>
          <Lede className="mt-6">{CANONICAL_FREEMIUM}</Lede>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <PriceCard tier="One Formula" price="$69" cadence="per month" />
          <PriceCard
            tier="Two Formulas"
            price="$99"
            cadence="per month"
            recommended
          />
          <PriceCard tier="All three" price="$149" cadence="per month" />
        </div>

        <p className="mt-8 max-w-2xl text-sm text-ink/65">
          Every tier includes adaptive re-formulation, Jeffrey, lab-import,
          wearable sync, and shipping. The free baseline covers the
          conversation, the lab read, and your first protocol design.
        </p>

        <div className="mt-10">
          <Link href="/pricing" className={SECONDARY_CTA}>
            See pricing in full
          </Link>
        </div>
      </Container>
    </section>
  );
}

function PriceCard({
  tier,
  price,
  cadence,
  recommended = false,
}: {
  tier: string;
  price: string;
  cadence: string;
  recommended?: boolean;
}) {
  return (
    <Card
      variant={recommended ? "default" : "flat"}
      padding="lg"
      className="h-full"
    >
      <div className="flex items-center justify-between">
        <UILabel>{tier}</UILabel>
        {recommended && <Pill tone="brand">Most chosen</Pill>}
      </div>
      <p className="mt-6 font-display text-5xl font-bold tracking-[-0.02em] text-ink">
        {price}
      </p>
      <p className="mt-2 font-system text-xs uppercase tracking-[0.16em] text-ink/60">
        {cadence}
      </p>
    </Card>
  );
}

function JeffreySample() {
  return (
    <section
      aria-labelledby="jeffrey-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">Jeffrey</Eyebrow>
            <H2 id="jeffrey-heading" className="mt-4">
              The voice of the system.
            </H2>
            <Lede className="mt-6">
              Calm. Precise. Quiet by default. He explains what your formula
              does, why it changed, and what your data is saying.
            </Lede>
            <p className="mt-6 text-sm text-ink/65">
              A short transcript. The live console lives behind your
              invitation.
            </p>
            <div className="mt-8">
              <Link href="/jeffrey" className={SECONDARY_CTA}>
                Meet Jeffrey
              </Link>
            </div>
          </div>

          <Card variant="flat" padding="lg">
            <div className="mb-5 flex items-center gap-3">
              <Pill tone="signal">Transcript</Pill>
              <JeffreySystem>Tuesday · 06:48</JeffreySystem>
            </div>

            <div className="grid gap-5">
              <Turn speaker="jeffrey">
                Your morning formula shifted today. Magnesium glycinate
                down 100mg, ashwagandha out for the week.
              </Turn>
              <Turn speaker="you">Why?</Turn>
              <Turn speaker="jeffrey">
                Your sleep latency improved seven nights in a row, and your
                morning HRV is back inside your usual band. The dose was
                earning its place; it stopped earning it. If it slips, we
                put it back — adjustments are evidence, not commitment.
              </Turn>
              <Turn speaker="you">Understood.</Turn>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

function Turn({
  speaker,
  children,
}: {
  speaker: "jeffrey" | "you";
  children: React.ReactNode;
}) {
  const label = speaker === "jeffrey" ? "Jeffrey" : "You";
  const labelColor = speaker === "jeffrey" ? "text-ink/70" : "text-ink/40";
  return (
    <div>
      <p
        className={cn(
          "font-system text-[11px] uppercase tracking-[0.18em] mb-2",
          labelColor
        )}
      >
        {label}
      </p>
      <JeffreyText>{children}</JeffreyText>
    </div>
  );
}
