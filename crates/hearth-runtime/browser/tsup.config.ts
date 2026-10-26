import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.ts", persist: "src/hearth/persist.ts" },
	format: ["esm"],

	noExternal: [/(.*)/],
	platform: "browser",
	target: "es2022",

	splitting: false,
	minify: true,
	sourcemap: true,
	clean: true,
});
