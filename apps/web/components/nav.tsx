"use client";

import React from "react";
import Link from "next/link";
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
    <nav
      aria-label="Primary"
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface/95 backdrop-blur border-b border-border flex items-center px-6 gap-8"
    >
      <Link
        href="/dashboard"
        className="text-graphite font-semibold text-base tracking-tight"
      >
        Aissisted
      </Link>

      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-surface-2 text-graphite font-medium"
                  : "text-graphite-soft hover:text-graphite hover:bg-surface-2"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-graphite-soft font-data">{user.email}</span>
          <button
            onClick={logout}
            className="text-sm text-graphite-soft hover:text-graphite transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
