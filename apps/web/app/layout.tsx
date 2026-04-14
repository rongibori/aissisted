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
      <body className="bg-[#0a0a0f] text-[#e8e8f0]">{children}</body>
    </html>
  );
}
