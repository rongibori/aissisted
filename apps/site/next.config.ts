import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Next to transpile the workspace packages we consume.
  transpilePackages: ["@aissisted/brand"],
  // apps/web ships standalone for Docker. apps/site is Vercel-first —
  // leave output on the default so Vercel handles build artifacts.
  //
  // pnpm monorepo: pin Next's output file tracing root to the workspace
  // root so Webpack can resolve symlinked workspace packages
  // (@aissisted/brand → packages/brand) during the trace pass. Without
  // this, `next build` on Vercel throws:
  //   "Cannot read properties of undefined (reading 'fsPath')"
  // Next 15 promoted this option from experimental.* to top-level.
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
