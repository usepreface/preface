"use client";

import * as React from "react";

import { CheckIcon, ChevronRightIcon, MoreHorizontalIcon } from "../../icons";
import { cn } from "../../lib/utils";
import type { BrandName } from "../../logos/registry";
import { Button } from "../button";
import { Progress } from "../progress";
import { Switch } from "../switch";
import { LogoTile, Sparkline, SyncStatus, type SyncState } from "./data-display";

/*
 * Cards from Figma page 28: source, channel, connector, settings and the onboarding checklist.
 */

function CardShell({
  danger,
  className,
  ...props
}: React.ComponentProps<"div"> & { danger?: boolean }) {
  return (
    <div
      data-danger={danger || undefined}
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground shadow-xs data-danger:border-danger",
        className,
      )}
      {...props}
    />
  );
}

function CardHead({
  media,
  title,
  description,
  action,
}: {
  media: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {media}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{title}</span>
        {description ? (
          <span className="truncate text-xs text-fg-tertiary">{description}</span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** A connected knowledge source with health and size. */
function SourceCard({
  brand,
  name,
  kind,
  state,
  status,
  progress,
  metrics,
  actions,
  menu,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  brand: BrandName;
  name: React.ReactNode;
  /** "GitHub · repository" */
  kind?: React.ReactNode;
  state: SyncState;
  /** Status detail: "Synced 4m ago". */
  status?: React.ReactNode;
  /** 0-100 while syncing. */
  progress?: number;
  metrics?: { label: React.ReactNode; value: React.ReactNode }[];
  /** Shown when the source failed: Reconnect, View logs. */
  actions?: React.ReactNode;
  /** Replaces the default "more" button. */
  menu?: React.ReactNode;
}) {
  return (
    <CardShell
      data-slot="source-card"
      danger={state === "failed"}
      className={cn("gap-4 p-5", className)}
      {...props}
    >
      <CardHead
        media={<LogoTile brand={brand} />}
        title={name}
        description={kind}
        action={
          menu ?? (
            <Button variant="ghost" size="icon-sm" aria-label="Source actions">
              <MoreHorizontalIcon />
            </Button>
          )
        }
      />
      <SyncStatus state={state}>{status}</SyncStatus>
      {state === "syncing" && progress !== undefined ? (
        <Progress value={progress} aria-label="Sync progress" />
      ) : null}
      {metrics?.length ? (
        <dl className="grid grid-flow-col gap-2">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <dd className="text-base font-medium tabular-nums">{m.value}</dd>
              <dt className="text-xs text-fg-tertiary">{m.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </CardShell>
  );
}

/** An output channel (widget, bot, MCP server) with an on/off switch and recent activity. */
function ChannelCard({
  media,
  name,
  description,
  enabled,
  onEnabledChange,
  series,
  footer,
  href,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  media: React.ReactNode;
  name: React.ReactNode;
  description?: React.ReactNode;
  enabled: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  series?: number[];
  footer?: React.ReactNode;
  href?: string;
}) {
  return (
    <CardShell data-slot="channel-card" className={cn("gap-3.5 p-5", className)} {...props}>
      <CardHead
        media={media}
        title={name}
        description={description}
        action={
          <Switch
            size="sm"
            checked={enabled}
            onCheckedChange={(v) => onEnabledChange?.(v)}
            aria-label="Enabled"
          />
        }
      />
      {series ? (
        <Sparkline values={series} tone={enabled ? "primary" : "neutral"} className="h-10" />
      ) : null}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex-1 text-fg-secondary">{footer ?? (enabled ? null : "Disabled")}</span>
        {href ? (
          <a href={href} className="font-medium text-fg-accent underline-offset-4 hover:underline">
            Configure →
          </a>
        ) : null}
      </div>
    </CardShell>
  );
}

/** Integration in the "Add a source" gallery. */
function ConnectorTile({
  brand,
  name,
  description,
  connected,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  brand: BrandName;
  name: React.ReactNode;
  description?: React.ReactNode;
  connected?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <CardShell
      data-slot="connector-tile"
      className={cn("gap-3 p-4 transition-colors hover:border-border-default", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <LogoTile brand={brand} size={40} />
        {connected ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success-fg">
            <CheckIcon size={12} />
            Connected
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{name}</span>
        {description ? (
          <span className="line-clamp-2 text-13 text-fg-secondary">{description}</span>
        ) : null}
      </div>
      {action ?? (
        <Button variant="outline" size="sm" className="w-fit">
          {connected ? "Manage" : "Connect"}
        </Button>
      )}
    </CardShell>
  );
}

/** Plane-style settings card: title and description left, action right. */
function SettingsCard({
  title,
  description,
  action,
  danger,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <CardShell
      data-slot="settings-card"
      danger={danger}
      className={cn("gap-4 px-6 py-5", className)}
      {...props}
    >
      <div className="flex items-center gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-semibold">{title}</span>
          {description ? <span className="text-13 text-fg-secondary">{description}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </CardShell>
  );
}

/** Label + description on the left, a control on the right, hairline between rows. */
function SettingRow({
  title,
  description,
  control,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "children"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <div
      data-slot="setting-row"
      className={cn("flex items-center gap-6 border-b py-4 last:border-b-0", className)}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description ? <span className="text-13 text-fg-secondary">{description}</span> : null}
      </div>
      {control}
    </div>
  );
}

export type ChecklistStep = {
  title: React.ReactNode;
  description?: React.ReactNode;
  done?: boolean;
  onClick?: () => void;
};

/** First-run checklist with progress. */
function OnboardingChecklist({
  title = "Get Preface answering",
  steps,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "children"> & {
  title?: React.ReactNode;
  steps: ChecklistStep[];
}) {
  const done = steps.filter((s) => s.done).length;
  return (
    <CardShell data-slot="onboarding-checklist" className={cn("gap-3.5 p-5", className)} {...props}>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-semibold">{title}</span>
        <span className="text-xs font-medium text-fg-secondary">
          {done} of {steps.length}
        </span>
      </div>
      <Progress value={(done / Math.max(steps.length, 1)) * 100} aria-label="Setup progress" />
      <ol className="flex flex-col gap-1">
        {steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={step.onClick}
              disabled={step.done}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-focus-ring",
                step.done ? "cursor-default" : "bg-surface-2 hover:bg-surface-3",
              )}
            >
              <span
                className={cn(
                  "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                  step.done ? "bg-success text-white" : "border border-border-strong bg-background",
                )}
              >
                {step.done ? <CheckIcon size={12} strokeWidth={2.5} /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "text-sm font-medium",
                    step.done ? "text-fg-tertiary" : "text-foreground",
                  )}
                >
                  {step.title}
                </span>
                {step.description ? (
                  <span className="text-xs text-fg-tertiary">{step.description}</span>
                ) : null}
              </span>
              {step.done ? null : <ChevronRightIcon className="text-icon-secondary" />}
            </button>
          </li>
        ))}
      </ol>
    </CardShell>
  );
}

export { SourceCard, ChannelCard, ConnectorTile, SettingsCard, SettingRow, OnboardingChecklist };
