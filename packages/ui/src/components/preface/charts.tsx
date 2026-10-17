"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Badge } from "../badge";

/*
 * Chart parts from Figma page 55. Plots come from recharts via `components/chart`; these are
 * the frame around them: the card header, legend, tooltip and the KPI strip. Series use the
 * five data colours in order (`--chart-1` … `--chart-5`): Signal, Ice, Teal, Violet, Amber.
 */

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

type DeltaTone = "success" | "danger" | "neutral" | "warning";

/** Card with title, scope and an optional headline number and delta, then the plot and legend. */
function ChartCard({
  title,
  description,
  value,
  delta,
  deltaTone = "success",
  action,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"section">, "title"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  value?: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: DeltaTone;
  action?: React.ReactNode;
}) {
  const titleId = React.useId();
  return (
    <section
      data-slot="chart-card"
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl border border-border-subtle bg-card p-5 text-card-foreground",
        className,
      )}
      {...props}
    >
      <header className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 id={titleId} className="text-sm font-semibold text-foreground">
            {title}
          </h3>
          {description ? <p className="text-xs text-fg-tertiary">{description}</p> : null}
        </div>
        {value !== null && value !== undefined ? (
          <div className="flex flex-col items-end gap-1">
            <span className="font-heading text-xl leading-7 font-semibold tracking-tight tabular-nums">
              {value}
            </span>
            {delta !== null && delta !== undefined ? <Badge tone={deltaTone}>{delta}</Badge> : null}
          </div>
        ) : null}
        {action}
      </header>
      {children}
    </section>
  );
}

/** Swatch, label and optional value. Swatches are 8 px squares with a 2 px radius. */
function ChartLegendItem({
  color,
  label,
  value,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  color: string;
  label: React.ReactNode;
  value?: React.ReactNode;
}) {
  return (
    <div
      data-slot="chart-legend-item"
      className={cn("flex items-center gap-1.5 text-xs", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-[2px]"
        style={{ background: color }}
      />
      <span className="text-fg-secondary">{label}</span>
      {value !== null && value !== undefined ? (
        <span className="font-medium text-foreground tabular-nums">{value}</span>
      ) : null}
    </div>
  );
}

function ChartLegendRow({
  items,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  items: { label: React.ReactNode; value?: React.ReactNode; color?: string }[];
}) {
  return (
    <div
      data-slot="chart-legend-row"
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}
      {...props}
    >
      {items.map((item, i) => (
        <ChartLegendItem
          key={i}
          color={item.color ?? chartColors[i % chartColors.length] ?? chartColors[0]}
          label={item.label}
          value={item.value}
        />
      ))}
    </div>
  );
}

type TooltipRow = {
  name?: string | number;
  value?: number | string | (number | string)[];
  color?: string;
  dataKey?: string | number | ((obj: unknown) => unknown);
  payload?: Record<string, unknown>;
};

/**
 * Tooltip panel. Pass as `content` to recharts' Tooltip: date first, then one row per series
 * with values right-aligned in mono.
 */
function ChartTooltipCard({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter = (v) => (typeof v === "number" ? v.toLocaleString("en-GB") : String(v)),
  names,
  className,
}: {
  active?: boolean;
  payload?: readonly TooltipRow[];
  label?: React.ReactNode;
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
  valueFormatter?: (value: number | string) => React.ReactNode;
  names?: Record<string, React.ReactNode>;
  className?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div
      data-slot="chart-tooltip-card"
      className={cn(
        "flex min-w-44 flex-col gap-1.5 rounded-[10px] border border-border-subtle bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-md",
        className,
      )}
    >
      {label !== null && label !== undefined ? (
        <div className="font-medium text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      {payload.map((row, i) => {
        const key = String(row.dataKey ?? row.name ?? i);
        const v = Array.isArray(row.value) ? row.value.join(" – ") : row.value;
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: row.color ?? chartColors[i % chartColors.length] }}
            />
            <span className="flex-1 text-fg-secondary">{names?.[key] ?? row.name}</span>
            <span className="font-mono text-foreground tabular-nums">
              {v === null || v === undefined ? "–" : valueFormatter(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Smooth trend line in a given colour, for the KPI strip. */
function TrendLine({
  values,
  color = chartColors[0],
  height = 32,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const w = 184;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map(
    (v, i) =>
      [
        (i / Math.max(values.length - 1, 1)) * w,
        height - 2 - ((v - min) / (max - min || 1)) * (height - 4),
      ] as const,
  );
  const firstPoint = pts[0];
  let d = firstPoint ? `M${firstPoint[0].toFixed(1)} ${firstPoint[1].toFixed(1)}` : "";
  for (const [index, point] of pts.entries()) {
    const previousPoint = pts[index - 1];
    if (!previousPoint) continue;
    const [x0, y0] = previousPoint;
    const [x1, y1] = point;
    const mx = ((x0 + x1) / 2).toFixed(1);
    d += `C${mx} ${y0.toFixed(1)} ${mx} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

type Kpi = {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  deltaTone?: DeltaTone;
  series?: number[];
  color?: string;
};

/** KPI strip for dashboards: label, value, delta and a trend line per cell. */
function KpiStrip({
  items,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { items: Kpi[] }) {
  return (
    <div
      data-slot="kpi-strip"
      className={cn(
        "grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-(--kpi-cols)",
        className,
      )}
      style={{ "--kpi-cols": `repeat(${items.length}, minmax(0, 1fr))` } as React.CSSProperties}
      {...props}
    >
      {items.map((k, i) => (
        <div key={i} className="flex min-w-0 flex-col gap-2 bg-card p-4.5">
          <span className="text-xs text-fg-tertiary">{k.label}</span>
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl leading-7 font-semibold tracking-tight tabular-nums">
              {k.value}
            </span>
            {k.delta !== null && k.delta !== undefined ? (
              <Badge tone={k.deltaTone ?? "success"}>{k.delta}</Badge>
            ) : null}
          </div>
          {k.series ? (
            <TrendLine values={k.series} color={k.color ?? chartColors[i % chartColors.length]} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Ring with a percentage in the middle. Value is 0–1. */
function RadialMeter({
  value,
  label,
  size = 160,
  thickness = 16,
  color = chartColors[0],
  className,
}: {
  value: number;
  label?: React.ReactNode;
  size?: number;
  thickness?: number;
  color?: string;
  className?: string;
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 1);
  return (
    <div
      data-slot="radial-meter"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 1000) / 10}
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-surface-3)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${c * v} ${c}`}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="font-heading text-xl leading-7 font-semibold tabular-nums">
          {(v * 100).toFixed(1)}%
        </span>
        {label ? <span className="text-xs text-fg-tertiary">{label}</span> : null}
      </div>
    </div>
  );
}

export {
  ChartCard,
  ChartLegendItem,
  ChartLegendRow,
  ChartTooltipCard,
  KpiStrip,
  RadialMeter,
  TrendLine,
  chartColors,
};
export type { DeltaTone, Kpi };
