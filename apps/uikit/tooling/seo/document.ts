import { pageMetadata, type SiteConfig } from "../../src/seo/metadata.js";
import { findSeoPage, seoPages, siteName } from "../../src/seo/pages.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function renderSeoDocument(template: string, pathname: string, site: SiteConfig): string {
  const { title, description, canonical, meta, structuredData } = pageMetadata(pathname, site);
  const page = findSeoPage(pathname);
  const head = [
    `<title data-seo>${escapeHtml(title)}</title>`,
    ...meta.map(
      (tag) =>
        `<meta data-seo ${tag.name ? `name="${tag.name}"` : `property="${tag.property}"`} content="${escapeHtml(tag.content)}" />`,
    ),
    ...(canonical ? [`<link data-seo rel="canonical" href="${escapeHtml(canonical)}" />`] : []),
    ...(structuredData
      ? [
          `<script data-seo type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>`,
        ]
      : []),
  ].join("\n    ");

  // Keep useful content and crawlable links available before JavaScript loads.
  const content = `<main class="seo-fallback">
    <p>${siteName}</p>
    <h1>${escapeHtml(page?.title ?? "Page not found")}</h1>
    <p>${escapeHtml(description)}</p>
    <nav aria-label="UI kit pages"><ul>${seoPages.map((entry) => `<li><a href="${entry.path}">${escapeHtml(entry.title)}</a></li>`).join("")}</ul></nav>
  </main>`;

  return template
    .replace(
      /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
      `<!--seo:start-->\n    ${head}\n    <!--seo:end-->`,
    )
    .replace(
      /<!--seo:content-->[\s\S]*?<!--seo:content-end-->/,
      `<!--seo:content-->${content}<!--seo:content-end-->`,
    );
}

export function renderRobots(site: SiteConfig): string {
  // Crawlers must be allowed to read the noindex directive on preview pages.
  return `User-agent: *\nAllow: /\n${site.indexable && site.origin ? `\nSitemap: ${site.origin}/sitemap.xml\n` : ""}`;
}

export function renderSitemap(site: SiteConfig): string {
  const urls = seoPages.map(
    (page) => `  <url><loc>${escapeHtml(new URL(page.path, site.origin).href)}</loc></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
