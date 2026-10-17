import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Only production deployments may be indexed. Previews and local builds ship `noindex`.
const indexable = (process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV) === "production";

export default defineConfig({
  define: {
    "import.meta.env.LANDING_SITE": JSON.stringify({
      origin: process.env.SITE_URL ?? "https://preface.run",
      indexable,
    }),
  },
  plugins: [
    tailwindcss(),
    // The page is static, so it is prerendered to HTML at build time. Nitro switches to its
    // Vercel preset when the build runs on Vercel.
    tanstackStart({
      srcDirectory: "src",
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
    }),
    react(),
    nitro(),
  ],
});
