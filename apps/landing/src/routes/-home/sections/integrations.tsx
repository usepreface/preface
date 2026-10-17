import type * as React from "react";

import { brandLogos, BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";

import { Section } from "../components/section";
import { SectionHeading } from "../components/section-heading";

/* Figma "Integrations": 40 tiles, fading toward the edges so the cloud reads as endless. */

const logos: BrandName[] = [
  "github",
  "slack",
  "notion",
  "discord",
  "telegram",
  "google-drive",
  "confluence",
  "jira",
  "linear",
  "gitlab",
  "figma",
  "youtube",
  "dropbox",
  "microsoft-teams",
  "zendesk",
  "intercom",
  "google-docs",
  "gmail",
  "microsoft-sharepoint",
  "microsoft-onedrive",
  "openai",
  "anthropic",
  "ollama",
  "mistral",
  "gemini",
  "hugging-face",
  "aws",
  "azure",
  "postgresql",
  "redis",
  "docker",
  "kubernetes",
  "okta",
  "auth0",
  "vercel",
  "cursor",
  "model-context-protocol",
  "claude",
  "stripe",
  "zapier",
];

const COLS = 10;

export function Integrations() {
  return (
    <Section id="integrations" aria-labelledby="integrations-title" inner="items-center gap-12">
      <SectionHeading
        id="integrations-title"
        align="center"
        eyebrow="Integrations"
        title={
          <>
            Learns from your tools.
            <br className="max-sm:hidden" /> Answers in your tools.
          </>
        }
        description="40+ sources and channels, all open source. Missing one? The connector SDK is 200 lines."
      />
      <ul className="grid w-full max-w-[1066px] grid-cols-5 gap-2.5 sm:grid-cols-10 sm:gap-3 lg:gap-4">
        {logos.map((brand, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const d = Math.abs(col - 4.5) / 4.5;
          const fade = Math.max(0.15, 1 - d * d * 0.9);
          const mobileFade = i % 5 === 0 || i % 5 === 4 ? 0.45 : 1;
          return (
            <li
              key={brand}
              data-reveal=""
              title={brandLogos[brand].title}
              className="group aspect-square max-sm:[&:nth-child(n+21)]:hidden"
              style={
                {
                  "--fade": fade,
                  "--mobile-fade": mobileFade,
                  "--delay": `${(Math.abs(col - 4.5) + row) * 45}ms`,
                  "--rise": "14px",
                } as React.CSSProperties
              }
            >
              <span className="flex size-full items-center justify-center rounded-2xl opacity-(--mobile-fade) group-hover:opacity-100 sm:opacity-(--fade) sm:group-hover:opacity-100 border border-(--landing-tile-border) bg-(--landing-tile) shadow-[0_6px_16px_rgb(23_71_201/0.06)] transition-[translate,opacity,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_28px_rgb(23_71_201/0.14)] lg:rounded-3xl dark:shadow-none">
                <BrandLogo
                  name={brand}
                  className="size-[46%]"
                  aria-label={brandLogos[brand].title}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
