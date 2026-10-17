"use client";

import * as React from "react";

import { PrefaceMark } from "../../brand";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  RefreshIcon,
  SparklesIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UsersIcon,
} from "../../icons";
import { cn } from "../../lib/utils";
import { BrandLogo, type BrandName } from "../../logos/registry";
import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

/*
 * Chat building blocks from Figma page 30 (Chat components) and page 34 (Chat widget).
 * Messages: the user speaks in a right-aligned bubble; Preface answers without one.
 */

/** Preface's avatar in chat: flat slate tile with the ice mark. */
function AssistantAvatar({
  size = 24,
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & { size?: number }) {
  return (
    <span
      data-slot="assistant-avatar"
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: "#16191F",
        ...style,
      }}
      {...props}
    >
      <PrefaceMark tone="ice" size={Math.round(size * 0.62)} title="" />
    </span>
  );
}

function UserMessage({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="user-message"
      data-role="user"
      className={cn("flex w-full justify-end", className)}
      {...props}
    >
      <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-surface-3 px-3.5 py-2.5 text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}

function AssistantMessage({
  name = "Preface",
  meta,
  avatar,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  name?: React.ReactNode;
  meta?: React.ReactNode;
  avatar?: React.ReactNode;
}) {
  return (
    <div
      data-slot="assistant-message"
      data-role="assistant"
      className={cn("flex w-full flex-col gap-3", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        {avatar ?? <AssistantAvatar />}
        <span className="text-sm font-semibold text-foreground">{name}</span>
        {meta ? <span className="text-xs text-fg-tertiary">{meta}</span> : null}
      </div>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground [&_code]:rounded-xs [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-fg-accent">
        {children}
      </div>
    </div>
  );
}

type ThinkingStage = "searching" | "reading" | "writing";

/** Shows what Preface is doing, not just that it is busy. */
function ThinkingIndicator({
  stage = "searching",
  sources = ["github", "notion", "slack"],
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & { stage?: ThinkingStage; sources?: BrandName[] }) {
  const label =
    children ??
    (stage === "searching"
      ? `Searching ${sources.length} sources…`
      : stage === "reading"
        ? "Reading sources…"
        : "Writing answer…");
  return (
    <div
      data-slot="thinking-indicator"
      data-stage={stage}
      role="status"
      className={cn(
        "inline-flex w-fit items-center gap-2.5 rounded-full bg-surface-2 py-2 pr-3 pl-2.5",
        className,
      )}
      {...props}
    >
      {stage === "searching" ? (
        <span className="flex -space-x-1.5">
          {sources.slice(0, 3).map((s) => (
            <span
              key={s}
              className="flex size-5 items-center justify-center rounded-full bg-background ring-2 ring-surface-2"
            >
              <BrandLogo name={s} size={12} />
            </span>
          ))}
        </span>
      ) : (
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-pulse rounded-full bg-primary"
              style={{ animationDelay: `${i * 160}ms`, opacity: 1 - i * 0.3 }}
            />
          ))}
        </span>
      )}
      <span className="shimmer text-13 text-fg-secondary">{label}</span>
    </div>
  );
}

function IconAction({
  label,
  className,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={className}
            {...props}
          />
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type FeedbackValue = "up" | "down" | null;

/** Copy, rate and retry an answer. */
function FeedbackBar({
  text,
  value: valueProp,
  onValueChange,
  onRetry,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onChange"> & {
  /** Text copied by the copy button. */
  text?: string;
  value?: FeedbackValue;
  onValueChange?: (value: FeedbackValue) => void;
  onRetry?: () => void;
}) {
  const [local, setLocal] = React.useState<FeedbackValue>(null);
  const value = valueProp === undefined ? local : valueProp;
  const set = (next: FeedbackValue) => {
    setLocal(next);
    onValueChange?.(next);
  };
  const { copied, copy } = useCopyToClipboard();
  const hint =
    value === "up"
      ? "Thanks - noted for this source."
      : value === "down"
        ? "Thanks. Want to ask a human?"
        : "Was this helpful?";
  return (
    <div data-slot="feedback-bar" className={cn("flex items-center gap-0.5", className)} {...props}>
      {text !== undefined ? (
        <IconAction label={copied ? "Copied" : "Copy answer"} onClick={() => void copy(text)}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </IconAction>
      ) : null}
      <IconAction
        label="Helpful"
        aria-pressed={value === "up"}
        onClick={() => set(value === "up" ? null : "up")}
        className="aria-pressed:bg-primary-subtle aria-pressed:text-fg-accent"
      >
        <ThumbsUpIcon />
      </IconAction>
      <IconAction
        label="Not helpful"
        aria-pressed={value === "down"}
        onClick={() => set(value === "down" ? null : "down")}
        className="aria-pressed:bg-danger-bg aria-pressed:text-danger-fg"
      >
        <ThumbsDownIcon />
      </IconAction>
      {onRetry ? (
        <IconAction label="Regenerate" onClick={onRetry}>
          <RefreshIcon />
        </IconAction>
      ) : null}
      <span className="ml-1.5 text-xs text-fg-tertiary" aria-live="polite">
        {hint}
      </span>
    </div>
  );
}

/** Starter question shown before the first message. */
function Suggestion({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="suggestion"
      className={cn(
        "inline-flex h-8 w-fit items-center gap-2 rounded-full border border-border-default bg-background pr-3 pl-2.5 text-13 text-foreground outline-none transition-colors",
        "hover:border-border-strong hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SparklesIcon size={14} className="text-icon-accent" />
      {children}
    </button>
  );
}

function Suggestions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="suggestions" className={cn("flex flex-wrap gap-2", className)} {...props} />
  );
}

/** "Still stuck?" hand-off to a human, shown after a thumbs-down or low confidence. */
function EscalationCard({
  title = "Still stuck?",
  description = "We’ll open a thread in #support with this conversation attached.",
  action = "Talk to a human",
  onAction,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
}) {
  return (
    <div
      data-slot="escalation-card"
      className={cn("flex items-center gap-3 rounded-xl bg-surface-2 py-3 pr-3 pl-3.5", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-13 font-medium text-foreground">{title}</span>
        <span className="text-xs text-fg-tertiary">{description}</span>
      </div>
      <Button variant="outline" size="sm" onClick={onAction}>
        <UsersIcon data-icon="inline-start" />
        {action}
      </Button>
    </div>
  );
}

/** Floating button that opens the chat widget. Uses the customer's accent through --primary. */
function ChatLauncher({
  open = false,
  label,
  className,
  ...props
}: React.ComponentProps<"button"> & { open?: boolean; label?: string }) {
  const pill = Boolean(label) && !open;
  return (
    <button
      type="button"
      data-slot="chat-launcher"
      data-open={open || undefined}
      aria-label={open ? "Close chat" : (label ?? "Ask AI")}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground shadow-md outline-none transition-[background-color,box-shadow,transform]",
        "hover:bg-primary-hover hover:shadow-xl focus-visible:ring-3 focus-visible:ring-focus-ring active:scale-95",
        "data-open:bg-inverse data-open:text-fg-inverse",
        pill ? "h-12 pr-5 pl-4 text-[15px] font-semibold" : "size-14",
        className,
      )}
      {...props}
    >
      {open ? (
        <CloseIcon size={22} />
      ) : pill ? (
        <>
          <SparklesIcon size={18} />
          {label}
        </>
      ) : (
        <PrefaceMark tone="white" size={24} title="" />
      )}
    </button>
  );
}

export {
  AssistantAvatar,
  UserMessage,
  AssistantMessage,
  ThinkingIndicator,
  FeedbackBar,
  Suggestion,
  Suggestions,
  EscalationCard,
  ChatLauncher,
};
export type { FeedbackValue, ThinkingStage };
