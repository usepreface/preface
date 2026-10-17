import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import type { Plugin } from "vite";

import type { SiteConfig } from "../../src/seo/metadata.js";
import { findSeoPage, seoPages } from "../../src/seo/pages.js";
import { renderRobots, renderSeoDocument, renderSitemap } from "./document.js";

export function seoPlugin(site: SiteConfig): Plugin {
  let outputDirectory: string;
  let templatePath: string;

  return {
    name: "preface-uikit-seo",
    enforce: "post",
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
      templatePath = resolve(config.root, "index.html");
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (pathname === "/robots.txt") {
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(renderRobots(site));
          return;
        }

        if (request.headers.accept?.includes("text/html") && !pathname.includes(".")) {
          void (async () => {
            const template = await readFile(templatePath, "utf8");
            const html = await server.transformIndexHtml(pathname, template);
            response.statusCode = findSeoPage(pathname) ? 200 : 404;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(html);
          })().catch(next); // oxlint-disable-line promise/no-callback-in-promise -- Forward rejected promises to Connect's error boundary.
          return;
        }
        next();
      });
    },
    transformIndexHtml: {
      order: "post",
      handler(html, context) {
        const pathname = context.server
          ? new URL(context.originalUrl ?? context.path, "http://localhost").pathname
          : "/";
        return renderSeoDocument(html, pathname, site);
      },
    },
    async writeBundle() {
      const template = await readFile(resolve(outputDirectory, "index.html"), "utf8");
      const routes = [
        ...seoPages.map((page) => ({
          pathname: page.path,
          filename: page.path === "/" ? "index.html" : `${page.path.slice(1)}.html`,
        })),
        { pathname: "/404", filename: "404.html" },
      ];

      await Promise.all(
        routes.map(async ({ pathname, filename }) => {
          const target = resolve(outputDirectory, filename);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, renderSeoDocument(template, pathname, site));
        }),
      );

      await writeFile(resolve(outputDirectory, "robots.txt"), renderRobots(site));
      if (site.indexable && site.origin) {
        await writeFile(resolve(outputDirectory, "sitemap.xml"), renderSitemap(site));
      }
    },
  };
}
