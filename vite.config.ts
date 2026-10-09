/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Library build + test configuration.
// The dev page has its own config in dev/vite.config.ts.
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
    sourcemap: true,
    rollupOptions: {
      external: [],
      output: {
        // Emit one file per source module instead of bundling into chunks,
        // so dist/ mirrors src/.
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
      },
    },
  },
  plugins: [
    dts({
      // Only emit types for the library, not dev/ or tests.
      include: ["src"],
      exclude: ["src/**/*.test.ts"],
      outDirs: "dist/types",
    }),
  ],
  test: {
    environment: "happy-dom",
    environmentOptions: { happyDOM: { url: "http://localhost:3000/" } },
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
  },
});
