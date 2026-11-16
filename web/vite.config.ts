import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const backend = process.env.API_URL ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    // Mesma origem do backend em dev e em produção (Caddy): sem CORS.
    proxy: { "/api": backend, "/admin": backend, "/static": backend },
    // Bind mount do Windows no Docker não propaga eventos de arquivo.
    watch: process.env.WATCH_POLLING ? { usePolling: true, interval: 300 } : undefined,
  },
});
