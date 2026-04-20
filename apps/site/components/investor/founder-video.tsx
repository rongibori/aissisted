"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/container";
import { UILabel, JeffreySystem } from "@/components/typography";
import { usePrefersReducedMotion } from "@/lib/motion";

/**
 * FounderVideo — short-form, founder-recorded thesis on camera.
 *
 * If NEXT_PUBLIC_FOUNDER_VIDEO_URL is set at build time, the component
 * renders a 16:9 player with poster image. If not, it renders an honest
 * placeholder that still ships as a designed surface — no fake autoplay,
 * no fabricated runtime.
 *
 * Tone: midnight. Sits between the cinematic hero and Chapter 01 so it
 * functions as a first-person validation of the thesis.
 */

const VIDEO_URL = process.env.NEXT_PUBLIC_FOUNDER_VIDEO_URL ?? "";
const POSTER_URL = process.env.NEXT_PUBLIC_FOUNDER_VIDEO_POSTER ?? "";

export function FounderVideo() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setSeen(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className="bg-[color:var(--brand-midnight)] text-white py-20 md:py-28 relative overflow-hidden">
      <Container width="wide">
        <div ref={ref} className="grid gap-10 lg:grid-cols-[20rem_1fr] items-start">
          <div
            className={cn(
              "transition-all duration-[800ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3",
            )}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
              <UILabel className="text-data">From the founder</UILabel>
            </div>
            <h2 className="mt-6 font-display font-bold text-white text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">
              Ninety seconds.
              <br />
              <span className="text-white/55">First person.</span>
            </h2>
            <p className="mt-5 font-body text-[15px] leading-[1.55] text-white/70 max-w-sm">
              Why this company. Why this founder. Why now. Recorded in one take,
              unedited, no script teleprompter, no voice-over.
            </p>
            <JeffreySystem className="mt-6 block text-white/45">
              No marketing reel · founder-recorded · uncut
            </JeffreySystem>
          </div>

          <div
            className={cn(
              "relative w-full aspect-video bg-black ring-1 ring-white/10",
              "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.7)]",
              "transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0,0,1)]",
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
            )}
            style={{ transitionDelay: "180ms" }}
          >
            {VIDEO_URL ? (
              <video
                controls
                preload="metadata"
                poster={POSTER_URL || undefined}
                className="h-full w-full object-cover"
              >
                <source src={VIDEO_URL} />
                Your browser does not support inline video. Open the founder
                video here: <a href={VIDEO_URL}>{VIDEO_URL}</a>
              </video>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,rgba(0,194,209,0.18),transparent_60%)]" />
                <div className="relative">
                  <div
                    className={cn(
                      "mx-auto h-16 w-16 rounded-full ring-1 ring-white/15 bg-white/[0.04]",
                      "flex items-center justify-center",
                    )}
                  >
                    <span aria-hidden className="block h-3 w-3 rounded-full bg-data motion-safe:animate-pulse" />
                  </div>
                  <p className="mt-6 font-display text-white/85 text-lg md:text-xl tracking-[-0.01em]">
                    Founder video · in production
                  </p>
                  <JeffreySystem className="mt-3 block text-white/45">
                    Lands here on first cohort close · 90 seconds · uncut
                  </JeffreySystem>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
