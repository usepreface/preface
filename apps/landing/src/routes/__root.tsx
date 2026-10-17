import type * as React from "react";

import { createRootRoute, HeadContent, Link, Scripts } from "@tanstack/react-router";

import { ThemeProvider } from "@usepreface/ui/components/theme-provider";

import { site } from "../site";

import styles from "../styles.css?url";

// Runs before first paint: applies the saved theme so the prerendered page never flashes, and
// marks that JavaScript runs, which arms the scroll reveals (see styles.css).
const bootScript = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("preface-theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.add(d?"dark":"light")}catch(e){}`;

const ogImage = `${site.origin}/og-image.png`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: site.title },
      { name: "description", content: site.description },
      { name: "robots", content: site.indexable ? "index, follow" : "noindex, nofollow" },
      { name: "color-scheme", content: "light dark" },
      { name: "theme-color", content: "#fbfcfd", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0a0b0d", media: "(prefers-color-scheme: dark)" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:url", content: site.origin },
      { property: "og:title", content: site.title },
      { property: "og:description", content: site.description },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Preface: ask your company anything." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: site.title },
      { name: "twitter:description", content: site.description },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "canonical", href: site.origin },
      { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg", sizes: "any" },
      { rel: "icon", type: "image/png", href: "/favicon-32x32.png", sizes: "32x32" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* oxlint-disable-next-line react/no-danger -- static, code-owned script */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-fg-tertiary uppercase">404</p>
      <h1 className="text-display-md">This page is not here.</h1>
      <Link to="/" className="text-fg-link underline underline-offset-4">
        Back to preface.run
      </Link>
    </main>
  );
}
