"use client";

import React from "react";

/*
 * Aissisted UI kit — Brand Bible v1.1 tokens
 *
 * All colors route through the @theme tokens in app/globals.css.
 * No hex literals, no legacy indigo / slate / zinc utilities here.
 * Surface palette is white-first (70% white), with graphite ink and
 * medical red reserved for true brand moments (8% budget).
 */

// ─── Button ──────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    // Primary = ink-on-white authority. Red is reserved for brand moments;
    // most CTAs should read as calm / assured, not attention-grabbing.
    primary:
      "bg-ink text-surface hover:bg-muted focus:ring-ink",
    secondary:
      "bg-surface text-ink border border-line hover:border-line-strong focus:ring-line-strong",
    ghost:
      "text-muted hover:text-ink hover:bg-surface-2 focus:ring-line-strong",
    // Danger = brand red. Use sparingly; this is the attention signal.
    danger:
      "bg-brand text-surface hover:bg-brand-hover focus:ring-brand",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border border-line rounded-xl p-5 ${
        onClick ? "cursor-pointer hover:border-line-strong transition-colors" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Input ───────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-ink">{label}</label>
      )}
      <input
        className={`bg-surface border ${
          error ? "border-danger" : "border-line"
        } rounded-lg px-3 py-2 text-ink placeholder-soft text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-surface-2 text-muted border border-line",
    success: "bg-ok-soft text-ok border border-ok/20",
    warning: "bg-warn-soft text-warn border border-warn/20",
    danger:  "bg-danger-soft text-danger border border-danger/20",
    // "info" surfaces intelligence / system state — midnight data channel
    info:    "bg-surface-2 text-data border border-line",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

// ─── Spinner ─────────────────────────────────────────────
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={`${sizes[size]} border-2 border-line border-t-ink rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ─── Empty State ─────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <p className="text-ink font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Rally Cry ────────────────────────────────────────────
// "Your Body. Understood." — the single canonical brand rally cry.
// Use this component anywhere the rally cry is surfaced (login hero,
// onboarding completion, marketing surfaces) to guarantee one rendering.
export function RallyCry({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "text-2xl sm:text-3xl",
    md: "text-4xl sm:text-5xl",
    lg: "text-5xl sm:text-6xl",
  };
  return (
    <p className={`rally-cry ${sizes[size]} ${className}`}>
      Your Body. <span className="text-brand">Understood.</span>
    </p>
  );
}
