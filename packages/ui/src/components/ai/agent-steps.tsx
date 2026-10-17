"use client";

import * as React from "react";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  LoaderIcon,
  SearchIcon,
  TerminalIcon,
} from "../../icons";
import { cn } from "../../lib/utils";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "../trace";

/*
 * Agent steps (AI Elements patterns, ui.shadcn.com/docs/ai-elements), built on Trace:
 *   Reasoning - "Thinking" while it streams, "Thought for 4s" after; opens while running
 *   ToolCall  - one tool invocation with its input and output
 *   SearchStep - a retrieval step listing what was searched
 * Wrap several steps in <AgentSteps> (a Trace) so they share one rhythm.
 */

const AgentSteps = Trace;

function useAutoOpen(running: boolean) {
  const [userOpen, setUserOpen] = React.useState<boolean | undefined>(undefined);
  return { open: userOpen ?? running, onOpenChange: (next: boolean) => setUserOpen(next) };
}

function Reasoning({
  running = false,
  seconds,
  children,
  className,
}: {
  running?: boolean;
  /** How long the model thought, measured on the server. */
  seconds?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useAutoOpen(running);
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>
        {running ? <LoaderIcon className="animate-spin" /> : <CheckCircleIcon />}
      </TraceIcon>
      <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
      {!running && seconds !== undefined ? <TraceDescription>{seconds}s</TraceDescription> : null}
    </TraceLine>
  );
  if (!children) {
    return line;
  }
  return (
    <TraceCollapsible open={open} onOpenChange={onOpenChange} className={className}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">{children}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

export type ToolState = "pending" | "running" | "done" | "error";

function stateIcon(state: ToolState, icon: React.ReactNode) {
  if (state === "running") return <LoaderIcon className="animate-spin" />;
  if (state === "error") return <AlertCircleIcon />;
  if (state === "pending") return <ClockIcon />;
  return icon;
}

function ToolCall({
  name,
  state = "done",
  description,
  icon = <TerminalIcon />,
  input,
  output,
  className,
}: {
  /** What the tool did, in words: "Ran pnpm build", "Searched Notion". */
  name: React.ReactNode;
  state?: ToolState;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  input?: React.ReactNode;
  output?: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useAutoOpen(state === "error");
  const line = (
    <TraceLine status={state === "done" ? undefined : state}>
      <TraceIcon>{stateIcon(state, icon)}</TraceIcon>
      <TraceTitle>{name}</TraceTitle>
      {description ? <TraceDescription>{description}</TraceDescription> : null}
    </TraceLine>
  );
  if (!input && !output) {
    return line;
  }
  return (
    <TraceCollapsible open={open} onOpenChange={onOpenChange} className={className}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <div className="flex flex-col gap-2">
          {input ? <ToolPayload label="Input">{input}</ToolPayload> : null}
          {output ? (
            <ToolPayload
              label={state === "error" ? "Error" : "Output"}
              tone={state === "error" ? "danger" : "default"}
            >
              {output}
            </ToolPayload>
          ) : null}
        </div>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ToolPayload({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="tool-payload"
      className={cn(
        "overflow-hidden rounded-md border bg-surface-2",
        tone === "danger" && "border-danger/40 bg-danger-bg",
      )}
    >
      <div
        className={cn(
          "border-b px-2.5 py-1 text-overline text-fg-tertiary",
          tone === "danger" && "border-danger/30 text-danger-fg",
        )}
      >
        {label}
      </div>
      <pre className="overflow-x-auto px-2.5 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground">
        {children}
      </pre>
    </div>
  );
}

/** A retrieval step: which sources were searched and how many chunks came back. */
function SearchStep({
  query,
  results,
  running = false,
  children,
}: {
  query: React.ReactNode;
  results?: number;
  running?: boolean;
  children?: React.ReactNode;
}) {
  const { open, onOpenChange } = useAutoOpen(false);
  const line = (
    <TraceLine status={running ? "running" : undefined}>
      <TraceIcon>{running ? <LoaderIcon className="animate-spin" /> : <SearchIcon />}</TraceIcon>
      <TraceTitle>
        {running ? "Searching" : "Searched"} {query}
      </TraceTitle>
      {!running && results !== undefined ? (
        <TraceDescription>{results} results</TraceDescription>
      ) : null}
    </TraceLine>
  );
  if (!children) {
    return line;
  }
  return (
    <TraceCollapsible open={open} onOpenChange={onOpenChange}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>{children}</TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

export { AgentSteps, Reasoning, ToolCall, ToolPayload, SearchStep };
