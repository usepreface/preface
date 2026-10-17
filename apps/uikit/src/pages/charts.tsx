import { ChartContainer, ChartTooltip, type ChartConfig } from "@usepreface/ui/components/chart";
import {
  ChartCard,
  ChartLegendItem,
  ChartLegendRow,
  ChartTooltipCard,
  KpiStrip,
  RadialMeter,
  chartColors,
} from "@usepreface/ui/preface/charts";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import { Page, Section } from "../components/bench";

const [c1, c2, c3, c4, c5] = chartColors;

const answers = [620, 700, 680, 760, 820, 790, 880, 940, 910, 1020, 1100, 1284, 1180, 1240].map(
  (v, i) => ({
    day: `${2 + i} Oct`,
    answers: v,
    escalations: [40, 44, 39, 52, 48, 45, 51, 47, 42, 44, 39, 37, 35, 33][i],
  }),
);
const byChannel = [
  [520, 380, 210],
  [610, 410, 260],
  [580, 450, 240],
  [700, 520, 300],
  [660, 480, 280],
  [240, 160, 90],
  [210, 140, 80],
].map(([widget, slack, api], i) => ({
  day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  widget,
  slack,
  api,
}));
const latency = [
  [1.6, 3.4],
  [1.5, 3.1],
  [1.6, 3.3],
  [1.5, 3.6],
  [1.4, 3.0],
  [1.5, 2.9],
  [1.4, 3.1],
  [1.3, 2.8],
  [1.4, 2.7],
  [1.4, 2.9],
  [1.3, 2.6],
  [1.4, 2.7],
].map(([p50, p95], i) => ({ hour: `${String(7 + i).padStart(2, "0")}:00`, p50, p95 }));
const sourceTypes = [
  { name: "GitHub", value: 38 },
  { name: "Slack", value: 24 },
  { name: "Notion", value: 18 },
  { name: "Web", value: 12 },
  { name: "Files", value: 8 },
];

const areaConfig = {
  answers: { label: "Answers", color: c1 },
  escalations: { label: "Escalations", color: c2 },
} satisfies ChartConfig;
const barConfig = {
  widget: { label: "Widget", color: c1 },
  slack: { label: "Slack", color: c2 },
  api: { label: "API", color: c3 },
} satisfies ChartConfig;
const lineConfig = {
  p50: { label: "p50", color: c3 },
  p95: { label: "p95", color: c4 },
} satisfies ChartConfig;

const axis = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fill: "var(--text-tertiary)", fontSize: 12 },
} as const;
const fmt = (n: number) => n.toLocaleString("en-GB");

