import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Next to transpile the workspace packages we consume.
  transpilePackages: ["@aissisted/brand"],
  // apps/web ships standalone for Docker. apps/site is Vercel-first —
  // leave output on the default so Vercel handles build artifacts.
};

export default nextConfig;
