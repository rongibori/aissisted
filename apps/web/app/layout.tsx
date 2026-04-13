import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Aissisted",
  description: "AI-driven personalized health and supplement platform"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>{children}</body>
    </html>
  );
}
