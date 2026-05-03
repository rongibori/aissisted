import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Card } from "@/components/card";
import { Divider } from "@/components/divider";
import { Pill } from "@/components/pill";
import {
  Body,
  H1,
  H2,
  H3,
  JeffreyText,
  JeffreySystem,
  Lede,
  UILabel,
} from "@/components/typography";

/**
 * Jeffrey — M3 Phase 3.
 *
 * Public surface for the concierge layer. Transcript-only: the live console
 * lives behind the invitation. This page is brochure-grade — no audio, no
 * TTS, no API calls. Everything renders as static markup.
 *
 * CEO arbitration carried in:
 *   · Public risk doesn't earn the upside of a live console. Static sample
 *     transcript only.
 *   · Brand red is spent on: hero <Eyebrow> (default tone="brand") and the
 *     two PRIMARY_CTA links in hero and closing block. Inside the 2% budget.
 *   · Canonical freemium line in the closing CTA, verbatim with /pricing
 *     and the formula pages.
 *   · Sample transcript reads in butler cadence — explanatory, declarative,
 *     never preachy. Each Jeffrey turn carries the voice signature that
 *     ships inside the product.
 *
 * Forbidden-words audit: 0 hits against lib/brand-rules.ts → FORBIDDEN_WORDS
 * across hero, capability cards, transcript, surfaces section, and closing.
 */

