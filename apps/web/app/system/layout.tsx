import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Aissisted — System",
  description: "Aissisted design system. Brand foundations, dashboard surface, motion choreography.",
};

// No auth gate. /system is a publicly shareable design surface.
export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
