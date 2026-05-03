import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Pill } from "@/components/pill";
import { Body, H1, H2, H3, Lede, UILabel } from "@/components/typography";

/**
 * Pricing — M3 Phase 3.
 *
 * Hero · four-tier card grid · honest comparison strip · FAQ · closing CTA.
 *
 * Brand canon (carried from Phase 1 / Phase 2):
 *   · Brand red is spent on: the hero <Eyebrow> (default tone="brand"), the
 *     "Most chosen" Pill on the Stack tier, the two PRIMARY_CTA links in
 *     hero and closing block. Inside the 2% signal budget.
 *   · Canonical freemium line — "Start with the free baseline. Upgrade when
 *     you're ready for your formula." — appears verbatim in the hero sub
 *     and the closing CTA heading. No variants.
 *   · Canonical pricing — $0 / $69 / $99 / $149 — defined here in TIERS,
 *     used nowhere else. The homepage teaser uses its own three-tier
 *     reduction (One / Two / All Three) and remains the entry point.
 *   · Compliance: the FDA-shaped FAQ answer classifies the formula as a
 *     dietary supplement and explicitly does not make medical claims.
 *     Every other answer stays inside descriptive, non-curative language.
 *
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS
 * across hero, tier cards, comparison strip, FAQ, and closing CTA.
 */

export const metadata: Metadata = {
  title: { absolute: "Pricing — aissisted" },
  description:
    "Free baseline. Personalized formula at $69. Two-formula stack at $99. Full Day at $149.",
};

const CANONICAL_FREEMIUM =
  "Start with the free baseline. Upgrade when you're ready for your formula.";

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

const TIER_CTA = cn(
  "inline-flex h-11 w-full items-center justify-center px-5",
  "font-system text-xs font-medium uppercase tracking-[0.18em]",
  "rounded-[2px]",
  "transition-[box-shadow,transform,filter] duration-150 ease-out",
  "motion-reduce:transition-none motion-reduce:transform-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2"
);

type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  recommended?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free baseline",
    price: "$0",
    cadence: "always",
    blurb: "An account, the read on your data, and one shared formula recommendation to start the conversation.",
    features: [
      "Account + dashboard",
      "Baseline insights from your wearable",
      "One shared formula recommendation",
      "Ships nothing — the read is yours",
    ],
    ctaLabel: "Start free",
    ctaHref: "/request-access",
  },
  {
    name: "Formula",
    price: "$69",
    cadence: "per month",
    blurb: "One personalized formula — Morning, Day, or Night — re-formulated monthly as your data moves.",
    features: [
      "One personalized formula of your choice",
      "Monthly re-formulation",
      "Adherence + outcome tracking",
      "Shipping included",
    ],
    ctaLabel: "Choose a formula",
    ctaHref: "/request-access",
  },
  {
    name: "Stack",
    price: "$99",
    cadence: "per month",
    blurb: "Two formulas, working as a pair. Re-formulated weekly. Lab integration on.",
    features: [
      "Two personalized formulas of your choice",
      "Weekly re-formulation",
      "Lab integration",
      "Adherence + outcome tracking",
      "Shipping included",
    ],
    ctaLabel: "Build your stack",
    ctaHref: "/request-access",
    recommended: true,
  },
  {
    name: "Full Day",
    price: "$149",
    cadence: "per month",
    blurb: "All three formulas. Re-formulated daily. Full lab and wearable integration. Jeffrey priority access.",
    features: [
      "Morning, Day, and Night",
      "Daily re-formulation",
      "Full lab + wearable integration",
      "Jeffrey priority access",
      "Shipping included",
    ],
    ctaLabel: "Go full day",
    ctaHref: "/request-access",
  },
];

type ComparisonRow = {
  label: string;
  values: [string, string, string, string]; // Free, Formula, Stack, Full Day
};

