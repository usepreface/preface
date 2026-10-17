"use client";

import * as React from "react";

import {
  ArrowDown01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Clock01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { DateRange } from "react-day-picker";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/** "Thu, 22 Oct 2026". The format the Figma trigger shows. */
function formatDate(date: Date, locale = "en-GB") {
  const weekday = date.toLocaleDateString(locale, { weekday: "short" });
  const rest = date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  return `${weekday}, ${rest}`;
}

/** "26 Oct – 4 Nov 2026", collapsing the year when both ends share it. */
function formatRange(range: DateRange | undefined, locale = "en-GB") {
  if (!range?.from) {
    return "";
  }
  const to = range.to ?? range.from;
  const sameYear = range.from.getFullYear() === to.getFullYear();
  const from = range.from.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const end = to.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  return `${from} – ${end}`;
}

const DAY = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysIn = (range?: DateRange) =>
  range?.from && range.to
    ? Math.round((startOfDay(range.to).getTime() - startOfDay(range.from).getTime()) / DAY) + 1
    : range?.from
      ? 1
      : 0;

const triggerClass =
  "group/date-trigger flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-border-default bg-surface-1 px-2.5 text-left text-sm text-foreground outline-none transition-[border-color,box-shadow] select-none hover:border-border-strong focus-visible:border-border-focus focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:border-border-subtle disabled:bg-surface-2 disabled:text-fg-disabled aria-expanded:border-border-focus aria-expanded:ring-3 aria-expanded:ring-focus-ring [&_svg]:shrink-0 [&_svg]:text-icon-secondary";

function PickerTrigger({
  icon,
  value,
  placeholder,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  icon: typeof Calendar03Icon;
  value?: string;
  placeholder: string;
}) {
  return (
    <button type="button" className={cn(triggerClass, className)} {...props}>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
      <span
        data-slot="date-picker-value"
        className={cn("min-w-0 flex-1 truncate", !value && "text-fg-tertiary")}
      >
        {value || placeholder}
      </span>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        strokeWidth={2}
        className="size-4 transition-transform group-aria-expanded/date-trigger:rotate-180"
      />
    </button>
  );
}

/** Single date: trigger + calendar popover. A clear button appears once a date is set. */
function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  clearable = true,
  calendarProps,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect" | "required"
  >;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const date = value ?? inner;
  const set = (d: Date | undefined) => {
    setInner(d);
    onValueChange?.(d);
  };
  const shown = date ? formatDate(date) : "";
  return (
    <div data-slot="date-picker" className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <PickerTrigger
              id={id}
              aria-label={ariaLabel}
              icon={Calendar03Icon}
              value={shown}
              placeholder={placeholder}
              className={cn(clearable && date && "pr-14")}
            />
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              set(d);
              setOpen(false);
            }}
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      {clearable && date && !disabled ? (
        <button
          type="button"
          aria-label="Clear date"
          onClick={() => set(undefined)}
          className="absolute top-1/2 right-7 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-icon-secondary outline-none hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

type RangePreset = { label: string; range: () => DateRange };

function lastDays(n: number): RangePreset["range"] {
  return () => {
    const to = startOfDay(new Date());
    return { from: new Date(to.getTime() - (n - 1) * DAY), to };
  };
}

const defaultPresets: RangePreset[] = [
  {
    label: "Today",
    range: () => {
      const d = startOfDay(new Date());
      return { from: d, to: d };
    },
  },
  { label: "Last 7 days", range: lastDays(7) },
  { label: "Last 30 days", range: lastDays(30) },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: startOfDay(now) };
    },
  },
  {
    label: "Last quarter",
    range: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3) - 1;
      const year = q < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const startMonth = ((q + 4) % 4) * 3;
      return { from: new Date(year, startMonth, 1), to: new Date(year, startMonth + 3, 0) };
    },
  },
];

const sameRange = (a?: DateRange, b?: DateRange) =>
  a?.from !== undefined &&
  b?.from !== undefined &&
  startOfDay(a.from).getTime() === startOfDay(b.from).getTime() &&
  startOfDay(a.to ?? a.from).getTime() === startOfDay(b.to ?? b.from).getTime();

