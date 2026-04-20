"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  JeffreySystem,
  Lede,
  UILabel,
  H4,
} from "@/components/typography";
import {
  INTENT_COPY,
  submitLead,
  type LeadIntent,
} from "@/lib/lead-capture";

/**
 * RequestDeckModal — decisive, intent-aware capture surface.
 *
 * Full-screen on mobile, centered dialog on desktop. Captures:
 *   · Name · Email (required)
 *   · Firm (optional)
 *   · Check size range (optional, shown only for allocation/founder-call/
 *     founder-session/deck-request/thesis-memo intents)
 *   · Private note (optional)
 *
 * Submits to /api/investor/lead with the current intent tag. The server
 * fans out to HubSpot + Airtable (best-effort) and returns intent-specific
 * confirmation copy.
 *
 * Escape closes. Backdrop click closes. Focus-trap via first-focus ref.
 * Brand discipline: midnight surface, aqua signal, zero red in the modal.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  intent?: LeadIntent;
};

const CHECK_SIZES = [
  { value: "", label: "Range · optional" },
  { value: "<250k", label: "< $250k" },
  { value: "250k-1m", label: "$250k – $1M" },
  { value: "1m-5m", label: "$1M – $5M" },
  { value: "5m+", label: "$5M+" },
  { value: "strategic", label: "Strategic / LP" },
] as const;

export function RequestDeckModal({
  open,
  onClose,
  intent = "deck-request",
}: Props) {
  const headingId = useId();
  const descId = useId();
  const firstFocusRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    firm: "",
    checkSize: "",
    note: "",
  });

  const copy = INTENT_COPY[intent];
  const showCheckSize =
    intent === "allocation" ||
    intent === "deck-request" ||
    intent === "founder-session" ||
    intent === "thesis-memo";

  // Reset confirmation / form when intent changes while open.
  useEffect(() => {
    if (!open) {
      setConfirmation(null);
      setError(null);
    }
  }, [open, intent]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => firstFocusRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setError(null);
      setSubmitting(true);
      const result = await submitLead(intent, {
        name: form.name,
        email: form.email,
        firm: form.firm || undefined,
        checkSize: showCheckSize ? form.checkSize || undefined : undefined,
        note: form.note || undefined,
      });
      setSubmitting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirmation(result.message);
    },
    [form, submitting, intent, showCheckSize],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close request-deck dialog"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-md",
          "motion-safe:animate-[fadeIn_200ms_ease-out]",
        )}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full md:max-w-lg mx-auto",
          "bg-[color:var(--brand-midnight)] text-white",
          "ring-1 ring-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]",
          "max-h-[94vh] overflow-y-auto",
          "motion-safe:animate-[riseIn_260ms_cubic-bezier(0.2,0,0,1)]",
        )}
      >
        <div className="flex items-start justify-between px-6 pt-6 md:px-8 md:pt-8">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-data"
            />
            <UILabel className="text-data">{copy.kicker}</UILabel>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 -mr-2 inline-flex items-center justify-center text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-data"
          >
            <span aria-hidden className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="px-6 md:px-8 pt-4 pb-2">
          <H4 as="h2" className="text-white text-2xl md:text-3xl" >
            <span id={headingId}>{copy.heading}</span>
          </H4>
          <Lede id={descId} className="mt-3 text-white/75 text-base md:text-base">
            {copy.lede}
          </Lede>
        </div>

        {confirmation ? (
          <div className="px-6 md:px-8 pb-8 md:pb-10 pt-4">
            <div className="bg-white/5 ring-1 ring-inset ring-white/10 p-5">
              <UILabel className="text-data">Sent</UILabel>
              <p className="mt-2 font-body text-[15px] leading-[1.6] text-white/85">
                {confirmation}
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "h-11 px-5 bg-data text-[color:var(--brand-midnight)]",
                  "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                  "hover:brightness-110 transition-[filter]",
                )}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="px-6 md:px-8 pb-8 md:pb-10 pt-4 flex flex-col gap-4">
            <Field label="Name" required>
              <input
                ref={firstFocusRef}
                required
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className={inputClass}
                placeholder="First Last"
              />
            </Field>

            <Field label="Email" required>
              <input
                required
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                className={inputClass}
                placeholder="you@firm.com"
              />
            </Field>

            <div
              className={cn(
                "grid grid-cols-1 gap-4",
                showCheckSize ? "sm:grid-cols-2" : "",
              )}
            >
              <Field label="Firm">
                <input
                  type="text"
                  autoComplete="organization"
                  value={form.firm}
                  onChange={(e) => setForm((s) => ({ ...s, firm: e.target.value }))}
                  className={inputClass}
                  placeholder="Fund / company"
                />
              </Field>
              {showCheckSize ? (
                <Field label="Check size">
                  <select
                    value={form.checkSize}
                    onChange={(e) => setForm((s) => ({ ...s, checkSize: e.target.value }))}
                    className={cn(inputClass, "appearance-none pr-8 bg-[length:10px_10px] bg-no-repeat bg-[right_0.75rem_center] bg-[image:linear-gradient(45deg,transparent_50%,rgba(255,255,255,0.6)_50%),linear-gradient(-45deg,transparent_50%,rgba(255,255,255,0.6)_50%)] bg-[position:calc(100%-0.75rem)_center,calc(100%-0.35rem)_center] bg-[size:5px_5px,5px_5px]")}
                  >
                    {CHECK_SIZES.map((c) => (
                      <option
                        key={c.value}
                        value={c.value}
                        className="bg-[color:var(--brand-midnight)] text-white"
                      >
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>

            <Field label="One line of context">
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                className={cn(inputClass, "resize-y min-h-[84px]")}
                placeholder="Thesis fit, portfolio angle, timing."
              />
            </Field>

            {error ? (
              <p className="font-system text-xs text-[color:#ff8a8a]">{error}</p>
            ) : null}

            <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
              <JeffreySystem className="text-white/45">
                Private · read by Ron and Jeffrey · nothing shared further.
              </JeffreySystem>
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "h-11 px-5",
                  "bg-data text-[color:var(--brand-midnight)]",
                  "font-system text-[11px] font-semibold uppercase tracking-[0.16em]",
                  "hover:brightness-110 transition-[filter]",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                )}
              >
                {submitting ? "Sending…" : copy.cta}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Local keyframes — scoped so they don't leak into globals. */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const inputClass = cn(
  "w-full h-11 px-3",
  "bg-white/[0.04] ring-1 ring-inset ring-white/10",
  "text-white placeholder:text-white/35",
  "font-body text-[15px]",
  "focus:outline-none focus:ring-2 focus:ring-data",
  "transition-shadow",
);

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <UILabel className="text-white/55">
        {label}
        {required ? <span className="ml-1 text-data">·</span> : null}
      </UILabel>
      {children}
    </label>
  );
}
