import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Body, H1, H2, H3, Lede, UILabel } from "@/components/typography";

/**
 * About — M3 Phase 4.
 *
 * Brief, not a treatise. Mission · the gap aissisted closes · how we work
 * (data-first, personalization is the product, slow-build trust). No team
 * photos — we don't have them. Closing CTA → /request-access.
 *
 * Brand canon:
 *   · Brand red on hero <Eyebrow> (default tone="brand") and the closing
 *     PRIMARY_CTA. Inside the 2% signal budget.
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 *   · Voice — butler cadence, calm dial-up, no marketing escalation.
 */

export const metadata: Metadata = {
  title: { absolute: "About — aissisted" },
  description:
    "The gap aissisted closes, how we work, and why personalization is the product — not the marketing.",
};

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

type Principle = {
  label: string;
  title: string;
  body: string;
};

const PRINCIPLES: Principle[] = [
  {
    label: "Principle 01",
    title: "Data first, copy second.",
    body: "The personalization layer is the product. The marketing language is downstream of what the data actually says. When the two disagree, the data wins and the copy gets rewritten.",
  },
  {
    label: "Principle 02",
    title: "Personalization is the product.",
    body: "We don't sell a stronger pill. We sell a formula that's built around the body it's going into and that adjusts at the cadence the body actually moves at. The pill is a delivery mechanism for the personalization.",
  },
  {
    label: "Principle 03",
    title: "Slow-build trust.",
    body: "Trust is earned in the moments where we choose accuracy over hype — the FDA disclaimer, the HIPAA framing, the willingness to say a tier doesn't fit yet. We'd rather lose the sale than oversell.",
  },
  {
    label: "Principle 04",
    title: "The honest ceiling.",
    body: "Aissisted is a personalization system on top of a dietary supplement. It is not a drug, a diagnostic, or a substitute for medical care. We say so out loud, in the places it matters, every time.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <WhyThisExists />
      <HowWeWork />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>About</Eyebrow>

          <H1 id="about-hero-heading" className="mt-6">
            Personalization, taken seriously.
          </H1>

          <Lede className="mt-8 max-w-2xl">
            Aissisted reads the data your body is already producing and shapes
            a daily formula around the answer. The product is the
            personalization. Everything else is delivery.
          </Lede>

          <p className="mt-4 max-w-2xl text-base text-ink/65 md:text-lg">
            We're a small team building a system we'd put on our own kitchen
            counter. The page below explains why it didn't already exist and
            how we're going about building it.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/how-it-works" className={SECONDARY_CTA}>
              How it works
            </Link>
            <Link href="/science" className={SECONDARY_CTA}>
              The science
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhyThisExists() {
  return (
    <section
      aria-labelledby="about-why-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">The gap</Eyebrow>
            <H2 id="about-why-heading" className="mt-4">
              The gap aissisted closes.
            </H2>
          </div>

          <div className="grid gap-5">
            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">
                The shelf is generic.
              </H3>
              <Body className="mt-4 text-sm md:text-base">
                Every supplement on the shelf is one shape, sold to many
                bodies. Even when the ingredients are good, the dose was
                chosen for the average person. You aren't average — your
                wearable already knows it, and your bottle should too.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">
                The data is yours, but it's not being read.
              </H3>
              <Body className="mt-4 text-sm md:text-base">
                A modern wearable produces enough signal to shape a formula
                with. So does a standard lab panel. The data already exists.
                What hasn't existed is a system that reads all of it together
                and writes a daily formula on the strength of what it sees.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">
                The personalization layer was the missing piece.
              </H3>
              <Body className="mt-4 text-sm md:text-base">
                Aissisted is that layer. It sits on top of clean ingredients
                and an evidence framework, and it does the one job nobody
                else has been willing to do at scale — read the body in
                front of it and write the formula for that body, not the
                category.
              </Body>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HowWeWork() {
  return (
    <section
      aria-labelledby="about-how-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">How we work</Eyebrow>
          <H2 id="about-how-heading" className="mt-4">
            Four principles. One discipline.
          </H2>
          <Lede className="mt-6">
            These are the principles we use when the call is hard — when the
            copy wants to be louder than the data, when a feature is fun but
            wouldn't help you, when the easy answer would oversell.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <PrincipleCard key={p.label} principle={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function PrincipleCard({ principle }: { principle: Principle }) {
  return (
    <Card variant="flat" padding="lg" className="flex h-full flex-col">
      <UILabel className="text-ink/55">{principle.label}</UILabel>
      <H3 className="mt-4 text-2xl md:text-3xl">{principle.title}</H3>
      <Body className="mt-5 text-sm md:text-base">{principle.body}</Body>
    </Card>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="about-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="about-cta-heading" className="mt-4">
            Read your own data first. Decide from there.
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
            Request access opens a short conversation. We answer questions and
            we don't add you to a list you'll need to dig out of later.
          </p>
        </div>
      </Container>
    </section>
  );
}
