"use client";

import * as React from "react";

import { useHighlightedCode } from "../../hooks/use-highlighted-code";
import { cn } from "../../lib/utils";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
} from "../code-block";

/*
 * Tabbed code sample, per Figma page 29: cURL, Python and TypeScript tabs, copy always
 * visible. Dark is the default in both themes - it reads as code everywhere.
 */

export type CodeSample = {
  label: string;
  language: string;
  code: string;
  /** Shown on the right of the tabs while this sample is active, e.g. "route.ts". */
  filename?: string;
};

function HighlightedLines({ code, language }: { code: string; language: string }) {
  const lines = useHighlightedCode(code, language);
  return (
    <>
      {lines.map((line, index) => (
        <CodeBlockLine key={index}>{line}</CodeBlockLine>
      ))}
    </>
  );
}

function CodeSnippet({
  samples,
  title,
  theme = "dark",
  lineNumbers = false,
  defaultIndex = 0,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  samples: CodeSample[];
  /** Shown on the right of the tabs, e.g. "POST /v1/answers". */
  title?: React.ReactNode;
  /** dark: always dark (default). auto: follows the page theme. */
  theme?: "dark" | "auto";
  lineNumbers?: boolean;
  /** The tab that is open first. */
  defaultIndex?: number;
}) {
  const [active, setActive] = React.useState(defaultIndex);
  const sample = samples[active] ?? samples[0];
  if (!sample) {
    return null;
  }
  const heading = title ?? sample.filename;
  return (
    <div
      data-slot="code-snippet"
      className={cn(theme === "dark" && "dark", "min-w-0", className)}
      {...props}
    >
      <CodeBlock className="rounded-xl border-border bg-surface-1 text-foreground">
        <CodeBlockHeader className="gap-1 border-b pt-0 pb-0 pl-1.5">
          <div role="tablist" aria-label="Language" className="flex items-center">
            {samples.map((s, i) => (
              <button
                key={s.label}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-10 px-2.5 text-13 font-medium text-fg-tertiary outline-none transition-colors hover:text-foreground focus-visible:text-foreground",
                  "aria-selected:text-foreground aria-selected:after:absolute aria-selected:after:inset-x-2.5 aria-selected:after:-bottom-px aria-selected:after:h-0.5 aria-selected:after:rounded-full aria-selected:after:bg-primary",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {heading ? (
            <span className="ml-auto truncate pr-1 font-mono text-xs text-fg-tertiary">
              {heading}
            </span>
          ) : null}
          <CodeBlockActions className={heading ? "ms-1" : undefined}>
            <CodeBlockCopyButton value={sample.code} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers={lineNumbers} className="pt-3! text-13">
          <HighlightedLines code={sample.code} language={sample.language} />
        </CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

export { CodeSnippet };
