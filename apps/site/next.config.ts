import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow Next to transpile the workspace packages we consume.
  // @aissisted/jeffrey ships as raw ESM TypeScript (uses `.js` import
  // specifiers per TS-ESM convention); Next must transpile it so webpack
  // can resolve the specifiers against the source files.
  transpilePackages: ["@aissisted/brand", "@aissisted/jeffrey"],
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
  // TS-ESM convention: `.js` import specifiers resolve to `.ts` source when
  // transpiling raw TypeScript packages (@aissisted/jeffrey). Map `.js` →
  // `.ts`/`.tsx` so webpack can resolve them without a build step in the
  // upstream package.
  webpack(config) {
    config.resolve ??= {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
