import type * as React from "react";

import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";
import { CodeSnippet, type CodeSample } from "@usepreface/ui/preface/code-snippet";

import { site } from "../../site";
import { Section, SectionHeading } from "./primitives";

/* Figma "Developers": copy and package chips on the left, a tabbed code sample on the right. */

const samples: CodeSample[] = [
  {
    label: "cURL",
    language: "bash",
    filename: "terminal",
    code: `curl "$PREFACE_URL/v1/chat/completions" \\
  -H "Authorization: Bearer $PREFACE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "acme-knowledge",
    "messages": [{ "role": "user", "content": "How do I rotate staging credentials?" }]
  }'`,
  },
  {
    label: "Python",
    language: "python",
    filename: "ask.py",
    code: `import os
from openai import OpenAI

client = OpenAI(base_url=f"{os.environ['PREFACE_URL']}/v1", api_key=os.environ["PREFACE_API_KEY"])

answer = client.chat.completions.create(
    model="acme-knowledge",
    messages=[{"role": "user", "content": "How do I rotate staging credentials?"}],
)`,
  },
  {
    label: "TypeScript",
    language: "typescript",
    filename: "route.ts",
    code: `import { createPreface } from "@usepreface/ai-sdk";
import { streamText } from "ai";

const preface = createPreface({ baseURL: process.env.PREFACE_URL });

const result = streamText({
  model: preface("acme-knowledge"),
  prompt: "How do I rotate staging credentials?",
});`,
  },
];

const packages: [BrandName, string, string][] = [
  ["npm", "@usepreface/ai-sdk", site.npm],
  ["python", "usepreface", site.docs],
  ["github", "usepreface/preface", site.github],
];

export function Developers() {
  return (
    <Section id="developers" aria-labelledby="developers-title">
      <div className="grid items-center gap-12 lg:grid-cols-[460px_1fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <SectionHeading
            id="developers-title"
            eyebrow="For developers"
            title="Three lines to a cited answer."
            description="createPreface() for the Vercel AI SDK, an OpenAI-compatible /v1/chat, REST and an MCP server."
          />
          <ul data-reveal="" className="flex flex-wrap gap-2">
            {packages.map(([brand, name, href]) => (
              <li key={name}>
                <a
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-border-default px-3 py-1.5 font-mono text-xs text-foreground outline-none transition-colors hover:border-border-strong hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
                >
                  <BrandLogo name={brand} size={16} aria-hidden="true" />
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div
          data-reveal=""
          style={{ "--delay": "120ms" } as React.CSSProperties}
          className="min-w-0 lg:-mr-1"
        >
          <CodeSnippet
            samples={samples}
            defaultIndex={2}
            lineNumbers
            className="shadow-[0_30px_70px_rgb(23_71_201/0.16)] dark:shadow-none [&_[data-slot=code-block]]:rounded-2xl"
          />
        </div>
      </div>
    </Section>
  );
}
