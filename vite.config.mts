import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: "esnext",
    assetsInlineLimit: 0,
    lib: {
      entry: "./index.ts",
      name: "ExiledExchange2Parser",
      fileName: (format) => `index.${format}.js`,
    },
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "webview",
        },
      },
    }),
    dts(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ipc": path.resolve(__dirname, "./src/../ipc"),
      "@specs": path.resolve(__dirname, "./specs"),
    },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
  server: {
    proxy: {
      "^/(config|uploads|proxy)": { target: "http://127.0.0.1:8584" },
      "/events": { ws: true, target: "http://127.0.0.1:8584" },
    },
  },
});
