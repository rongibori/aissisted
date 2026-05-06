import Link from "next/link";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { Eyebrow } from "@/components/eyebrow";
import { Divider } from "@/components/divider";
import { Body, H1, H2, H3, Lede } from "@/components/typography";

/**
 * LegalPage — shared template for /legal/privacy, /legal/terms,
 * /legal/disclaimers. M3 Phase 4.
 *
 * Every legal page MUST render the [LEGAL REVIEW PENDING] banner at the
 * very top of the document, above the hero, in brand red — non-negotiable
 * per the M3 Phase 4 brief. The template enforces that ceiling: the banner
 * is rendered by this component, not by the route file, and the banner copy
 * is locked here.
 *
 * Brand canon:
 *   · Brand red is spent on the [LEGAL REVIEW PENDING] banner only — these
 *     pages are intentionally non-glamorous template reads. No CTA button
 *     in red, no Eyebrow tone="brand", no Pill tone="brand". The banner is
 *     the entire signal-red beat per page.
 *   · 0 forbidden words audited against lib/brand-rules.ts FORBIDDEN_WORDS.
 *   · No medical claims; the disclaimers page declares the dietary-supplement
 *     framing explicitly.
 *
 * The route file passes structured Sections (heading + paragraphs + optional
 * sub-bullets). Sub-headings come through as H3 and are rendered as a clean
 * hierarchy underneath each top-level Section H2.
 */

export type LegalSubSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalSection = {
  heading: string;
  intro?: string;
  body: LegalSubSection[];
};

export type LegalPageProps = {
  documentLabel: string; // "Privacy policy" | "Terms of service" | "Disclaimers"
  title: string; // hero H1 line
  lede: string; // hero lede paragraph
  effective: string; // human-readable date string e.g. "Effective May 5, 2026"
  sections: LegalSection[];
};

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

export function LegalReviewBanner() {
  return (
    <div
      role="note"
      aria-label="Legal review pending"
      className="bg-brand text-white"
    >
      <Container width="wide">
        <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:gap-6 md:py-3">
          <span className="font-system text-xs font-medium uppercase tracking-[0.18em]">
            [LEGAL REVIEW PENDING]
          </span>
          <span className="font-body text-sm leading-snug text-white/90 md:text-[13px]">
            These templates are for transparency during pre-launch. Final
            versions will be counsel-drafted before any commercial relationship
            begins.
          </span>
        </div>
      </Container>
    </div>
  );
}

export function LegalPage(props: LegalPageProps) {
  return (
    <div className="bg-surface text-ink">
      <LegalReviewBanner />

      <Hero
        documentLabel={props.documentLabel}
        title={props.title}
        lede={props.lede}
        effective={props.effective}
      />

      <Body2 sections={props.sections} />

      <FooterBlock />
    </div>
  );
}

function Hero({
  documentLabel,
  title,
  lede,
  effective,
}: {
  documentLabel: string;
  title: string;
  lede: string;
  effective: string;
}) {
  return (
    <section
      aria-labelledby="legal-hero-heading"
      className="relative isolate pt-16 pb-12 md:pt-20 md:pb-16"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">{documentLabel}</Eyebrow>

          <H1 id="legal-hero-heading" className="mt-6">
            {title}
          </H1>

          <Lede className="mt-8 max-w-2xl">{lede}</Lede>

          <p className="mt-6 font-system text-xs uppercase tracking-[0.16em] text-ink/55">
            {effective}
          </p>
        </div>
      </Container>
    </section>
  );
}

function Body2({ sections }: { sections: LegalSection[] }) {
  return (
    <section
      aria-label="Document body"
      className="border-t border-ink/5 py-16 md:py-24"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <div className="grid gap-14">
            {sections.map((section, idx) => (
              <SectionBlock
                key={`${section.heading}-${idx}`}
                section={section}
                index={idx}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SectionBlock({
  section,
  index,
}: {
  section: LegalSection;
  index: number;
}) {
  return (
    <article aria-labelledby={`legal-sec-${index}`}>
      <p className="font-system text-xs font-medium uppercase tracking-[0.16em] text-ink/55">
        Section {String(index + 1).padStart(2, "0")}
      </p>
      <H2 id={`legal-sec-${index}`} className="mt-3 text-3xl md:text-4xl">
        {section.heading}
      </H2>
      {section.intro && (
        <Body className="mt-5 text-base text-ink/85 md:text-lg">
          {section.intro}
        </Body>
      )}

      <div className="mt-8 grid gap-7">
        {section.body.map((sub, sIdx) => (
          <div key={`sub-${index}-${sIdx}`}>
            {sub.heading && (
              <H3 className="text-xl md:text-2xl">{sub.heading}</H3>
            )}
            <div className={cn("grid gap-4", sub.heading && "mt-3")}>
              {sub.paragraphs.map((p, pIdx) => (
                <Body key={pIdx} className="text-sm md:text-base">
                  {p}
                </Body>
              ))}
              {sub.bullets && sub.bullets.length > 0 && (
                <ul className="grid gap-2.5">
                  {sub.bullets.map((bullet, bIdx) => (
                    <li
                      key={bIdx}
                      className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 text-sm text-ink/80 md:text-base"
                    >
                      <span
                        aria-hidden="true"
                        className="font-system text-xs tracking-[0.08em] text-ink/45"
                      >
                        ·
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function FooterBlock() {
  return (
    <section
      aria-labelledby="legal-footer-heading"
      className="border-t border-ink/5 py-16 md:py-20"
    >
      <Container width="wide">
        <div className="max-w-3xl">
          <Eyebrow tone="muted">Other legal documents</Eyebrow>
          <H2 id="legal-footer-heading" className="mt-4">
            Read the rest.
          </H2>

          <Divider className="mt-8" />

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/legal/privacy" className={SECONDARY_CTA}>
              Privacy
            </Link>
            <Link href="/legal/terms" className={SECONDARY_CTA}>
              Terms
            </Link>
            <Link href="/legal/disclaimers" className={SECONDARY_CTA}>
              Disclaimers
            </Link>
          </div>

          <p className="mt-8 max-w-xl text-sm text-ink/65">
            Questions about how aissisted handles a specific situation that
            isn't covered here? Reach the team via the request access page and
            we'll respond directly.
          </p>
        </div>
      </Container>
    </section>
  );
}
