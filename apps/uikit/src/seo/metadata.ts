import { findSeoPage, siteDescription, siteName } from "./pages.js";

export type SiteConfig = {
  readonly origin: string | undefined;
  readonly indexable: boolean;
};

type MetaTag = {
  readonly name?: string;
  readonly property?: string;
  readonly content: string;
};

export function pageMetadata(pathname: string, site: SiteConfig) {
  const page = findSeoPage(pathname);
  const title = `${page?.title ?? "Page not found"} | ${siteName}`;
  const description =
    page?.description ??
    "This page could not be found. Explore the Preface UI kit to find components, design tokens, and brand assets.";
  const canonical = site.origin && page ? new URL(page.path, site.origin).href : undefined;
  const image = site.origin ? new URL("/og-image.png", site.origin).href : "/og-image.png";
  const imageAlt =
    "Preface UI Kit — The Preface interface, as code. React components, tokens, and product patterns.";
  const meta: readonly MetaTag[] = [
    { name: "description", content: description },
    {
      name: "robots",
      content:
        site.indexable && page ? "index, follow, max-image-preview:large" : "noindex, follow",
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteName },
    { property: "og:locale", content: "en_US" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(canonical ? [{ property: "og:url", content: canonical }] : []),
    { property: "og:image", content: image },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];

  const structuredData =
    canonical && page
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${site.origin}/#website`,
              name: siteName,
              description: siteDescription,
              url: `${site.origin}/`,
              inLanguage: "en-US",
            },
            {
              "@type": "WebPage",
              "@id": `${canonical}#webpage`,
              url: canonical,
              name: title,
              description,
              isPartOf: { "@id": `${site.origin}/#website` },
              inLanguage: "en-US",
            },
          ],
        }
      : undefined;

  return { title, description, canonical, meta, structuredData };
}
