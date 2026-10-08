// Standalone client-side build for the Android app: outputs static files to dist/.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r("./spa"),
  base: "./",
  publicDir: r("./public"),
  envDir: r("."),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": r("./src") }, dedupe: ["react", "react-dom", "@tanstack/react-router"] },
  define: { "process.env": "{}" },
  build: { outDir: r("./dist"), emptyOutDir: true },
});
