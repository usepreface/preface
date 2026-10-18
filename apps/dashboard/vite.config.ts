import { fileURLToPath } from "node:url";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defineConfig, type Plugin } from "vite";

const src = fileURLToPath(new URL("./src/", import.meta.url));

/**
 * `#/…` points at this app's src/, like the `#/*` imports of the workspace packages. Only imports
 * from src/ are rewritten, so `@usepreface/protocol` keeps resolving its own `#/*` imports.
 */
function sourceImports(): Plugin {
  return {
    name: "dashboard:source-imports",
    enforce: "pre",
    resolveId(id, importer, options) {
      if (!id.startsWith("#/") || !importer?.startsWith(src)) return null;
      return this.resolve(src + id.slice(2), importer, { ...options, skipSelf: true });
    },
  };
}

export default defineConfig(({ mode }) => ({
  envDir: mode === "test" ? false : fileURLToPath(new URL(".", import.meta.url)),
  envPrefix: mode === "test" ? [] : "VITE_",
  resolve: {
    dedupe: ["react", "react-dom"],
    // Workspace packages are compiled from source, as in tsconfig's customConditions.
    conditions: ["preface-source", ...defaultClientConditions],
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: false } },
  },
  preview: { port: 3000, strictPort: true },
  plugins: [
    sourceImports(),
    // File-based routes in src/routes; regenerates src/routeTree.gen.ts on change.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
}));
