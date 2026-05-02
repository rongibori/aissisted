import type { Metadata } from "next";
import React from "react";
import { Inter_Tight, IBM_Plex_Mono, Libre_Baskerville } from "next/font/google";
import "./globals.css";

// Display — Inter Tight as Briston fallback (per design spec §9 open question;
// CSS var name --font-display stays stable so the swap is a one-line change
// once Briston is licensed).
const displayFont = Inter_Tight({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-display-loaded",
  display: "swap",
});

// System — IBM Plex Mono per design spec §2.2 (target family; replaces the
// Source Code Pro temp stack).
const systemFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-system-loaded",
  display: "swap",
});

// Accent — Libre Baskerville italic, the canonical open-source Baskerville.
const accentFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-accent-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aissisted",
  description: "AI-driven personalized health and supplement platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${systemFont.variable} ${accentFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
