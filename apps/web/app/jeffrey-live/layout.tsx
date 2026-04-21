"use client";

/**
 * /jeffrey-live layout — supplies AuthProvider so the page can call useAuth()
 * without each component wrapping itself. Matches the pattern used by
 * /dashboard, /profile, /integrations.
 *
 * This layout deliberately does NOT include Nav or an AuthGuard — the
 * /jeffrey-live page is an internal prove-out surface that handles its own
 * loading/redirect flow.
 */

import React from "react";
import { AuthProvider } from "../../lib/auth-context";

export default function JeffreyLiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
