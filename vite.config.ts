import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig(({ mode }) => ({
  root: resolve(import.meta.dirname, "web"),
  plugins: [react()],
  define: {
    "import.meta.env.VITE_PREVIEW_MODE": JSON.stringify(
      mode === "pages" ? "true" : "false",
    ),
  },
  build: {
    outDir: resolve(
      import.meta.dirname,
      mode === "pages" ? "dist-pages" : "dist",
    ),
    emptyOutDir: true,
  },
  server: {
    fs: { allow: [resolve(import.meta.dirname)] },
    proxy: { "/api": "http://127.0.0.1:3001" },
  },
}));
