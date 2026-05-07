import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "src",
  },
  server: {
    preset: "vercel",
  },
  vite: {
    plugins: [tailwindcss(), tsConfigPaths()],
    build: {
      chunkSizeWarningLimit: 2000,
    },
  },
});
