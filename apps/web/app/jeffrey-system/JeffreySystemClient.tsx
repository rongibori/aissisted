"use client";

/**
 * JeffreySystemClient
 *
 * Client wrapper around <JeffreyAISystem />. Fetches the per-user
 * SystemSnapshot from /v1/system/snapshot and passes it as the prop the
 * component already accepts. Falls back to the in-component RON_SNAPSHOT
 * default when the visitor is unauthenticated, so the route remains useful
 * as a public demo even before login.
 *
 * Aligned with: plan-phase C of /Users/rongibori/.claude/plans/proud-enchanting-lerdorf.md
 */

import React, { useEffect, useState } from "react";
import { JeffreyAISystem } from "../../components/JeffreyAISystem";
import type { SystemSnapshot } from "../../components/JeffreyAISystem/systemTypes";
import { system } from "../../lib/api";

export default function JeffreySystemClient() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { snapshot } = await system.snapshot();
        if (!cancelled) setSnapshot(snapshot as SystemSnapshot);
      } catch (err: any) {
        // Unauthenticated / network: silently fall back to mock so the
        // public design surface keeps working. Other errors get surfaced
        // in dev via console.
        if (!cancelled) {
          setError(err?.message ?? "snapshot unavailable");
          if (typeof window !== "undefined" && window.console) {
            console.warn("[jeffrey-system] snapshot fetch failed:", err);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When `snapshot` is undefined, JeffreyAISystem uses its RON_SNAPSHOT
  // default — preserving the public-demo behavior.
  return <JeffreyAISystem snapshot={snapshot} />;
}
