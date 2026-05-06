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
 * Science — M3 Phase 4.
 *
 * Investor-credibility surface. Biomarker categories we read, the evidence
 * framework we use to tier ingredients, and the honest framing that
 * personalization itself is the science. Closing CTA → /request-access.
 *
 * Compliance:
 *   · DO NOT cite specific papers verbatim — uses evidence-class language only
 *     ("well-studied", "emerging", "tiered"). Specific paper citations would
 *     pull legal review and lock the page into static claims.
 *   · 0 medical claims. Every biomarker copy uses descriptive verbs:
 *     "reflects", "tracks", "indicates" — never "treats", "fixes", "cures".
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 *   · Brand red is spent on the hero <Eyebrow> (default tone="brand") and
 *     the closing PRIMARY_CTA. Inside the 2% signal budget.
 */

export const metadata: Metadata = {
  title: { absolute: "Science — aissisted" },
  description:
    "Built on what's actually known — biomarker categories, evidence-tiered ingredients, and the longitudinal data that makes the personalization yours.",
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

type Biomarker = {
  category: string;
  reflects: string;
  body: string;
  signals: string[];
};

const BIOMARKERS: Biomarker[] = [
  {
    category: "Heart rate variability",
    reflects: "Autonomic recovery",
    body: "Variation in the small intervals between heartbeats reflects how well the parasympathetic side of your nervous system is doing its job. Trends matter more than any single morning. We read the seven-day envelope and watch how it widens or narrows.",
    signals: ["Recovery", "Stress load", "Sleep quality"],
  },
  {
    category: "Sleep architecture",
    reflects: "Restorative sleep depth",
    body: "Total time is the headline; the architecture is the story. Time in deep sleep, time in REM, the latency between lights-off and the first deep stage — each one tells a different part of the night. We read all three so the formula doesn't optimize for one number at the cost of the others.",
    signals: ["Deep sleep", "REM minutes", "Sleep latency"],
  },
  {
    category: "Glucose response",
    reflects: "Metabolic flexibility",
    body: "Standing fasting glucose is one number. The shape of your post-meal curve is a different one — how high it goes, how fast it returns, how often it does either. Glucose response is the layer that quietly informs the daytime side of the formula.",
    signals: ["Fasting baseline", "Post-meal curve", "Variability"],
  },
  {
    category: "Lipid panel",
    reflects: "Long-arc cardiovascular signal",
    body: "ApoB, LDL particle count, HDL, triglycerides. The lipid panel is a slow signal — it doesn't move on a single night and it shouldn't. We read it as a long-arc trend across quarters, and the formula adjusts ingredients with lipid-supportive evidence accordingly.",
    signals: ["ApoB", "LDL-P", "HDL", "Triglycerides"],
  },
  {
    category: "Hormone panel",
    reflects: "Endocrine state",
    body: "Testosterone, estradiol, cortisol diurnal curve, thyroid (TSH, free T3, free T4). The hormone read is where biological sex, life stage, and stress all converge. The rules engine treats hormone-active ingredients with extra weight; the personalization layer reads the trend and shapes accordingly.",
    signals: ["Diurnal cortisol", "Sex hormones", "Thyroid axis"],
  },
  {
    category: "Micronutrient panel",
    reflects: "Foundational sufficiency",
    body: "Vitamin D, B12, ferritin, magnesium (RBC), omega-3 index. These are the floor — when one of them runs low, almost no upstream optimization helps until the floor is patched. The formula treats sufficiency as the prerequisite, not the goal.",
    signals: ["Vitamin D", "B12", "Ferritin", "Magnesium", "Omega-3"],
  },
];

type EvidenceTier = {
  tier: string;
  label: string;
  body: string;
  weight: string;
};

const EVIDENCE_TIERS: EvidenceTier[] = [
  {
    tier: "Tier 1",
    label: "Well-studied",
    body: "Ingredients with multiple human RCTs, consistent effect sizes, and a body of evidence that has held up across independent groups. These form the structural backbone of every formula. They are the ingredients we are willing to put weight on.",
    weight: "Structural",
  },
  {
    tier: "Tier 2",
    label: "Supported",
    body: "Ingredients with smaller human studies, reasonable mechanistic support, and trials that point in the same direction without yet being definitive. They appear in formulas where the trend supports them, at doses inside the published range.",
    weight: "Supporting",
  },
  {
    tier: "Tier 3",
    label: "Emerging",
    body: "Ingredients with promising signal — early human work, strong mechanistic theory — but where the body of evidence is still forming. They appear at lower doses, only when the personalization layer has a specific reason, and never as the structural choice in a formula.",
    weight: "Adjunct",
  },
];

export default function SciencePage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <BiomarkerGrid />
      <EvidenceFramework />
      <PersonalizationIsTheScience />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="science-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>Science</Eyebrow>

          <H1 id="science-hero-heading" className="mt-6">
            Built on what's actually known.
          </H1>

          <Lede className="mt-8 max-w-2xl">
            We don't sell the strongest claim. We sell the one we can stand
            behind in a room full of biomarkers and the evidence that maps to
            them.
          </Lede>

          <p className="mt-4 max-w-2xl text-base text-ink/65 md:text-lg">
            Below: the biomarker categories aissisted reads, the framework we
            use to tier ingredients by evidence weight, and the honest reason
            personalization itself is the science.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/how-it-works" className={SECONDARY_CTA}>
              How it works
            </Link>
            <Link href="/pricing" className={SECONDARY_CTA}>
              See pricing
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function BiomarkerGrid() {
  return (
    <section
      aria-labelledby="science-biomarkers-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">What we read</Eyebrow>
          <H2 id="science-biomarkers-heading" className="mt-4">
            Six biomarker categories. One body underneath.
          </H2>
          <Lede className="mt-6">
            None of these are new. What's new is reading them together, on a
            cadence the body actually moves at, and shaping the formula to the
            trend rather than the headline number.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {BIOMARKERS.map((bio) => (
            <BiomarkerCard key={bio.category} bio={bio} />
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-system text-xs uppercase tracking-[0.14em] text-ink/55">
          Biomarker categories are descriptive. None of the language above
          claims to diagnose, treat, or address disease.
        </p>
      </Container>
    </section>
  );
}

function BiomarkerCard({ bio }: { bio: Biomarker }) {
  return (
    <Card variant="flat" padding="lg" className="flex h-full flex-col">
      <UILabel className="text-ink/55">Reflects</UILabel>
      <p className="mt-2 font-display text-base font-medium tracking-[-0.005em] text-ink/85 md:text-lg">
        {bio.reflects}
      </p>

      <H3 className="mt-6 text-2xl md:text-3xl">{bio.category}</H3>

      <Body className="mt-4 text-sm md:text-base">{bio.body}</Body>

      <div className="mt-8 flex-1" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {bio.signals.map((signal) => (
          <Pill key={signal} tone="ink">
            {signal}
          </Pill>
        ))}
      </div>
    </Card>
  );
}

function EvidenceFramework() {
  return (
    <section
      aria-labelledby="science-evidence-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">How we tier</Eyebrow>
          <H2 id="science-evidence-heading" className="mt-4">
            Three evidence tiers. One honest hierarchy.
          </H2>
          <Lede className="mt-6">
            Not every ingredient deserves the same weight in a formula. The
            tiering is how we say so out loud — structurally, in code, before
            the formula is written.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {EVIDENCE_TIERS.map((tier) => (
            <EvidenceCard key={tier.tier} tier={tier} />
          ))}
        </div>

        <p className="mt-10 max-w-2xl font-system text-xs uppercase tracking-[0.14em] text-ink/55">
          Tier assignments are reviewed quarterly as new human research
          publishes. An ingredient can move tier — usually upward.
        </p>
      </Container>
    </section>
  );
}

function EvidenceCard({ tier }: { tier: EvidenceTier }) {
  return (
    <Card variant="flat" padding="lg" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <UILabel>{tier.tier}</UILabel>
        <Pill tone="ink">{tier.weight}</Pill>
      </div>

      <H3 className="mt-6 text-2xl md:text-3xl">{tier.label}</H3>

      <Body className="mt-4 text-sm md:text-base">{tier.body}</Body>
    </Card>
  );
}

function PersonalizationIsTheScience() {
  return (
    <section
      aria-labelledby="science-personalization-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Eyebrow tone="muted">The honest framing</Eyebrow>
            <H2 id="science-personalization-heading" className="mt-4">
              Personalization is the science. Your data is the experiment.
            </H2>
          </div>

          <div className="grid gap-5">
            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">N-of-1 is the unit</H3>
              <Body className="mt-4 text-sm md:text-base">
                Population studies tell you what the average response looks
                like. Your body isn't the average. The longitudinal record of
                your biomarkers, your trends, and your responses to a given
                formula is the only experiment that matters at the level of
                what to put in your bottle next month.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">The trend is the unit</H3>
              <Body className="mt-4 text-sm md:text-base">
                One bad night, one outlier reading, one travel week — the
                personalization layer is built to ignore these and read the
                envelope around them. A formula that adjusts on the strength
                of one weird Tuesday is a formula that's optimizing for noise.
              </Body>
            </Card>

            <Card variant="flat" padding="lg">
              <H3 className="text-xl md:text-2xl">The honest ceiling</H3>
              <Body className="mt-4 text-sm md:text-base">
                Aissisted is a personalization system on top of a dietary
                supplement. It is not a drug, a diagnostic, or a substitute for
                medical care. The ceiling on what supplements can do is real,
                and we'd rather tell you that than oversell.
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
      aria-labelledby="science-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="science-cta-heading" className="mt-4">
            Read your own data. Decide from there.
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
            The free baseline is the read on your data. The formula starts
            shaping itself when you choose a tier.
          </p>
        </div>
      </Container>
    </section>
  );
}
