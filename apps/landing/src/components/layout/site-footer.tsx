import * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { ArrowUpIcon } from "@usepreface/ui/icons";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";

import { useScrollProgress } from "../../hooks/use-scroll-progress";
import { site } from "../../site";

/* Figma "Footer": brand, link columns, the legal line, and the oversized wordmark. */

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["Sources", "#integrations"],
      ["Channels", "#integrations"],
      ["API & SDKs", "#developers"],
      ["MCP server", "#developers"],
      ["Changelog", `${site.github}/releases`],
    ],
  },
  {
    title: "Self-host",
    links: [
      ["Docker", "#self-host"],
      ["Kubernetes", "#self-host"],
      ["Models", "#self-host"],
      ["Security", "#features"],
    ],
  },
  {
    title: "Community",
    links: [
      ["GitHub", site.github],
      ["Issues", `${site.github}/issues`],
      ["npm", site.npm],
      ["Pricing", "#pricing"],
    ],
  },
];

const socialNames: Record<keyof typeof site.socials, string> = {
  github: "GitHub",
  x: "X",
  discord: "Discord",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  npm: "npm",
};

export function SiteFooter() {
  const wordmark = React.useRef<HTMLDivElement>(null);
  useScrollProgress(wordmark);
  const socials = Object.entries(site.socials) as [keyof typeof site.socials, string][];

  return (
    <footer className="relative overflow-hidden border-t bg-(--landing-canvas)">
      <div className="mx-auto flex max-w-300 flex-col gap-10 px-5 pt-12 sm:px-8 lg:px-0 lg:pt-18">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="flex w-80 flex-col gap-3.5">
            <PrefaceLogo size={24} />
            <p className="max-w-65 text-13 text-fg-secondary">
              The open-source knowledge platform you host yourself.
            </p>
            <ul className="flex gap-2">
              {socials.map(([key, href]) => (
                <li key={key}>
                  <a
                    href={href}
                    aria-label={socialNames[key]}
                    className="flex size-9 items-center justify-center rounded-[10px] border border-border-subtle text-icon-secondary outline-none transition-colors hover:border-border-default hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
                  >
                    <BrandLogo
                      name={key as BrandName}
                      size={16}
                      variant="mono"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav
            aria-label="Footer"
            className="grid flex-1 grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:flex lg:justify-end lg:gap-24"
          >
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-2.5">
                <h2 className="text-13 font-medium text-foreground">{column.title}</h2>
                <ul className="flex flex-col gap-2.5">
                  {column.links.map(([label, href]) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="rounded-sm text-13 text-fg-secondary outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-fg-tertiary">
          <p className="flex-1">
            © 2026 Preface contributors · Apache-2.0 · preface.run · github.com/usepreface
          </p>
          <a
            href="#top"
            className="flex items-center gap-1.5 rounded-sm text-fg-secondary outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            <ArrowUpIcon size={14} />
            Back to top
          </a>
        </div>
      </div>
      <div
        ref={wordmark}
        aria-hidden="true"
        className="mx-auto mt-10 flex h-24 max-w-300 justify-center overflow-hidden select-none sm:h-40 lg:h-62.5"
      >
        <span
          className="block bg-(image:--landing-wordmark) bg-clip-text font-display text-[8.25rem] leading-none font-medium tracking-[-0.08em] text-transparent sm:text-[12rem] lg:text-[19rem]"
          style={{ transform: "translateY(calc(max(0, 0.22 - var(--progress, 0.22)) * 180%))" }}
        >
          preface
        </span>
      </div>
    </footer>
  );
}
