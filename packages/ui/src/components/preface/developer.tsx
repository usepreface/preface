"use client";

import * as React from "react";

import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import {
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  MoreHorizontalIcon,
} from "../../icons";
import { cn } from "../../lib/utils";
import { Badge } from "../badge";
import { Button } from "../button";
import { HttpMethod } from "./data-display";

/*
 * Developer surfaces from Figma page 29 (Code & keys): install command, API key field,
 * endpoint, env var and log rows.
 */

function CopiedPill({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 rounded-sm bg-success-bg px-2.5 text-xs font-medium text-success-fg",
        size === "lg" ? "h-9" : "h-7",
      )}
    >
      <CheckIcon size={14} />
      Copied
    </span>
  );
}

/** One-line install. `lg` is for the landing hero and README; default for docs and onboarding. */
function InstallCommand({
  command,
  size = "default",
  prompt = "$",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  command: string;
  size?: "default" | "lg";
  prompt?: string;
}) {
  const { copied, copy } = useCopyToClipboard();
  const lg = size === "lg";
  return (
    <div
      data-slot="install-command"
      data-size={size}
      className={cn(
        "inline-flex max-w-full items-center gap-2.5 border border-border-default bg-surface-2 pr-1.5 font-mono text-foreground",
        lg ? "h-13 rounded-xl pl-4.5 text-[15px]" : "h-10 rounded-lg pl-3.5 text-13",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="text-fg-tertiary select-none">
        {prompt}
      </span>
      <code className="min-w-0 flex-1 truncate">{command}</code>
      <span className={lg ? "w-6" : "w-3"} />
      {copied ? (
        <CopiedPill size={lg ? "lg" : "sm"} />
      ) : (
        <Button
          variant="ghost"
          size={lg ? "icon" : "icon-sm"}
          aria-label="Copy command"
          onClick={() => void copy(command)}
        >
          <CopyIcon />
        </Button>
      )}
    </div>
  );
}

/** Masked by default; reveal is per session. Show the full key only once, at creation. */
function ApiKeyField({
  value,
  visibleChars = 4,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { value: string; visibleChars?: number }) {
  const [revealed, setRevealed] = React.useState(false);
  const { copied, copy } = useCopyToClipboard();
  const prefix = value.match(/^[a-z]+_[a-z]+_/)?.[0] ?? "";
  const masked =
    prefix +
    "•".repeat(Math.max(value.length - prefix.length - visibleChars, 8)) +
    value.slice(-visibleChars);
  return (
    <div
      data-slot="api-key-field"
      className={cn(
        "flex h-10 w-full items-center gap-1 rounded-md border border-border-default bg-background pr-1 pl-3",
        className,
      )}
      {...props}
    >
      <KeyIcon className="mr-1 text-icon-secondary" />
      <code
        className={cn(
          "min-w-0 flex-1 truncate font-mono text-13",
          revealed ? "text-foreground" : "text-fg-secondary",
        )}
      >
        {revealed ? value : masked}
      </code>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={revealed ? "Hide key" : "Reveal key"}
        onClick={() => setRevealed((r) => !r)}
      >
        {revealed ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
      {copied ? (
        <CopiedPill />
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy key"
          onClick={() => void copy(value)}
        >
          <CopyIcon />
        </Button>
      )}
    </div>
  );
}

function RowShell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 border-b bg-background px-4 last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

/** API reference row. */
function EndpointRow({
  method,
  path,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"a">, "children"> & {
  method: React.ComponentProps<typeof HttpMethod>["method"];
  path: string;
  description?: React.ReactNode;
}) {
  return (
    <a
      data-slot="endpoint-row"
      className={cn(
        "group/endpoint flex h-12 items-center gap-3 border-b bg-background px-4 outline-none transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2",
        className,
      )}
      {...props}
    >
      <span className="w-15">
        <HttpMethod method={method} />
      </span>
      <code className="font-mono text-13 text-foreground">{path}</code>
      <span className="flex-1 truncate text-13 text-fg-tertiary">{description}</span>
      <ChevronRightIcon className="text-icon-secondary transition-transform group-hover/endpoint:translate-x-0.5" />
    </a>
  );
}

/** Self-hosted configuration row. Secrets are write-only from the UI. */
function EnvVarRow({
  name,
  value,
  secret = false,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  name: string;
  value: string;
  secret?: boolean;
  actions?: React.ReactNode;
}) {
  const { copied, copy } = useCopyToClipboard();
  return (
    <RowShell data-slot="env-var-row" className={cn("pr-2", className)} {...props}>
      <code className="w-56 shrink-0 truncate font-mono text-13 font-medium text-foreground">
        {name}
      </code>
      <code className="min-w-0 flex-1 truncate font-mono text-13 text-fg-secondary">
        {secret ? "•".repeat(20) : value}
      </code>
      {secret ? <Badge tone="warning">Secret</Badge> : null}
      {secret ? null : (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={copied ? "Copied" : `Copy ${name}`}
          onClick={() => void copy(value)}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      )}
      {actions ?? (
        <Button variant="ghost" size="icon-sm" aria-label={`${name} actions`}>
          <MoreHorizontalIcon />
        </Button>
      )}
    </RowShell>
  );
}

const levelTone = {
  info: { row: "", tag: "text-fg-tertiary" },
  warn: { row: "bg-warning-bg/50", tag: "text-warning-fg" },
  error: { row: "bg-danger-bg/60", tag: "text-danger-fg" },
} as const;

/** Sync and request log line. */
function LogLine({
  time,
  level = "info",
  source,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  time: string;
  level?: keyof typeof levelTone;
  source?: string;
}) {
  return (
    <div
      data-slot="log-line"
      data-level={level}
      className={cn(
        "flex items-baseline gap-4 px-4 py-1.5 font-mono text-xs",
        levelTone[level].row,
        className,
      )}
      {...props}
    >
      <span className="shrink-0 text-fg-tertiary tabular-nums">{time}</span>
      <span className={cn("w-11 shrink-0 font-bold uppercase", levelTone[level].tag)}>{level}</span>
      {source ? <span className="w-44 shrink-0 truncate text-fg-secondary">{source}</span> : null}
      <span className="min-w-0 flex-1 text-foreground">{children}</span>
    </div>
  );
}

export { InstallCommand, ApiKeyField, EndpointRow, EnvVarRow, LogLine };
