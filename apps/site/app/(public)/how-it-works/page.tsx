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
 * How it works — M3 Phase 4.
 *
 * Trust through clarity. Architecture A walkthrough — input → normalization →
 * rules → AI personalization → recommendation → memory. Plain language. No
 * jargon escalation. Closing CTA → /pricing.
 *
 * Brand canon:
 *   · One brand-red beat per page — the hero <Eyebrow> default tone="brand"
 *     plus the closing PRIMARY_CTA. Step cards stay neutral.
 *   · Canonical freemium phrasing in the closing block.
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 *   · 0 medical claims — descriptive language only ("reads", "watches",
 *     "shapes a recommendation"); never "treats", "fixes", "cures".
 */

export const metadata: Metadata = {
  title: { absolute: "How it works — aissisted" },
  description:
    "Six layers from your data to your formula — input, normalization, rules, AI personalization, recommendation, memory.",
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

type Step = {
  index: string;
  title: string;
  oneLine: string;
  body: string[];
  reads: string[];
};

const STEPS: Step[] = [
  {
    index: "01",
    title: "Input layer",
    oneLine: "Your data, gathered without ceremony.",
    body: [
      "Aissisted reads the signals you already produce — wrist data from your wearable, lab panels you already pay for, and the small cues you'd say out loud if Jeffrey asked. Nothing here is theoretical. We don't ask you to wear a new device, swallow a sensor, or fill out a 200-question intake.",
      "What comes in: heart rate variability, sleep architecture, daily activity, recovery scores, lab biomarkers when you have them, and the short conversational notes you give Jeffrey on your own pace.",
    ],
    reads: ["Wearable", "Lab panels", "Voice notes"],
  },
  {
    index: "02",
    title: "Normalization",
    oneLine: "Different sources, one shared language.",
    body: [
      "Two devices rarely agree on the same number. A WHOOP recovery score, an Oura readiness, an Apple Health sleep stage — same biology, different vocabularies. Normalization is the layer that translates each source into one shared internal grammar so the rest of the system can read your day without flinching at the source.",
      "Practically: timestamps line up to your local timezone, units convert (mg/dL ↔ mmol/L on glucose, ng/mL on hormones), missing values get marked as missing rather than averaged into nonsense, and outliers get held for a beat instead of changing your formula on the strength of one weird night.",
    ],
    reads: ["Unit conversion", "Time-aligned", "Outlier holds"],
  },
  {
    index: "03",
    title: "Rules engine",
    oneLine: "The hard floor — what no formula crosses.",
    body: [
      "Before the AI shapes anything, a deterministic rules layer reads the normalized data against a set of safety and interaction guards. Medications you've told us about. Allergies. Pregnancy and breastfeeding states. Maximum daily totals on every active ingredient. Stack-level interactions between Morning, Day, and Night.",
      "If a recommendation would cross a rule, it's removed before the AI ever sees it as an option. The rules engine isn't where the personalization lives — it's where the floor lives. Personalization happens above it.",
    ],
    reads: ["Medication checks", "Interaction guards", "Daily ceilings"],
  },
  {
    index: "04",
    title: "AI personalization",
    oneLine: "The shape of the formula, drawn for one body.",
    body: [
      "Above the rules floor, the personalization layer reads the same normalized signals and asks a different question: of the ingredients that are safe for you, which combination makes the most sense for what your body is doing this week? This is where the formula stops being a category and starts being yours.",
      "The model considers your trends — not single readings — and weighs each ingredient against the evidence class it falls in. Strong evidence ingredients carry more pull. Emerging-evidence ingredients show up at lower doses, when the trend supports it, and never as the structural backbone of a formula.",
    ],
    reads: ["Trend-weighted", "Evidence-tiered", "Whole-day shape"],
  },
  {
    index: "05",
    title: "Recommendation",
    oneLine: "The actual formula, written for the day.",
    body: [
      "The recommendation engine takes the personalized shape from the layer above and renders it into a manufacturable formula. Specific ingredients, specific doses, the order they sit in across Morning, Day, and Night. This is the layer that produces the bottle on your counter and the explanation alongside it.",
      "Every recommendation arrives with the why — which signal moved, which evidence class the choice sits in, and what the formula will adjust if the trend changes next week.",
    ],
    reads: ["Specific doses", "Time-of-day split", "Reasoning attached"],
  },
  {
    index: "06",
    title: "Memory layer",
    oneLine: "The system that remembers what worked.",
    body: [
      "Memory is what separates a formula that adapts from a formula that just changes. Each cycle, the system records what shifted — sleep latency dropped, HRV widened, energy notes leaned brighter — and ties the change back to the formula that was running. Over months, the memory layer narrows the search space toward what your body has actually answered to.",
      "Memory is also the layer Jeffrey reads when you ask the small questions. It's the reason you don't have to re-explain yourself.",
    ],
    reads: ["Outcome tracking", "Formula attribution", "Long-term shape"],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <Stack />
      <FloorVsCeiling />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="how-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>How it works</Eyebrow>

          <H1 id="how-hero-heading" className="mt-6">
            How aissisted thinks.
          </H1>

          <Lede className="mt-8 max-w-2xl">
            Six layers between the data on your wrist and the formula on your
            counter. None of them are mysterious. All of them are accountable.
          </Lede>

          <p className="mt-4 max-w-2xl text-base text-ink/65 md:text-lg">
            Read top to bottom. Each layer hands the next one a slightly clearer
            version of you, and the formula is what comes out the other end.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className={SECONDARY_CTA}>
              See pricing
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

function Stack() {
  return (
    <section
      aria-labelledby="how-stack-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">The stack</Eyebrow>
          <H2 id="how-stack-heading" className="mt-4">
            Six layers, from your data to your day.
          </H2>
          <Lede className="mt-6">
            Each step is a job, not a black box. The order matters: input feeds
            normalization, normalization feeds rules, rules feed AI, AI feeds
            recommendation, recommendation feeds memory — and memory feeds back
            into input on the next cycle.
          </Lede>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.index}>
              <StepCard step={step} />
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <Card variant="flat" padding="lg" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <UILabel>{step.index}</UILabel>
        <UILabel className="text-ink/55">Layer</UILabel>
      </div>

      <H3 className="mt-6 text-2xl md:text-3xl">{step.title}</H3>

      <p className="mt-3 font-display text-lg font-medium tracking-[-0.005em] text-ink/85 md:text-xl">
        {step.oneLine}
      </p>

      <div className="mt-5 grid gap-3">
        {step.body.map((paragraph, i) => (
          <Body key={i} className="text-sm md:text-base">
            {paragraph}
          </Body>
        ))}
      </div>

      <div className="mt-8 flex-1" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {step.reads.map((tag) => (
          <Pill key={tag} tone="ink">
            {tag}
          </Pill>
        ))}
      </div>
    </Card>
  );
}

function FloorVsCeiling() {
  return (
    <section
      aria-labelledby="how-floor-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">Floor and ceiling</Eyebrow>
            <H2 id="how-floor-heading" className="mt-4">
              The rules are the floor. Personalization is the ceiling.
            </H2>
          </div>

          <div className="grid gap-5">
            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">The floor — deterministic</H3>
              <Body className="mt-4 text-sm md:text-base">
                The rules engine runs every time, on every recommendation, the
                same way. It doesn't have moods. Maximum daily totals, medication
                interactions, allergies, life-stage flags — these are
                pass/fail, and they run before any formula reaches you.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">The ceiling — personalized</H3>
              <Body className="mt-4 text-sm md:text-base">
                Above the floor, the AI layer reads what's safe for you and asks
                what's right for you. The shape of the formula — which
                ingredients, in what proportion, in which order across the day —
                is where the personalization actually lives.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">Memory closes the loop</H3>
              <Body className="mt-4 text-sm md:text-base">
                The next cycle is a different conversation than the one before
                it, because memory has read what changed. Sleep latency, HRV
                width, the small notes you gave Jeffrey — all of it returns to
                the input layer and re-enters the stack.
              </Body>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="how-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="how-cta-heading" className="mt-4">
            {CANONICAL_FREEMIUM}
          </H2>

          <Divider className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className={PRIMARY_CTA}>
              See pricing
            </Link>
            <Link href="/science" className={SECONDARY_CTA}>
              The science
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-sm text-ink/65">
            The free baseline is the read on your data and one shared formula
            recommendation. The paid tiers are where the formula starts shaping
            itself to you.
          </p>
        </div>
      </Container>
    </section>
  );
}
