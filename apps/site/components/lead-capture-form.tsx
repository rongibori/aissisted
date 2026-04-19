"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/button";
import { UILabel, JeffreySystem } from "@/components/typography";

/**
 * LeadCaptureForm — the minimum form the site needs at M2.
 *
 * Posts to /api/lead (currently 501 stub — M12 wires HubSpot investor
 * pipeline). Fields map to the expected body shape:
 *   { email, name?, source, intent?, notes? }
 *
 * Source is fixed per mount site so we never mis-tag the pipeline. At M2:
 *   "request-access" on /request-access
 *   "contact"        on /contact
 *   "jeffrey-handoff" when Jeffrey routes the user to a founder meeting
 */

type Source = "request-access" | "contact" | "jeffrey-handoff";

type Props = {
  source: Source;
  submitLabel?: string;
  onSubmitted?: (email: string) => void;
  className?: string;
};

type Status = "idle" | "submitting" | "ok" | "error";

export function LeadCaptureForm({
  source,
  submitLabel = "Continue",
  onSubmitted,
  className,
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, source, notes: notes || undefined }),
      });

      if (res.status === 501) {
        // Stub surface — M12 replaces this branch. Still treat as ok for M2
        // flow so the catalog can exercise success state.
        setStatus("ok");
        onSubmitted?.(email);
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setError("Something broke on our end. Try again in a moment.");
        return;
      }

      setStatus("ok");
      onSubmitted?.(email);
    } catch {
      setStatus("error");
      setError("Network error. Check the connection and retry.");
    }
  };

  if (status === "ok") {
    return (
      <div className={cn("p-6 ring-1 ring-inset ring-ink/10 bg-surface", className)}>
        <UILabel className="text-data">Received</UILabel>
        <p className="mt-3 font-body text-base text-ink">
          We'll be in touch at <span className="font-system text-data">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-5", className)} noValidate>
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <Field
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={setName}
      />

      {source !== "request-access" && (
        <TextAreaField
          label="Context (optional)"
          name="notes"
          value={notes}
          onChange={setNotes}
        />
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" tone="primary" size="md" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : submitLabel}
        </Button>
        {error && <JeffreySystem className="text-brand">{error}</JeffreySystem>}
      </div>

      <JeffreySystem className="text-ink/50">
        We only use this to follow up. No marketing lists.
      </JeffreySystem>
    </form>
  );
}

// ─── Local field helpers ──────────────────────────────────────────────────

type FieldProps = {
  label: string;
  name: string;
  type: "email" | "text";
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
};

function Field({ label, name, type, required, autoComplete, value, onChange }: FieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-system text-xs font-medium uppercase tracking-[0.16em] text-ink/60">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 bg-surface px-4",
          "font-body text-base text-ink",
          "ring-1 ring-inset ring-ink/15",
          "focus:outline-none focus:ring-2 focus:ring-data",
          "transition-[box-shadow] duration-150"
        )}
      />
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
};

function TextAreaField({ label, name, value, onChange }: TextAreaFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-system text-xs font-medium uppercase tracking-[0.16em] text-ink/60">
        {label}
      </span>
      <textarea
        name={name}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "bg-surface px-4 py-3",
          "font-body text-base text-ink",
          "ring-1 ring-inset ring-ink/15",
          "focus:outline-none focus:ring-2 focus:ring-data",
          "transition-[box-shadow] duration-150",
          "resize-none"
        )}
      />
    </label>
  );
}
