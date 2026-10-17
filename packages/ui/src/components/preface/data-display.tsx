import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import {
  AlertIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  PauseIcon,
  RefreshIcon,
} from "../../icons";
import { cn } from "../../lib/utils";
import { BrandLogo, type BrandName } from "../../logos/registry";
import { Badge } from "../badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

/*
 * Small data-display pieces from Figma pages 21, 28 and 29: sync status, HTTP method,
 * inline code, logo tile, sparkline and stat card.
 */

export type SyncState = "synced" | "syncing" | "queued" | "paused" | "failed";

const syncTone = {
  synced: { className: "bg-success-bg text-success-fg", icon: CheckCircleIcon, label: "Synced" },
  syncing: { className: "bg-info-bg text-info-fg", icon: RefreshIcon, label: "Syncing" },
  queued: { className: "bg-neutral-bg text-neutral-fg", icon: ClockIcon, label: "Queued" },
  paused: { className: "bg-warning-bg text-warning-fg", icon: PauseIcon, label: "Paused" },
  failed: { className: "bg-danger-bg text-danger-fg", icon: AlertIcon, label: "Failed" },
} as const;

/** Source and channel health. Put the detail in `children`: "Synced 4m ago", "Failed · token expired". */
function SyncStatus({
  state,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & { state: SyncState }) {
  const tone = syncTone[state];
  const Icon = tone.icon;
  return (
    <span
      data-slot="sync-status"
      data-state={state}
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full pr-2.5 pl-2 text-xs font-medium",
        tone.className,
        className,
      )}
      {...props}
    >
      <Icon
        size={14}
        className={state === "syncing" ? "animate-spin [animation-duration:2s]" : undefined}
      />
      {children ?? tone.label}
    </span>
  );
}

const methodVariants = cva(
  "inline-flex h-4.5 w-fit items-center rounded-xs px-1.5 font-mono text-2xs font-bold tracking-wide",
  {
    variants: {
      method: {
        GET: "bg-success-bg text-success-fg",
        POST: "bg-info-bg text-info-fg",
        PUT: "bg-warning-bg text-warning-fg",
        PATCH: "bg-violet-bg text-violet-fg",
        DELETE: "bg-danger-bg text-danger-fg",
      },
    },
    defaultVariants: { method: "GET" },
  },
);

function HttpMethod({
  method = "GET",
  className,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof methodVariants>) {
  return (
    <span data-slot="http-method" className={cn(methodVariants({ method }), className)} {...props}>
      {method}
    </span>
  );
}

function InlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="inline-code"
      className={cn(
        "rounded-xs border bg-surface-3 px-1.25 py-px font-mono text-[0.85em] text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Company logo on a neutral tile, as used for sources, channels and integrations. */
function LogoTile({
  brand,
  size = 36,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"span"> & { brand?: BrandName; size?: number }) {
  return (
    <span
      data-slot="logo-tile"
      className={cn(
        "inline-flex shrink-0 items-center justify-center border bg-background text-icon [&_svg]:shrink-0",
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), ...style }}
      {...props}
    >
      {brand ? <BrandLogo name={brand} size={Math.round(size * 0.56)} /> : children}
    </span>
  );
}

/** Tiny trend line. Values are drawn as-is; pass at least two. */
function Sparkline({
  values,
  height = 44,
  className,
  tone = "primary",
  ...props
}: Omit<React.ComponentProps<"svg">, "values"> & {
  values: number[];
  height?: number;
  tone?: "primary" | "success" | "neutral" | "danger";
}) {
  const id = React.useId().replace(/:/g, "");
  const w = 240;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map(
    (v, i) =>
      [
        (i / Math.max(values.length - 1, 1)) * w,
        height - 4 - ((v - min) / span) * (height - 8),
      ] as const,
  );
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const color = {
    primary: "var(--accent-primary)",
    success: "var(--status-success-solid)",
    neutral: "var(--text-tertiary)",
    danger: "var(--status-danger-solid)",
  }[tone];
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      data-slot="sparkline"
      aria-hidden="true"
      className={cn("h-11 w-full overflow-visible", className)}
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${height} L0 ${height} Z`} fill={`url(#${id}-fill)`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** KPI with delta and trend. Up is good unless `invert` (latency, errors). */
function StatCard({
  label,
  value,
  delta,
  trend = "flat",
  invert = false,
  hint,
  series,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  /** Treat a falling value as good (latency, error rate). */
  invert?: boolean;
  hint?: React.ReactNode;
  series?: number[];
}) {
  const good = trend === "flat" ? null : (trend === "up") !== invert;
  const tone = good === null ? "neutral" : good ? (trend === "up" ? "info" : "success") : "danger";
  return (
    <div
      data-slot="stat-card"
      className={cn("flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-13 font-medium text-fg-secondary">{label}</span>
        {hint ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label="About this metric"
                  className="rounded-xs text-icon-secondary outline-none hover:text-icon focus-visible:ring-3 focus-visible:ring-focus-ring"
                />
              }
            >
              <InfoIcon size={14} />
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-[32px] leading-9 font-medium tracking-[-0.045em] text-foreground tabular-nums">
          {value}
        </span>
        {delta ? (
          <Badge tone={tone} className="tabular-nums">
            {delta}
          </Badge>
        ) : null}
      </div>
      {series ? (
        <Sparkline
          values={series}
          tone={
            good === null ? "neutral" : good ? (trend === "up" ? "primary" : "success") : "danger"
          }
        />
      ) : null}
    </div>
  );
}

export { SyncStatus, HttpMethod, InlineCode, LogoTile, Sparkline, StatCard, methodVariants };
