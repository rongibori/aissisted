import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Run each test file in its own isolated context
    isolate: true,
    // Show verbose output for each test
    reporter: "verbose",
    // Resolve .js extension imports to .ts sources (TypeScript ESM convention)
    alias: {
      // No aliases needed — vitest handles .js → .ts resolution natively
    },
  },
  resolve: {
    // Let vitest resolve .js extensions to .ts files
    extensions: [".ts", ".js"],
  },
});
