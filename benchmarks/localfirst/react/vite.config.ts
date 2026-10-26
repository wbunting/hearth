import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  base: "/bench/react-assets/",
  build: { outDir: "dist", emptyOutDir: true, minify: true },
});
