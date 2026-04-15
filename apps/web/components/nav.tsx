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
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0a0a0f] border-b border-[#2a2a38] flex items-center px-6 gap-8">
      {/* Logo */}
      <Link href="/dashboard" className="text-[#e8e8f0] font-semibold text-base tracking-tight">
        Aissisted
      </Link>

      {/* Links */}
      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname.startsWith(href)
                ? "bg-[#1c1c26] text-[#e8e8f0]"
                : "text-[#7a7a98] hover:text-[#e8e8f0] hover:bg-[#1c1c26]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* User */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#7a7a98]">{user.email}</span>
          <button
            onClick={logout}
            className="text-sm text-[#7a7a98] hover:text-[#e8e8f0] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