export const metadata: Metadata = {
  title: { absolute: "Jeffrey — aissisted" },
  description:
    "Your concierge for the formula. He reads your data, reasons about your day, and surfaces what to do.",
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

type Capability = {
  label: string;
  title: string;
  body: string;
};

const CAPABILITIES: Capability[] = [
  {
    label: "Reads your signal",
    title: "Wearables, labs, voice.",
    body: "He pulls from the same instruments you already use — wrist, blood, the things you tell him. Nothing about your body is treated as a second-class input.",
  },
  {
    label: "Reasons in context",
    title: "Knows the formula you're on.",
    body: "He carries the week with him: your training load, your last lab, the formula that shipped on Monday. Recommendations land inside that context, not outside it.",
  },
  {
    label: "Speaks plainly",
    title: "Recommendations with reasoning.",
    body: "Every suggestion comes with the read behind it. Never a directive without the why. If a number moves, he tells you which one and what changed.",
  },
];

type Turn = {
  speaker: "you" | "jeffrey";
  text: string;
};

const TRANSCRIPT: Turn[] = [
  {
    speaker: "you",
    text: "Slept badly. What should I do today?",
  },
  {
    speaker: "jeffrey",
    text: "Your HRV is off about 18% from your baseline, and you fell short on deep sleep by roughly forty minutes. I'd hold the hard training and pull tonight's Night formula thirty minutes earlier. Want me to mark the calendar?",
  },
  {
    speaker: "you",
    text: "Skip the workout?",
  },
  {
    speaker: "jeffrey",
    text: "Move it. A Z2 ride or a long walk gives your nervous system the day it's asking for. Save the intensity for tomorrow, when you're better resourced.",
  },
  {
    speaker: "you",
    text: "And caffeine?",
  },
  {
    speaker: "jeffrey",
    text: "Cap it at 200 mg before noon. Anything later cuts into the recovery you need tonight, and tonight is where this day actually gets fixed.",
  },
  {
    speaker: "you",
    text: "Do it.",
  },
  {
    speaker: "jeffrey",
    text: "Done. Calendar updated, Night formula timing pulled in, and a Z2 suggestion sat where the lift was. We'll read the morning and decide on tomorrow.",
  },
];

type Surface = {
  label: string;
  title: string;
  body: string;
};

const SURFACES: Surface[] = [
  {
    label: "Voice-first",
    title: "On the wrist or the phone.",
    body: "Press, ask, listen. Jeffrey answers in the same voice you'd want from a calm advisor — no novelty, no theatrics. The fastest path between a question and a read.",
  },
  {
    label: "On the dashboard",
    title: "Always on the data.",
    body: "Inside your account, Jeffrey lives where your numbers live. He annotates the chart, flags the shift, and explains the change in the formula the moment it happens.",
  },
];

export default function JeffreyPage() {
  return (
    <div className="bg-surface text-ink">
      <Hero />
      <Capabilities />
      <Transcript />
      <Surfaces />
      <ClosingCTA />
    </div>
  );
}

function Hero() {
  return (
    <section
      aria-labelledby="jeffrey-hero-heading"
      className="relative isolate pt-20 pb-20 md:pt-28 md:pb-28"
    >
      <Container width="wide">
        <div className="max-w-4xl">
          <Eyebrow>Jeffrey</Eyebrow>

          <H1 id="jeffrey-hero-heading" className="mt-6">
            Your concierge, listening.
          </H1>

          <p
            className={cn(
              "mt-4 font-display font-bold",
              "text-3xl md:text-4xl lg:text-5xl",
              "tracking-[-0.01em] leading-[1.1]",
              "text-ink/85"
            )}
          >
            The voice of the system.
          </p>

          <Lede className="mt-8 max-w-2xl">
            Jeffrey is the conversational layer inside the product. He reads
            your wearable, your bloodwork, the formula you're on. He reasons
            about the day in front of you and surfaces what to do. Concierge,
            not bot.
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

function Capabilities() {
  return (
    <section
      aria-labelledby="jeffrey-capabilities-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">What he does</Eyebrow>
          <H2 id="jeffrey-capabilities-heading" className="mt-4">
            Three jobs. Performed quietly.
          </H2>
          <Lede className="mt-6">
            Jeffrey isn't a chatbot wearing a uniform. He's a small set of
            jobs done with care, every day, against the only body he was hired
            to read — yours.
          </Lede>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CAPABILITIES.map((cap) => (
            <Card key={cap.label} variant="flat" padding="lg" className="h-full">
              <UILabel>{cap.label}</UILabel>
              <H3 className="mt-3 text-2xl md:text-2xl lg:text-2xl">
                {cap.title}
              </H3>
              <Body className="mt-4 text-sm md:text-base">{cap.body}</Body>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Transcript() {
  return (
    <section
      aria-labelledby="jeffrey-transcript-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">A morning, transcribed</Eyebrow>
          <H2 id="jeffrey-transcript-heading" className="mt-4">
            What a real exchange sounds like.
          </H2>
          <Lede className="mt-6">
            One morning, after a poor night. The shape of how Jeffrey holds
            the day — short questions, grounded answers, the formula moving
            in the background as the conversation moves in the foreground.
          </Lede>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <Pill tone="signal">Transcript</Pill>
            <p className="mt-5 max-w-sm text-sm text-ink/65">
              Static sample, redrawn from a real exchange. The live experience
              lives inside your account.
            </p>
            <JeffreySystem className="mt-6 block">
              Tuesday · 06:48 · Morning
            </JeffreySystem>
          </div>

          <Card variant="flat" padding="lg">
            <ul className="grid gap-7">
              {TRANSCRIPT.map((turn, i) => (
                <li key={i}>
                  <TurnView turn={turn} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <p className="mt-8 max-w-2xl font-system text-xs uppercase tracking-[0.14em] text-ink/55">
          Jeffrey is in private beta. The live experience lives inside your
          account.
        </p>
      </Container>
    </section>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  const isJeffrey = turn.speaker === "jeffrey";
  const label = isJeffrey ? "Jeffrey" : "You";
  const labelColor = isJeffrey ? "text-ink/70" : "text-ink/40";
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
      <JeffreyText className={isJeffrey ? "" : "text-ink/75"}>
        {turn.text}
      </JeffreyText>
    </div>
  );
}

function Surfaces() {
  return (
    <section
      aria-labelledby="jeffrey-surfaces-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Where he lives</Eyebrow>
          <H2 id="jeffrey-surfaces-heading" className="mt-4">
            Two surfaces. One concierge.
          </H2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {SURFACES.map((s) => (
            <Card key={s.label} variant="flat" padding="lg" className="h-full">
              <UILabel>{s.label}</UILabel>
              <H3 className="mt-3 text-2xl md:text-3xl lg:text-3xl">
                {s.title}
              </H3>
              <Body className="mt-4 text-sm md:text-base">{s.body}</Body>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section
      aria-labelledby="jeffrey-cta-heading"
      className="border-t border-ink/5 py-20 md:py-28"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Ready when you are</Eyebrow>
          <H2 id="jeffrey-cta-heading" className="mt-4">
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
            The free baseline opens the conversation with Jeffrey on your
            data. The formula ships when you're ready.
          </p>
        </div>
      </Container>

      {/* Quiet pill row — sibling Container, matches the Phase 2 closing
          rhythm. Nesting Containers double-applies px and max-w on md+. */}
      <Container width="wide" className="mt-12">
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="ink">Voice-first</Pill>
          <Pill tone="ink">On every dashboard</Pill>
          <Pill tone="ink">Reads your data</Pill>
          <Pill tone="ink">Private by design</Pill>
        </div>
      </Container>
    </section>
  );
}
