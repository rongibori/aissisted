"use client";

import { useState } from "react";
import { FounderCohort } from "./founder-cohort";
import { RequestDeckModal } from "./request-deck-modal";

/**
 * InvestorCohortCTA — page-level wrapper that wires FounderCohort's two
 * actions to the existing /api/investor/request-deck modal.
 *
 *   · "Request a founder session" → opens the deck-request modal pre-positioned
 *     toward a founder session (modal handles intent in the note).
 *   · "Request the thesis memo"   → opens the same modal in memo mode.
 *
 * Keeps page.tsx as a server component while the cohort visual stays a
 * one-liner: <InvestorCohortCTA />.
 */

export function InvestorCohortCTA() {
  const [deckOpen, setDeckOpen] = useState(false);

  return (
    <>
      <FounderCohort
        onRequestSession={() => setDeckOpen(true)}
        onRequestMemo={() => setDeckOpen(true)}
      />
      <RequestDeckModal open={deckOpen} onClose={() => setDeckOpen(false)} />
    </>
  );
}
