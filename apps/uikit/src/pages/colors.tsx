import * as React from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";
import { CopyIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { Page, Section } from "../components/bench";
import { copyText } from "../lib/assets";

const ramps: Record<string, number[]> = {
  slate: [0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 925, 950, 1000],
  blue: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  ice: [50, 100, 300, 500],
  green: [50, 100, 400, 500, 600, 700, 900, 950],
  amber: [50, 100, 400, 500, 600, 700, 900, 950],
  red: [50, 100, 400, 500, 600, 700, 900, 950],
  violet: [50, 100, 400, 500, 600, 700, 900],
  teal: [50, 100, 400, 500, 600, 900],
};

// [CSS variable, Tailwind utility]
const semantic: Record<string, [string, string][]> = {
  Background: [
    ["--bg-canvas", "bg-canvas"],
    ["--bg-surface-1", "bg-surface-1"],
    ["--bg-surface-2", "bg-surface-2"],
    ["--bg-surface-3", "bg-surface-3"],
    ["--bg-surface-4", "bg-surface-4"],
    ["--bg-overlay", "bg-overlay"],
    ["--bg-inverse", "bg-inverse"],
    ["--bg-backdrop", "bg-backdrop"],
  ],
  State: [
    ["--state-hover", "bg-hover"],
    ["--state-pressed", "bg-pressed"],
    ["--state-selected", "bg-selected"],
    ["--state-focus-ring", "ring-focus-ring"],
  ],
  Accent: [
    ["--accent-primary", "bg-primary"],
    ["--accent-primary-hover", "bg-primary-hover"],
    ["--accent-primary-pressed", "bg-primary-pressed"],
    ["--accent-subtle", "bg-primary-subtle"],
    ["--accent-subtle-hover", "bg-primary-subtle-hover"],
    ["--accent-on-primary", "text-primary-foreground"],
  ],
  Text: [
    ["--text-primary", "text-fg"],
    ["--text-secondary", "text-fg-secondary"],
    ["--text-tertiary", "text-fg-tertiary"],
    ["--text-disabled", "text-fg-disabled"],
    ["--text-accent", "text-fg-accent"],
    ["--text-link", "text-fg-link"],
    ["--text-inverse", "text-fg-inverse"],
  ],
  Border: [
    ["--border-subtle", "border-border"],
    ["--border-default", "border-border-default"],
    ["--border-strong", "border-border-strong"],
    ["--border-focus", "border-border-focus"],
  ],
  Icon: [
    ["--icon-primary", "text-icon"],
    ["--icon-secondary", "text-icon-secondary"],
    ["--icon-accent", "text-icon-accent"],
  ],
  Status: [
    ["--status-success-bg", "bg-success-bg"],
    ["--status-success-fg", "text-success-fg"],
    ["--status-success-solid", "bg-success"],
    ["--status-warning-bg", "bg-warning-bg"],
    ["--status-warning-fg", "text-warning-fg"],
    ["--status-warning-solid", "bg-warning"],
    ["--status-danger-bg", "bg-danger-bg"],
    ["--status-danger-fg", "text-danger-fg"],
    ["--status-danger-solid", "bg-danger"],
    ["--status-info-bg", "bg-info-bg"],
    ["--status-info-fg", "text-info-fg"],
    ["--status-info-solid", "bg-info"],
    ["--status-neutral-bg", "bg-neutral-bg"],
    ["--status-neutral-fg", "text-neutral-fg"],
    ["--label-violet-bg", "bg-violet-bg"],
    ["--label-violet-fg", "text-violet-fg"],
    ["--label-teal-bg", "bg-teal-bg"],
    ["--label-teal-fg", "text-teal-fg"],
  ],
  Brand: [
    ["--brand-slate", "bg-brand-slate"],
    ["--brand-deep", "bg-brand-deep"],
    ["--brand-signal", "bg-brand-signal"],
    ["--brand-ice", "bg-brand-ice"],
    ["--brand-sky", "bg-brand-sky"],
    ["--brand-frost", "bg-brand-frost"],
  ],
};

function toHex(value: string) {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m?.[1]) {
    return value;
  }
  const [r, g, b, a] = m[1].split(/[\s,/]+/).map(Number);
  const hex = `#${[r, g, b]
    .map((n) => (n ?? 0).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
  return a !== undefined && a < 1 ? `${hex} · ${Math.round(a * 100)}%` : hex;
}

/** Reads the resolved colour of `var(--x)` from a rendered element, and re-reads when the theme flips. */
function useResolved() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [value, setValue] = React.useState("");
  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const read = () => setValue(toHex(getComputedStyle(el).backgroundColor));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return { ref, value };
}

const checker: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, var(--bg-surface-3) 25%, transparent 25%, transparent 75%, var(--bg-surface-3) 75%), linear-gradient(45deg, var(--bg-surface-3) 25%, transparent 25%, transparent 75%, var(--bg-surface-3) 75%)",
  backgroundSize: "12px 12px",
  backgroundPosition: "0 0, 6px 6px",
};

function CopyRow({
  value,
  className,
  label,
}: {
  value: string;
  className?: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => void copyText(value, `Copied ${label}`)}
      className={cn(
        "group/row flex min-w-0 items-center gap-1 rounded-sm text-left outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
    >
      <code className="truncate">{value}</code>
      <CopyIcon
        size={11}
        className="shrink-0 opacity-0 transition-opacity group-hover/row:opacity-70"
      />
    </button>
  );
}

function Swatch({ variable, utility }: { variable: string; utility?: string }) {
  const { ref, value } = useResolved();
  const hex = value.split(" ")[0] ?? value;
  return (
    <div className="group/swatch flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-sm">
      <button
        type="button"
        title={`Copy ${hex}`}
        onClick={() => void copyText(hex, `Copied ${variable}`)}
        className="relative h-16 border-b outline-none focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:ring-inset"
        style={checker}
      >
        <div ref={ref} className="size-full" style={{ backgroundColor: `var(${variable})` }} />
        <span className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-sm bg-black/55 px-1.5 py-0.5 font-mono text-2xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/swatch:opacity-100">
          <CopyIcon size={10} />
          {hex}
        </span>
      </button>
      <div className="flex min-w-0 flex-col gap-0.5 p-2.5 font-mono text-2xs">
        <CopyRow value={variable} label="variable" className="text-xs text-foreground" />
        {utility ? <CopyRow value={utility} label="class" className="text-fg-accent" /> : null}
        <CopyRow value={value} label="value" className="text-fg-tertiary" />
      </div>
    </div>
  );
}

function RampStep({ ramp, step }: { ramp: string; step: number }) {
  const { ref, value } = useResolved();
  const variable = `--${ramp}-${step}`;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={() => void copyText(value, `Copied ${ramp}-${step}`)}
            className="group/step flex min-w-0 flex-1 flex-col outline-none focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-focus-ring"
          />
        }
      >
        <div
          ref={ref}
          className="h-14 transition-[height] duration-200 group-hover/step:h-16"
          style={{ backgroundColor: `var(${variable})` }}
        />
        <span className="truncate bg-card px-1 py-1 text-center font-mono text-2xs text-fg-secondary">
          {step}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="font-mono">
          {variable} · {value}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

export function ColorsPage() {
  return (
    <Page
      figma="05 Color · 13 Tokens"
      title="Colour"
      description="Every semantic token resolves through the Figma variable of the same name. Click a swatch to copy its hex, or any line to copy the variable, class or value."
    >
      {Object.entries(semantic).map(([group, tokens]) => (
        <Section
          key={group}
          title={group}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {tokens.map(([variable, utility]) => (
            <Swatch key={variable} variable={variable} utility={utility} />
          ))}
        </Section>
      ))}
      <Section
        title="Primitives"
        description="Raw ramps. Components never use these directly; tokens alias them. Click a step to copy its hex."
      >
        <div className="flex flex-col gap-5">
          {Object.entries(ramps).map(([ramp, steps]) => (
            <div key={ramp} className="flex flex-col gap-1.5">
              <span className="text-overline text-fg-tertiary">{ramp}</span>
              <div className="flex items-end overflow-hidden rounded-lg border">
                {steps.map((step) => (
                  <RampStep key={step} ramp={ramp} step={step} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  );
}