export function ChartsPage() {
  return (
    <Page
      figma="55 Charts"
      title="Charts"
      description="Chart cards for analytics: area, stacked bar, line with a target, donut and radial, plus a KPI strip, legend items and the tooltip. Gridlines and labels follow the theme; series use the five data colours."
    >
      <Section
        title="Data colours"
        description="Signal, Ice, Teal, Violet, Amber, in that order. Never more than five series; group the rest as Other."
        className="grid grid-cols-2 gap-4 sm:grid-cols-5"
      >
        {(
          [
            ["Signal", "--chart-1", "#2F6BFF"],
            ["Ice", "--chart-2", "#8EC0FF"],
            ["Teal", "--chart-3", "#12B5A6"],
            ["Violet", "--chart-4", "#7C5CFF"],
            ["Amber", "--chart-5", "#E8940C"],
          ] as const
        ).map(([name, token, hex]) => (
          <div key={token} className="flex flex-col gap-2">
            <div className="h-16 rounded-xl" style={{ background: `var(${token})` }} />
            <div className="flex flex-col font-mono text-2xs">
              <span className="text-foreground">
                {name} · {hex}
              </span>
              <span className="text-fg-tertiary">{token}</span>
            </div>
          </div>
        ))}
      </Section>

      <Section
        title="KPI strip"
        description="Label, value, delta and a trend line per cell."
        className="flex flex-col"
      >
        <KpiStrip
          items={[
            {
              label: "Answers",
              value: "12,480",
              delta: "+18%",
              series: [4, 6, 5, 8, 7, 9, 11, 10, 13, 14, 16],
              color: c1,
            },
            {
              label: "Sources synced",
              value: "42",
              delta: "+3",
              series: [30, 31, 31, 33, 34, 36, 37, 38, 40, 41, 42],
              color: c3,
            },
            {
              label: "Median latency",
              value: "1.4s",
              delta: "−12%",
              series: [9, 8, 9, 7, 7, 6, 6, 5, 5, 4, 4],
              color: c4,
            },
            {
              label: "Escalations",
              value: "412",
              delta: "−4%",
              series: [6, 7, 6, 5, 6, 5, 5, 4, 5, 4, 4],
              color: c5,
            },
          ]}
        />
      </Section>

      <Section
        title="Chart cards"
        description="One card, five types. Header with title, scope and the headline number; legend under the plot."
        className="grid gap-6 lg:grid-cols-2"
      >
        <ChartCard
          title="Answers"
          description="Last 14 days · all channels"
          value="12,480"
          delta="+18.2%"
        >
          <ChartContainer config={areaConfig} className="aspect-auto h-52 w-full">
            <AreaChart data={answers} margin={{ left: 0, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="fill-answers" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={c1} stopOpacity={0.24} />
                  <stop offset="1" stopColor={c1} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="day" {...axis} interval={6} />
              <YAxis {...axis} width={44} tickFormatter={fmt} />
              <ChartTooltip
                cursor={{ stroke: "var(--border-strong)" }}
                content={
                  <ChartTooltipCard names={{ answers: "Answers", escalations: "Escalations" }} />
                }
              />
              <Area
                dataKey="answers"
                type="monotone"
                stroke={c1}
                strokeWidth={2}
                fill="url(#fill-answers)"
                activeDot={{ r: 4.5, strokeWidth: 2.5, fill: "var(--bg-surface-1)" }}
              />
              <Line dataKey="escalations" type="monotone" stroke={c2} strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartContainer>
          <ChartLegendRow items={[{ label: "Answers" }, { label: "Escalations" }]} />
        </ChartCard>

        <ChartCard title="Questions by channel" description="This week" value="8,912" delta="+6.4%">
          <ChartContainer config={barConfig} className="aspect-auto h-52 w-full">
            <BarChart data={byChannel} margin={{ left: 0, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="day" {...axis} />
              <YAxis {...axis} width={44} tickFormatter={fmt} />
              <ChartTooltip
                cursor={{ fill: "var(--state-hover)" }}
                content={
                  <ChartTooltipCard names={{ widget: "Widget", slack: "Slack", api: "API" }} />
                }
              />
              <Bar dataKey="widget" stackId="a" fill={c1} maxBarSize={36} />
              <Bar dataKey="slack" stackId="a" fill={c2} maxBarSize={36} />
              <Bar dataKey="api" stackId="a" fill={c3} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ChartContainer>
          <ChartLegendRow
            items={[
              { label: "Widget", value: "4,450" },
              { label: "Slack", value: "2,540" },
              { label: "API", value: "1,460" },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Answer latency"
          description="p50 and p95 · last 12 hours"
          value="1.4s"
          delta="−12%"
        >
          <ChartContainer config={lineConfig} className="aspect-auto h-52 w-full">
            <LineChart data={latency} margin={{ left: 0, right: 4, top: 16 }}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="hour" {...axis} interval={2} />
              <YAxis {...axis} width={44} domain={[0, 4]} tickFormatter={(v) => `${v}s`} />
              <ChartTooltip
                cursor={{ stroke: "var(--border-strong)" }}
                content={
                  <ChartTooltipCard
                    names={{ p50: "p50", p95: "p95" }}
                    valueFormatter={(v) => `${v}s`}
                  />
                }
              />
              <ReferenceLine
                y={3}
                stroke={c5}
                strokeDasharray="4 4"
                label={{
                  value: "SLO 3.0s",
                  position: "insideTopRight",
                  fill: "var(--status-warning-fg)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              />
              <Line dataKey="p95" type="monotone" stroke={c4} strokeWidth={2} dot={false} />
              <Line dataKey="p50" type="monotone" stroke={c3} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
          <ChartLegendRow
            items={[
              { label: "p50", value: "1.4s", color: c3 },
              { label: "p95", value: "2.7s", color: c4 },
            ]}
          />
        </ChartCard>

        <ChartCard title="Citations by source type" description="Last 30 days">
          <div className="flex flex-wrap items-center gap-8">
            <div className="relative size-45 shrink-0">
              <PieChart width={180} height={180}>
                <Pie
                  data={sourceTypes}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {sourceTypes.map((s, i) => (
                    <Cell key={s.name} fill={chartColors[i]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-xl leading-7 font-semibold tabular-nums">
                  12,480
                </span>
                <span className="text-xs text-fg-tertiary">citations</span>
              </div>
            </div>
            <ul className="flex min-w-40 flex-1 flex-col gap-2.5">
              {sourceTypes.map((s, i) => (
                <li key={s.name} className="flex items-center gap-2 text-13">
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-[2px]"
                    style={{ background: chartColors[i] }}
                  />
                  <span className="flex-1 text-fg-secondary">{s.name}</span>
                  <span className="font-mono tabular-nums">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>

        <ChartCard
          title="Answer rate"
          description="Questions answered with at least one citation"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap items-center gap-8">
            <RadialMeter value={0.941} label="answered" />
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              {(
                [
                  ["Answered", "11,744", "with citations"],
                  ["Escalated", "412", "handed to a human"],
                  ["No answer", "324", "gaps to fill"],
                ] as const
              ).map(([label, value, sub]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-fg-tertiary">{label}</span>
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-base font-medium tabular-nums">{value}</span>
                    <span className="text-xs text-fg-secondary">{sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </Section>

      <Section
        title="Legend & tooltip"
        description="Legend swatches are 8 px squares. The tooltip follows the pointer: date first, then one row per series."
        className="flex flex-wrap items-start gap-10"
      >
        <div className="flex flex-col gap-3">
          <ChartLegendItem color={c1} label="Answers" value="12,480" />
          <ChartLegendItem color={c3} label="Sources" />
        </div>
        <ChartTooltipCard
          active
          label="Thu, 15 Oct"
          payload={[
            { name: "Answers", value: 1284, color: c1, dataKey: "answers" },
            { name: "Escalations", value: 37, color: c2, dataKey: "escalations" },
          ]}
        />
      </Section>
    </Page>
  );
}