/**
 * Range picker with presets first, two months and Apply. For analytics and audit-log filters.
 * The draft range only commits on Apply.
 */
function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  presets = defaultPresets,
  placeholder = "Pick a range",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  presets?: RangePreset[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const committed = value ?? inner;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(committed);
  const [month, setMonth] = React.useState(committed?.from ?? new Date());
  const presetRanges = React.useMemo(
    () => presets.map((p) => ({ label: p.label, range: p.range() })),
    [presets],
  );
  const activePreset = presetRanges.find((p) => sameRange(p.range, draft))?.label;
  const days = daysIn(draft);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(committed);
          setMonth(committed?.from ?? new Date());
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger
        disabled={disabled}
        render={
          <PickerTrigger
            id={id}
            aria-label={ariaLabel}
            icon={Calendar03Icon}
            value={formatRange(committed)}
            placeholder={placeholder}
            className={cn("w-75", className)}
          />
        }
      />
      <PopoverContent align="start" className="w-auto flex-row gap-0 overflow-hidden p-0">
        <div
          role="group"
          aria-label="Presets"
          className="hidden w-42 shrink-0 flex-col gap-0.5 border-r border-border-subtle p-2 sm:flex"
        >
          {[...presetRanges, { label: "Custom", range: undefined }].map((p) => {
            const active = p.range
              ? activePreset === p.label
              : !activePreset && Boolean(draft?.from);
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (p.range) {
                    setDraft(p.range);
                    if (p.range.from) {
                      setMonth(p.range.from);
                    }
                  }
                }}
                className="flex h-8 items-center justify-between rounded-md px-2 text-left text-sm text-foreground outline-none hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring aria-pressed:bg-selected"
              >
                {p.label}
                {active ? (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    strokeWidth={2}
                    className="size-4 text-icon-accent"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col">
          <Calendar
            mode="range"
            numberOfMonths={2}
            month={month}
            onMonthChange={setMonth}
            selected={draft}
            onSelect={setDraft}
            className="[&_.rdp-months]:gap-6"
          />
          <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2.5">
            <span className="flex-1 text-xs text-fg-tertiary" aria-live="polite">
              {days ? `${days} ${days === 1 ? "day" : "days"} selected` : "Pick a start date"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!draft?.from}
              onClick={() => {
                setInner(draft);
                onValueChange?.(draft);
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function timeSlots(step: number, min = "00:00", max = "23:59") {
  const [minHour = 0, minMinute = 0] = min.split(":").map(Number);
  const [maxHour = 0, maxMinute = 0] = max.split(":").map(Number);
  const minMinutes = minHour * 60 + minMinute;
  const maxMinutes = maxHour * 60 + maxMinute;
  const out: string[] = [];
  for (let t = minMinutes; t <= maxMinutes; t += step) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

/** Time of day in fixed steps (15 minutes by default). Pairs with DatePicker for schedules. */
function TimeField({
  value,
  defaultValue,
  onValueChange,
  step = 15,
  min,
  max,
  placeholder = "--:--",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (time: string) => void;
  step?: number;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const time = value ?? inner;
  const slots = React.useMemo(() => timeSlots(step, min, max), [step, min, max]);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>("[aria-pressed=true]");
      el?.scrollIntoView({ block: "center" });
      el?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <PickerTrigger
            id={id}
            aria-label={ariaLabel}
            icon={Clock01Icon}
            value={time}
            placeholder={placeholder}
            className={cn("w-35 font-mono tabular-nums", className)}
          />
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) min-w-35 gap-0 p-1">
        <div ref={listRef} role="group" aria-label="Times" className="max-h-56 overflow-y-auto">
          {slots.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={t === time}
              onClick={() => {
                setInner(t);
                onValueChange?.(t);
                setOpen(false);
              }}
              className="flex h-8 w-full items-center justify-between rounded-md px-2 font-mono text-sm tabular-nums outline-none hover:bg-hover focus-visible:bg-hover aria-pressed:bg-selected"
            >
              {t}
              {t === time ? (
                <HugeiconsIcon
                  icon={Tick02Icon}
                  strokeWidth={2}
                  className="size-4 text-icon-accent"
                />
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker, DateRangePicker, TimeField, formatDate, formatRange };
export type { DateRange, RangePreset };
