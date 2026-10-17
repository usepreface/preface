import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { siteConfig } from "./tooling/seo/site-config.js";
import { seoPlugin } from "./tooling/seo/vite-plugin.js";

export default defineConfig(({ command }) => {
  const site = siteConfig(process.env, command === "build");

  return {
    appType: "mpa",
    define: { "import.meta.env.UIKIT_SITE": JSON.stringify(site) },
    plugins: [react(), tailwindcss(), seoPlugin(site)],
  };
});
