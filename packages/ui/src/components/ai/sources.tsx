import * as React from "react";

import { ArrowUpRightIcon } from "../../icons";
import { cn } from "../../lib/utils";
import { BrandLogo, type BrandName } from "../../logos/registry";
import { Progress } from "../progress";

/*
 * Sources an answer was built from (Figma page 30 "Source item") and the retrieval trace
 * panel from the Ask screen (page 31).
 */

function SourceList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol data-slot="source-list" className={cn("flex flex-col gap-1.5", className)} {...props} />
  );
}

function SourceItem({
  index,
  title,
  path,
  source,
  href,
  className,
  ...props
}: Omit<React.ComponentProps<"li">, "title"> & {
  index?: number;
  title: React.ReactNode;
  path?: React.ReactNode;
  source?: BrandName;
  href?: string;
}) {
  const body = (
    <>
      {index !== undefined ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-2xs text-fg-secondary">
          {index}
        </span>
      ) : null}
      {source ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border bg-background">
          <BrandLogo name={source} size={16} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-13 font-medium text-foreground">{title}</span>
        {path ? <span className="truncate text-xs text-fg-tertiary">{path}</span> : null}
      </span>
      {href ? (
        <ArrowUpRightIcon className="text-icon-secondary transition-colors group-hover/source:text-icon" />
      ) : null}
    </>
  );
  return (
    <li data-slot="source-item" className={cn("list-none", className)} {...props}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group/source flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5 outline-none transition-colors hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          {body}
        </a>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
          {body}
        </div>
      )}
    </li>
  );
}

export type RetrievedChunk = {
  title: string;
  source: BrandName;
  path?: string;
  /** 0-1 relevance after reranking. */
  score: number;
  href?: string;
};

/** Ranked chunks with relevance bars, for debugging why an answer said what it said. */
function RetrievalTrace({
  chunks,
  summary,
  className,
  ...props
}: React.ComponentProps<"div"> & { chunks: RetrievedChunk[]; summary?: React.ReactNode }) {
  return (
    <div data-slot="retrieval-trace" className={cn("flex flex-col gap-3", className)} {...props}>
      {summary ? <p className="text-xs text-fg-tertiary">{summary}</p> : null}
      <ol className="flex flex-col gap-2">
        {chunks.map((chunk, i) => (
          <li
            key={`${chunk.source}-${chunk.title}`}
            className="flex flex-col gap-2 rounded-lg border bg-background p-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-3 text-center font-mono text-2xs text-fg-tertiary">{i + 1}</span>
              <BrandLogo name={chunk.source} size={14} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-13 font-medium">{chunk.title}</span>
                {chunk.path ? (
                  <span className="truncate text-xs text-fg-tertiary">{chunk.path}</span>
                ) : null}
              </span>
              {chunk.href ? (
                <a
                  href={chunk.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${chunk.title}`}
                  className="rounded-sm p-1 text-icon-secondary hover:bg-hover hover:text-icon"
                >
                  <ArrowUpRightIcon size={14} />
                </a>
              ) : null}
            </div>
            <div className="flex items-center gap-2 pl-5.5">
              <span className="text-2xs text-fg-tertiary">relevance</span>
              <Progress
                value={Math.round(chunk.score * 100)}
                className="flex-1"
                aria-label="Relevance"
              />
              <span className="font-mono text-2xs tabular-nums text-fg-secondary">
                {chunk.score.toFixed(2)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { SourceList, SourceItem, RetrievalTrace };
