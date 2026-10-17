import type * as React from "react";

import { ExplodedStack } from "./exploded-stack";
import { Section, SectionHeading } from "./primitives";

const steps = [
  ["01", "Connect", "GitHub, Slack, Discord, Telegram, Notion, Drive, websites and files."],
  ["02", "Parse", "Language-aware chunking for code, threads, tables and PDFs."],
  ["03", "Index", "Embeddings from your provider, BM25 alongside, permissions on every chunk."],
  ["04", "Retrieve", "Hybrid search, reranked, filtered to what the asker can read."],
  ["05", "Answer", "Streamed with citations to the widget, bots, API and MCP."],
] as const;

export function HowItWorks() {
  return (
    <Section id="how-it-works" aria-labelledby="how-title">
      <div className="grid items-center gap-12 lg:grid-cols-[460px_1fr] lg:gap-10">
        <div className="flex flex-col gap-8">
          <SectionHeading
            id="how-title"
            eyebrow="How it works"
            title="One stack, from source to sentence."
          />
          <ol className="flex flex-col max-lg:divide-y max-lg:divide-border lg:gap-8">
            {steps.map(([n, title, text], i) => (
              <li
                key={n}
                data-reveal=""
                style={{ "--delay": `${i * 70}ms` } as React.CSSProperties}
                className="flex gap-4 max-lg:py-3.5"
              >
                <span className="font-mono text-13 leading-5.5 font-medium text-fg-accent">
                  {n}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-heading-4 text-foreground">{title}</h3>
                  <p className="text-sm text-fg-secondary">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal="" className="max-md:hidden lg:-mr-30">
          <ExplodedStack />
        </div>
      </div>
    </Section>
  );
}
