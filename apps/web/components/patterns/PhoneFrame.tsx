"use client";

import React from "react";

/*
 * PhoneFrame — Claude Design canvas mockup.
 *
 * <768px viewport: full-bleed, no chrome. The canvas IS the device.
 * ≥768px viewport: 380×820 mockup, 56px outer radius / 44px inner radius,
 *   12px bezel padding, centered on the page background.
 *
 * Contents render inside the inner-screen, so callers don't need to think
 * about the chrome.
 */

interface PhoneFrameProps {
  children: React.ReactNode;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <>
      {/* Mobile: full-viewport. */}
      <div className="md:hidden min-h-[100dvh] w-full bg-surface flex flex-col">
        {children}
      </div>

      {/* Tablet+: phone-frame mockup. */}
      <div className="hidden md:flex min-h-[100dvh] w-full items-center justify-center bg-surface-2 px-6 py-10">
        <div
          aria-hidden="false"
          className="relative bg-ink rounded-[56px] shadow-md"
          style={{ width: 380, height: 820, padding: 12 }}
        >
          <div
            className="relative h-full w-full overflow-hidden bg-surface rounded-[44px] flex flex-col"
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
