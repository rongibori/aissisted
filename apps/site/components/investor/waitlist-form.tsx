"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { JeffreySystem, UILabel } from "@/components/typography";

/**
 * WaitlistForm — single-line email capture with inline confirmation.
 *
 * Submits to /api/investor/waitlist. Shows a composed, on-brand confirmation
 * line in place of the input on success; shows an inline error on failure.
 *
 * Mobile posture: full-width stacked. Desktop posture: inline row.
 */

export function WaitlistForm({
  label = "Investor watchlist",
  tone = "inverse",
  className,
}: {
  label?: string;
  tone?: "inverse" | "default";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const isInverse = tone === "inverse";

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting || !email.trim()) return;
      setError(null);
      setSubmitting(true);
      try {
        const res = await fetch("/api/investor/waitlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), context: "investor-room" }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; message?: string; error?: { message?: string } }
          | null;
        if (!res.ok || !data?.ok) {
          setError(data?.error?.message ?? "Please try again.");
          return;
        }
        setConfirmation(data.message ?? "On the list.");
      } catch {
        setError("Network error. Try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, submitting],
  );

  if (confirmation) {
    return (
      <div
        className={cn(
          "flex items-start gap-3",
          isInverse ? "text-white" : "text-ink",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full mt-2 shrink-0",
            "bg-data",
          )}
        />
        <div>
          <UILabel className={isInverse ? "text-data" : "text-brand"}>
            Received
          </UILabel>
          <p
            className={cn(
              "mt-1 font-body text-[15px] leading-[1.55]",
              isInverse ? "text-white/85" : "text-ink/80",
            )}
          >
            {confirmation}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)}>
      <UILabel className={isInverse ? "text-white/55" : "text-ink/55"}>
        {label}
      </UILabel>
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        <input
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@firm.com"
          aria-label="Email"
          className={cn(
            "flex-1 h-11 px-3",
            "font-body text-[15px]",
            "focus:outline-none focus:ring-2 focus:ring-data",
            "transition-shadow",
            isInverse
              ? "bg-white/[0.04] ring-1 ring-inset ring-white/10 text-white placeholder:text-white/35"
              : "bg-surface ring-1 ring-inset ring-ink/15 text-ink placeholder:text-ink/40",
          )}
        />
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "h-11 px-5 shrink-0",
            "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
            "transition-[filter] hover:brightness-110",
            "disabled:opacity-50 disabled:pointer-events-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data focus-visible:ring-offset-2",
            isInverse
              ? "bg-data text-[color:var(--brand-midnight)] focus-visible:ring-offset-[color:var(--brand-midnight)]"
              : "bg-ink text-surface focus-visible:ring-offset-surface",
          )}
        >
          {submitting ? "Adding…" : "Add me"}
        </button>
      </div>
      {error ? (
        <p className={cn("mt-3 font-system text-xs", isInverse ? "text-[color:#ff8a8a]" : "text-brand")}>
          {error}
        </p>
      ) : (
        <JeffreySystem className={cn("mt-3 block", isInverse ? "text-white/40" : "text-ink/40")}>
          Rare updates. Real signal. Unsubscribe anytime.
        </JeffreySystem>
      )}
    </form>
  );
}
