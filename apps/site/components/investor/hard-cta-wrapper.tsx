"use client";

import { useState } from "react";
import { HardCTA, type HardCTAIntent } from "./hard-cta";
import { RequestDeckModal } from "./request-deck-modal";
import { AllocationUrgency } from "./allocation-urgency";
import type { LeadIntent } from "@/lib/lead-capture";

/**
 * HardCTAWrapper — page-level wrapper that wires the HardCTA's three intents
 * to the unified lead-capture modal, and surfaces the allocation-urgency
 * strip directly above the hard ask.
 *
 * AllocationUrgency renders nothing unless INVESTOR_COHORT_SEATS_TOTAL and
 * INVESTOR_COHORT_SEATS_FILLED are set — so the default is silence, not
 * fabricated scarcity.
 */

const toLeadIntent = (intent: HardCTAIntent): LeadIntent => intent;

export function HardCTAWrapper() {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<LeadIntent>("allocation");

  return (
    <>
      <AllocationUrgency className="mb-6 md:mb-8" />
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
