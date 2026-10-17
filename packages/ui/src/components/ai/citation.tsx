"use client";

import * as React from "react";

import { ArrowUpRightIcon } from "../../icons";
import { cn } from "../../lib/utils";
import { BrandLogo, type BrandName } from "../../logos/registry";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";

/*
 * Citations, per Figma page 30:
 *   InlineCitation - numbered marker after a claim; hover previews the source
 *   CitationChip   - pill under an answer: number, source logo, title
 */

export type CitationSource = {
  /** Display number, 1-based. */
  index: number;
  title: string;
  /** thesvg slug of the source app, e.g. "notion", "github", "slack". */
  source?: BrandName;
  /** Breadcrumb inside the source, e.g. "Engineering / Runbooks". */
  path?: string;
  /** Matched passage shown in the preview. */
  snippet?: string;
  href?: string;
  /** Retrieval relevance between 0 and 1. */
  score?: number;
};

function CitationMarker({
  index,
  active,
  className,
  ...props
}: React.ComponentProps<"span"> & { index: number; active?: boolean }) {
  return (
    <span
      data-slot="citation-marker"
      data-active={active || undefined}
      className={cn(
        "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[5px] bg-primary-subtle px-1 align-[1px] font-mono text-2xs font-medium text-fg-accent transition-colors",
        "hover:bg-primary hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground",
        className,
      )}
      {...props}
    >
      {index}
    </span>
  );
}

function CitationPreview({ citation }: { citation: CitationSource }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {citation.source ? (
          <span className="flex size-6 items-center justify-center rounded-sm border bg-background">
            <BrandLogo name={citation.source} size={14} />
          </span>
        ) : null}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-13 font-medium text-foreground">{citation.title}</span>
          {citation.path ? (
            <span className="truncate text-xs text-fg-tertiary">{citation.path}</span>
          ) : null}
        </div>
      </div>
      {citation.snippet ? (
        <p className="line-clamp-4 border-l-2 border-primary-subtle-hover pl-2.5 text-13 text-fg-secondary">
          {citation.snippet}
        </p>
      ) : null}
      {citation.score !== undefined || citation.href ? (
        <div className="flex items-center justify-between gap-2 text-xs text-fg-tertiary">
          {citation.score !== undefined ? (
            <span className="font-mono">relevance {citation.score.toFixed(2)}</span>
          ) : (
            <span />
          )}
          {citation.href ? (
            <a
              href={citation.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-fg-link underline-offset-4 hover:underline"
            >
              Open source
              <ArrowUpRightIcon size={12} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Numbered marker after a claim. Hover or focus shows where the claim came from. */
function InlineCitation({ citation, className }: { citation: CitationSource; className?: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={80}
        closeDelay={120}
        render={
          <button
            type="button"
            aria-label={`Source ${citation.index}: ${citation.title}`}
            className={cn(
              "mx-0.5 rounded-[5px] outline-none focus-visible:ring-3 focus-visible:ring-focus-ring",
              className,
            )}
          />
        }
      >
        <CitationMarker index={citation.index} />
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-80 p-3">
        <CitationPreview citation={citation} />
      </HoverCardContent>
    </HoverCard>
  );
}

/** Source pill shown in the citation row under an answer. */
function CitationChip({
  citation,
  className,
  ...props
}: Omit<React.ComponentProps<"a">, "children"> & { citation: CitationSource }) {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={300}
        render={
          <a
            data-slot="citation-chip"
            href={citation.href}
            target={citation.href ? "_blank" : undefined}
            rel={citation.href ? "noreferrer" : undefined}
            className={cn(
              "group/chip inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border-default bg-background py-0.5 pr-2.5 pl-0.5 text-xs font-medium text-foreground outline-none transition-colors",
              "hover:border-border-strong hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring",
              className,
            )}
            {...props}
          />
        }
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-mono text-2xs text-fg-accent">
          {citation.index}
        </span>
        {citation.source ? <BrandLogo name={citation.source} size={14} /> : null}
        <span className="truncate">{citation.title}</span>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-80 p-3">
        <CitationPreview citation={citation} />
      </HoverCardContent>
    </HoverCard>
  );
}

function CitationList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="citation-list" className={cn("flex flex-wrap gap-1.5", className)} {...props} />
  );
}

export { CitationMarker, CitationPreview, InlineCitation, CitationChip, CitationList };
