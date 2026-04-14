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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500",
    secondary:
      "bg-[#1c1c26] hover:bg-[#2a2a38] text-[#e8e8f0] border border-[#2a2a38] focus:ring-indigo-500",
    ghost:
      "hover:bg-[#1c1c26] text-[#7a7a98] hover:text-[#e8e8f0] focus:ring-indigo-500",
    danger:
      "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
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
      className={`bg-[#13131a] border border-[#2a2a38] rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-[#3a3a50] transition-colors" : ""} ${className}`}
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
        <label className="text-sm font-medium text-[#e8e8f0]">{label}</label>
      )}
      <input
        className={`bg-[#1c1c26] border ${error ? "border-red-500" : "border-[#2a2a38]"} rounded-lg px-3 py-2 text-[#e8e8f0] placeholder-[#7a7a98] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-[#7a7a98]">{hint}</p>}
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
    default: "bg-[#2a2a38] text-[#7a7a98]",
    success: "bg-green-950 text-green-400",
    warning: "bg-amber-950 text-amber-400",
    danger: "bg-red-950 text-red-400",
    info: "bg-indigo-950 text-indigo-400",
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
      className={`${sizes[size]} border-2 border-[#2a2a38] border-t-indigo-500 rounded-full animate-spin`}
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
      <p className="text-[#e8e8f0] font-medium">{title}</p>
      {description && <p className="text-sm text-[#7a7a98] max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
