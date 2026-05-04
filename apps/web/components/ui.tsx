"use client";

import React from "react";

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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:ring-aqua disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-midnight hover:bg-midnight/90 text-white",
    secondary:
      "bg-surface hover:bg-surface-2 text-graphite border border-border",
    ghost:
      "hover:bg-surface-2 text-graphite-soft hover:text-graphite",
    danger:
      "bg-signal-red hover:bg-signal-red/90 text-white",
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
      className={`bg-surface border border-border rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-graphite-soft/40 transition-colors" : ""} ${className}`}
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
        <label className="text-sm font-medium text-graphite">{label}</label>
      )}
      <input
        className={`bg-surface border ${error ? "border-signal-red" : "border-border"} rounded-lg px-3 py-2 text-graphite placeholder-graphite-soft text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua focus-visible:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-signal-red">{error}</p>}
      {hint && !error && <p className="text-xs text-graphite-soft">{hint}</p>}
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
    default: "bg-surface-2 text-graphite-soft border border-border",
    success: "bg-aqua/10 text-aqua border border-aqua/30",
    warning: "bg-warn/10 text-warn border border-warn/30",
    danger: "bg-signal-red/10 text-signal-red border border-signal-red/30",
    info: "bg-midnight/5 text-midnight border border-midnight/20",
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
      role="status"
      aria-label="Loading"
      className={`${sizes[size]} border-2 border-border border-t-aqua rounded-full animate-spin`}
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
      <p className="text-graphite font-medium">{title}</p>
      {description && <p className="text-sm text-graphite-soft max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
