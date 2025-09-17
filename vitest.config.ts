import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [tsconfigPaths(), dts()],
  build: {
    lib: {
      entry: "./index.ts",
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
