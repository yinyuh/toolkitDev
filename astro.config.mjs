// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.toolkit.ren",
  build: {
    inlineStylesheets: "always",
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
    optimizeDeps: {
      include: [
        "lucide-react",
        "file-saver",
        "date-fns",
        "date-fns-tz",
        "react-icons/hi",
        "sonner"
      ],
      exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
    },
  },
});
