import { defineConfig } from "@tanstack/start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    preset: "vercel",
  },
  vite: {
    plugins: [
      tailwindcss(),
      tsConfigPaths(),
    ],
    build: {
      chunkSizeWarningLimit: 2000,
    },
  },
});
