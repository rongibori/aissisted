"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Jeffrey" },
  { href: "/stack", label: "My Stack" },
  { href: "/labs", label: "Labs" },
  { href: "/adherence", label: "Adherence" },
  { href: "/integrations", label: "Integrations" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface border-b border-line flex items-center px-6 gap-8">
      {/* Wordmark — primary graphite variant on white surface */}
      <Link
        href="/dashboard"
        aria-label="Aissisted — Your Body. Understood."
        className="flex items-center"
      >
        <Image
          src="/brand/Aissisted-logo-H.svg"
          alt="Aissisted"
          width={120}
          height={22}
          priority
        />
      </Link>

      {/* Links */}
      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? "bg-surface-2 text-ink"
                : "text-muted hover:text-ink hover:bg-surface-2"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* User */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{user.email}</span>
          <button
            onClick={logout}
            className="text-sm text-muted hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
