import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aissisted",
  description: "AI-driven personalized health and supplement platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      {/*
        Background/foreground intentionally left to globals.css body selector,
        which binds to --background / --text (Brand Bible v1.1 tokens).
        Do not re-hardcode colors here — they override the token system.
      */}
      <body>{children}</body>
    </html>
  );
}
