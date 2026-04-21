"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { UILabel } from "@/components/typography";

/**
 * AllocationUrgency — one-line scarcity strip above the HardCTA.
 *
 * Reads /api/investor/allocation-status (60s cache). If the cohort is
 * configured, renders a subtle seats-remaining chip with a tone that scales
 * with urgency:
 *
 *   · open         · aqua dot, calm label
 *   · nearly-full  · brand-red pulse, "N of M remain"
 *   · closed       · hairline dot, "cohort closed"
 *
 * If the API returns state:"unconfigured" (env vars unset), the component
 * renders nothing. NO fabricated scarcity — ever.
 */

type AllocationResponse = {
  ok: true;
  state: "open" | "nearly-full" | "closed" | "unconfigured";
  total: number | null;
  filled: number | null;
  remaining: number | null;
  label: string;
};

const FALLBACK: AllocationResponse = {
  ok: true,
  state: "unconfigured",
  total: null,
  filled: null,
  remaining: null,
  label: "Cohort · invitational",
};

export function AllocationUrgency({ className }: { className?: string }) {
  const [data, setData] = useState<AllocationResponse>(FALLBACK);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/investor/allocation-status", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as AllocationResponse;
        if (!cancelled) {
          setData(json);
          setMounted(true);
        }
      } catch {
        // Silent. Surface stays on fallback (which renders nothing for unconfigured).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (data.state === "unconfigured") return null;

  const tone =
    data.state === "nearly-full"
      ? "brand"
      : data.state === "closed"
        ? "hairline"
        : "aqua";

  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-opacity duration-[600ms]",
        mounted ? "opacity-100" : "opacity-0",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          tone === "brand" && "bg-brand",
          tone === "aqua" && "bg-data",
          tone === "hairline" && "bg-white/40",
        )}
      >
        {tone === "brand" ? (
          <span className="absolute inset-0 rounded-full bg-brand/60 motion-safe:animate-ping" />
        ) : null}
      </span>
      <UILabel
        className={cn(
          tone === "brand" && "text-brand",
          tone === "aqua" && "text-data",
          tone === "hairline" && "text-white/60",
        )}
      >
        {data.label}
      </UILabel>
    </div>
  );
}
