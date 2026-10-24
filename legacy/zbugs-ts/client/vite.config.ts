import { defineConfig } from "vitest/config";

// One self-contained ESM file, served by Topcoat via `asset!()`, the same
// way Topcoat ships its own runtime (crates/topcoat-runtime/browser/dist).
export default defineConfig({
  // Library mode leaves `process.env.NODE_ENV` in place; query-core reads it.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "hearth.js",
    },
    target: "es2022",
    sourcemap: true,
    minify: true,
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  test: {
    environment: "happy-dom",
  },
});
