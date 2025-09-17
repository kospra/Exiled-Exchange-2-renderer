import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      entryRoot: "src",
      outDir: "dist",
      insertTypesEntry: true, // creates dist/index.d.ts that re-exports your types
      tsconfigPath: "./tsconfig.json",
      include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "src/**/*.d.ts"],
    }),
  ],
  build: {
    lib: {
      entry: "./src/index.ts",
      name: "ExiledExchange2Parser",
      fileName: (format) => `index.${format}.js`,
    },
  },
  test: {
    includeSource: ["src/**/*.{js,ts}"],
    globals: true,
    setupFiles: ["./specs/vitest.setup.ts"],
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  resolve: {
    alias: {
      "@/assets/data/en": "./src/parser/en",
    },
  },
});