const COMPARISON: ComparisonRow[] = [
  {
    label: "Formulas included",
    values: ["One shared recommendation", "One of your choice", "Two of your choice", "All three"],
  },
  {
    label: "Personalization frequency",
    values: ["Baseline read only", "Monthly", "Weekly", "Daily"],
  },
  {
    label: "Lab integration",
    values: ["—", "—", "On", "On"],
  },
  {
    label: "Wearable integration",
    values: ["Read", "Read", "Read", "Read + closed loop"],
  },
  {
    label: "Jeffrey access",
    values: ["Standard", "Standard", "Standard", "Priority"],
  },
  {
    label: "Shipping",
    values: ["—", "Included", "Included", "Included"],
  },
];

type FAQ = {
  q: string;
  a: string;
};

const FAQS: FAQ[] = [
  {
    q: "Do I need labs to start?",
    a: "No. The free baseline begins with what your wearable already knows. Labs come in when you move to Stack or Full Day, and we accept the panel you already have or send you a kit.",
  },
  {
    q: "Can I switch tiers?",
    a: "Any time, in either direction. The formula adjusts to the cadence your tier supports — slower at Formula, weekly at Stack, daily at Full Day.",
  },
  {
    q: "What if I don't have a wearable yet?",
    a: "You can still start. The free baseline reads what you tell it, and the formula tier holds for a beat while you decide on a wrist. We'll point to the device that fits your life.",
  },
  {
    q: "Is shipping included?",
    a: "Included on Formula, Stack, and Full Day. The free baseline is the conversation, not the bottle — nothing ships.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No annual lock, no early-termination fee. Cancel from your account; the read on your data stays yours either way.",
  },
  {
    q: "Are these supplements FDA-approved?",
    a: "Aissisted formulas are dietary supplements, not drugs. They are not evaluated by the FDA and we don't make medical claims — nothing here treats, prevents, or addresses disease. Ingredients are sourced from cGMP-compliant facilities and the rationale for each one stays inside the published evidence we cite.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <Tiers />
      <Comparison />
      <FAQSection />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="pricing-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>Pricing</Eyebrow>

          <H1 id="pricing-hero-heading" className="mt-6">
            Pay for the part that's actually personalized.
          </H1>

          <Lede className="mt-8 max-w-2xl">{CANONICAL_FREEMIUM}</Lede>

          <p className="mt-4 max-w-2xl text-base text-ink/65 md:text-lg">
            The baseline read is free because it should be. The formula has a
            price because it's built for one body — yours.
          </p>

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

function Tiers() {
  return (
    <section
      aria-labelledby="pricing-tiers-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">The tiers</Eyebrow>
          <H2 id="pricing-tiers-heading" className="mt-4">
            Four ways in. Same system underneath.
          </H2>
          <Lede className="mt-6">
            The price reflects how often the formula re-shapes itself, and how
            much of your day it spans. Pick the cadence that matches the season
            you're in.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-system text-xs uppercase tracking-[0.14em] text-ink/55">
          Prices in USD. Tier moves take effect at the next re-formulation
          cycle.
        </p>
      </Container>
    </section>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  // All tier CTAs render in the same neutral chrome. The "Most chosen" Pill on
  // the recommended tier is the entire visual signal — adding a red CTA on
  // top would double-spend the brand-red budget on a single card.
  const ctaClasses = cn(
    TIER_CTA,
    "bg-white text-ink ring-1 ring-inset ring-ink/15",
    "hover:ring-ink/30 hover:-translate-y-px active:ring-ink/40 active:translate-y-0"
  );

  return (
    <Card
      variant={tier.recommended ? "default" : "flat"}
      padding="lg"
      className="flex h-full flex-col"
    >
      <div className="flex items-center justify-between gap-3">
        <UILabel>{tier.name}</UILabel>
        {tier.recommended && <Pill tone="brand">Most chosen</Pill>}
      </div>

      <p className="mt-6 font-display text-5xl font-bold tracking-[-0.02em] text-ink">
        {tier.price}
      </p>
      <p className="mt-2 font-system text-xs uppercase tracking-[0.16em] text-ink/60">
        {tier.cadence}
      </p>

      <Body className="mt-5 text-sm md:text-base">{tier.blurb}</Body>

      <ul className="mt-6 grid gap-2.5">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 text-sm text-ink/80 md:text-base"
          >
            <span
              aria-hidden="true"
              className="font-system text-xs tracking-[0.08em] text-ink/45"
            >
              ·
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex-1" />
      <Link href={tier.ctaHref} className={ctaClasses}>
        {tier.ctaLabel}
      </Link>
    </Card>
  );
}

function Comparison() {
  const columns = ["Free", "Formula", "Stack", "Full Day"] as const;

  return (
    <section
      aria-labelledby="pricing-comparison-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Side by side</Eyebrow>
          <H2 id="pricing-comparison-heading" className="mt-4">
            What changes as the cadence tightens.
          </H2>
          <Lede className="mt-6">
            A plain read of what you get at each tier. No checkmark theater —
            the language carries the difference.
          </Lede>
        </div>

        {/* Inline four-column matrix. Built from Container/Card vocabulary
            so we don't introduce a new primitive — ComparisonTable is the
            two-column "vs the alternative" shape and the wrong fit here. */}
        <div
          className="mt-12 w-full border-y border-ink/10 bg-surface"
          role="table"
          aria-label="Tier comparison: Free, Formula, Stack, Full Day"
        >
          <div
            className="hidden grid-cols-[1.1fr_repeat(4,1fr)] gap-6 border-b border-ink/10 px-2 py-4 md:grid"
            role="row"
          >
            <div role="columnheader" aria-hidden="true" />
            {columns.map((col) => (
              <div role="columnheader" key={col}>
                <span className="font-system text-xs font-medium uppercase tracking-[0.18em] text-ink/60">
                  {col}
                </span>
              </div>
            ))}
          </div>

          {COMPARISON.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "grid grid-cols-1 gap-3 px-2 py-6 md:grid-cols-[1.1fr_repeat(4,1fr)] md:gap-6",
                i !== COMPARISON.length - 1 && "border-b border-ink/5"
              )}
              role="row"
            >
              <div role="rowheader">
                <span className="font-system text-xs uppercase tracking-[0.18em] text-ink/60">
                  {row.label}
                </span>
              </div>
              {row.values.map((value, idx) => (
                <div
                  key={`${row.label}-${columns[idx]}`}
                  role="cell"
                  className="font-body text-sm text-ink/85 md:text-base"
                >
                  <span className="mr-2 font-system text-[11px] uppercase tracking-[0.16em] text-ink/45 md:hidden">
                    {columns[idx]}
                  </span>
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FAQSection() {
  return (
    <section
      aria-labelledby="pricing-faq-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">Common questions</Eyebrow>
            <H2 id="pricing-faq-heading" className="mt-4">
              The honest answers, before you ask.
            </H2>
          </div>

          <ul className="grid gap-5">
            {FAQS.map((faq) => (
              <li key={faq.q}>
                <Card variant="flat" padding="lg">
                  <H3 className="text-xl md:text-2xl lg:text-2xl">{faq.q}</H3>
                  <Body className="mt-4 text-sm md:text-base">{faq.a}</Body>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="pricing-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="pricing-cta-heading" className="mt-4">
            {CANONICAL_FREEMIUM}
          </H2>

          <Divider className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/request-access" className={PRIMARY_CTA}>
              Request access
            </Link>
            <Link href="/how-it-works" className={SECONDARY_CTA}>
              How it works
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-sm text-ink/65">
            The free baseline covers the conversation, the lab read, and your
            first protocol design. The formula ships when you're ready.
          </p>
        </div>
      </Container>

      {/* Quiet pill row — sibling Container, matches the Phase 2 closing
          rhythm. Nesting Containers double-applies px and max-w on md+. */}
      <Container width="wide" className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">Free baseline</Pill>
          <Pill tone="ink">Adaptive re-formulation</Pill>
          <Pill tone="ink">Lab + wearable in</Pill>
          <Pill tone="ink">Cancel anytime</Pill>
        </div>
      </Container>
    </section>
  );
}
