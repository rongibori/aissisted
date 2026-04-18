import type { Metadata } from "next";
import React from "react";

// IBM Plex — self-hosted via @fontsource. No CDN on critical render path.
// SIL OFL 1.1 licensed.
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource/ibm-plex-serif/400.css";
import "@fontsource/ibm-plex-serif/600.css";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aissisted — Your Body. Understood.",
    template: "%s · Aissisted",
  },
  description:
    "A system that learns your body and builds the protocol it needs. Labs in. Protocol out. Built for one person.",
  metadataBase: new URL(process.env.SITE_URL ?? "https://aissisted.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/*
        Background/foreground bind to --background / --text via globals.css
        body selector. Do not re-hardcode colors here — they override tokens.
      */}
      <body>{children}</body>
    </html>
  );
}
