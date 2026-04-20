"use client";

import { useState } from "react";
import { HardCTA, type HardCTAIntent } from "./hard-cta";
import { RequestDeckModal } from "./request-deck-modal";
import type { LeadIntent } from "@/lib/lead-capture";

/**
 * HardCTAWrapper — page-level wrapper that wires the HardCTA's three intents
 * to the unified lead-capture modal.
 *
 * Maps the HardCTA intent enum onto the LeadIntent enum consumed by the
 * modal + /api/investor/lead route. The modal reads INTENT_COPY for heading,
 * lede, kicker, and CTA label — so each tier opens a capture surface that
 * reads like it was built for that specific ask.
 */

const toLeadIntent = (intent: HardCTAIntent): LeadIntent => intent;

export function HardCTAWrapper() {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>("allocation");

  return (
    <>
      <HardCTA
        onRequest={(i) => {
          setIntent(toLeadIntent(i));
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
