"use client";

import { useState } from "react";
import { HardCTA, type HardCTAIntent } from "./hard-cta";
import { RequestDeckModal } from "./request-deck-modal";

/**
 * HardCTAWrapper — page-level wrapper that wires the HardCTA's three intents
 * to the existing deck-request modal.
 *
 * Keeps page.tsx a server component while HardCTA itself stays presentational.
 * When dedicated endpoints (/api/investor/allocation, /api/investor/founder-call,
 * /api/investor/waitlist) ship, swap the modal per-intent here without
 * touching the visual surface.
 */

export function HardCTAWrapper() {
  const [open, setOpen] = useState(false);
  const [, setLastIntent] = useState<HardCTAIntent | null>(null);

  return (
    <>
      <HardCTA
        onRequest={(intent) => {
          setLastIntent(intent);
          setOpen(true);
        }}
      />
      <RequestDeckModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
