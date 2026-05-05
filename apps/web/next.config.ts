import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Compile workspace packages that ship as TypeScript source (no build step).
  // @aissisted/orchestrator uses NodeNext-style .js import suffixes which
  // webpack can't resolve through a non-transpiled package boundary.
  transpilePackages: ["@aissisted/orchestrator"],
};

export default nextConfig;
