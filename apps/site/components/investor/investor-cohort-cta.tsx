"use client";

import { useState } from "react";
import { FounderCohort } from "./founder-cohort";
import { RequestDeckModal } from "./request-deck-modal";
import type { LeadIntent } from "@/lib/lead-capture";

/**
 * InvestorCohortCTA — page-level wrapper that wires FounderCohort's two
 * actions to the unified /api/investor/lead capture surface.
 *
 *   · "Request a founder session" → opens the modal in founder-session mode.
 *   · "Request the thesis memo"   → opens the modal in thesis-memo mode.
 *
 * Each opens the same modal component with intent-specific heading/lede/CTA
 * copy (INTENT_COPY map) — so the capture surface reads differently for
 * each ask without duplicating form logic.
 */

export function InvestorCohortCTA() {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>("founder-session");

  return (
    <>
      <FounderCohort
        onRequestSession={() => {
          setIntent("founder-session");
          setOpen(true);
        }}
        onRequestMemo={() => {
          setIntent("thesis-memo");
          setOpen(true);
        }}
      />
      <RequestDeckModal
        open={open}
        onClose={() => setOpen(false)}
        intent={intent}
      />
    </>
  );
}
