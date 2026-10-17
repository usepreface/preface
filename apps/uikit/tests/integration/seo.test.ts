import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "vite";
import { onTestFinished, test } from "vitest";

import { siteConfig } from "../../tooling/seo/site-config.js";
import { seoPlugin } from "../../tooling/seo/vite-plugin.js";

test("production HTML and discovery files share the Vercel production origin", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "preface-uikit-seo-"));
  onTestFinished(() => rm(outputDirectory, { recursive: true, force: true }));
  const site = siteConfig(
    {
      VERCEL_ENV: "production",
      VERCEL_URL: "uikit-deployment.example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "uikit.example.com",
    },
    true,
  );

  await build({
    configFile: false,
    logLevel: "silent",
    plugins: [seoPlugin(site)],
    // Build the real HTML template, without bundling the unrelated component gallery.
    resolve: {
      alias: {
        "/src/main.tsx": fileURLToPath(new URL("../fixtures/empty-entry.ts", import.meta.url)),
      },
    },
    build: { outDir: outputDirectory, emptyOutDir: true },
  });

  const typography = await readFile(join(outputDirectory, "foundations/type.html"), "utf8");
  const button = await readFile(join(outputDirectory, "lab/button.html"), "utf8");
  const notFound = await readFile(join(outputDirectory, "404.html"), "utf8");
  const sitemap = await readFile(join(outputDirectory, "sitemap.xml"), "utf8");
  const robots = await readFile(join(outputDirectory, "robots.txt"), "utf8");

  assert.match(typography, /<title data-seo>Typography \| Preface UI Kit<\/title>/);
  assert.match(typography, /rel="canonical" href="https:\/\/uikit.example.com\/foundations\/type"/);
  assert.match(
    typography,
    /property="og:image" content="https:\/\/uikit.example.com\/og-image.png"/,
  );
  assert.match(typography, /content="index, follow, max-image-preview:large"/);
  assert.match(typography, /<h1>Typography<\/h1>/);
  assert.match(typography, /href="\/lab\/button"/);
  assert.equal((typography.match(/<title\b/g) ?? []).length, 1);
  assert.match(button, /Button component \| Preface UI Kit/);
  assert.match(sitemap, /<loc>https:\/\/uikit.example.com\/lab\/button<\/loc>/);
  assert.doesNotMatch(sitemap, /\/404|deployment.example.com/);
  assert.match(robots, /Sitemap: https:\/\/uikit.example.com\/sitemap.xml/);
  assert.match(notFound, /content="noindex, follow"/);
  assert.doesNotMatch(notFound, /rel="canonical"/);
});

test("preview builds stay noindex even when Vercel provides a production domain", async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), "preface-uikit-preview-"));
  onTestFinished(() => rm(outputDirectory, { recursive: true, force: true }));
  const site = siteConfig(
    { VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "uikit.example.com" },
    true,
  );

  await build({
    configFile: false,
    logLevel: "silent",
    plugins: [seoPlugin(site)],
    resolve: {
      alias: {
        "/src/main.tsx": fileURLToPath(new URL("../fixtures/empty-entry.ts", import.meta.url)),
      },
    },
    build: { outDir: outputDirectory, emptyOutDir: true },
  });

  const html = await readFile(join(outputDirectory, "preface/onboarding.html"), "utf8");
  const robots = await readFile(join(outputDirectory, "robots.txt"), "utf8");

  assert.match(html, /Onboarding template \| Preface UI Kit/);
  assert.match(html, /content="noindex, follow"/);
  assert.doesNotMatch(robots, /Sitemap:|Disallow: \//);
  await assert.rejects(stat(join(outputDirectory, "sitemap.xml")), { code: "ENOENT" });
});

test("a production build fails when Vercel cannot supply a public URL", () => {
  assert.throws(
    () => siteConfig({ VERCEL_ENV: "production" }, true),
    /requires Vercel system environment variables/,
  );
});
