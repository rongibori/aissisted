import type { Metadata, Viewport } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Demo · Aissisted",
  description: "Live demo surface — synthetic data, not medical advice.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function DemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh w-full overflow-hidden bg-surface text-ink">
      {children}
    </div>
  );
}
