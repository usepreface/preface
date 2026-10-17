"use client";

import * as React from "react";

import { cn } from "../lib/utils";

/*
 * Split panes for the document viewer and answer trace. Sizes are percentages.
 * Handles are separators that drag with a pointer and step with the arrow keys
 * (Shift for 10%), so the layout works without a mouse. Pass `onLayout` to
 * remember sizes per user.
 */

type PanelMeta = { id: string; defaultSize?: number; minSize: number; maxSize: number };

type GroupContextValue = {
  direction: "horizontal" | "vertical";
  sizes: number[];
  register: (meta: PanelMeta) => number;
  indexOf: (id: string) => number;
  resizeBy: (handleIndex: number, delta: number) => void;
  startDrag: (handleIndex: number, e: React.PointerEvent) => void;
  bounds: (handleIndex: number) => { min: number; max: number } | null;
};

const GroupContext = React.createContext<GroupContextValue | null>(null);

function useGroup() {
  const ctx = React.useContext(GroupContext);
  if (!ctx) {
    throw new Error("Resizable parts must be used within <ResizablePanelGroup />");
  }
  return ctx;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function ResizablePanelGroup({
  direction = "horizontal",
  onLayout,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  direction?: "horizontal" | "vertical";
  onLayout?: (sizes: number[]) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const panels = React.useRef<PanelMeta[]>([]);
  const [sizes, setSizes] = React.useState<number[]>([]);

  // Panels register in render order. Once all are known, unset sizes share what is left.
  React.useLayoutEffect(() => {
    const list = panels.current;
    if (!list.length || sizes.length === list.length) {
      return;
    }
    const set = list.reduce((a, p) => a + (p.defaultSize ?? 0), 0);
    const unset = list.filter((p) => p.defaultSize === null || p.defaultSize === undefined).length;
    const share = unset ? Math.max(100 - set, 0) / unset : 0;
    setSizes(list.map((p) => p.defaultSize ?? share));
  }, [sizes.length]);

  const register = React.useCallback((meta: PanelMeta) => {
    const list = panels.current;
    const at = list.findIndex((p) => p.id === meta.id);
    if (at >= 0) {
      list[at] = meta;
      return at;
    }
    list.push(meta);
    return list.length - 1;
  }, []);

  const indexOf = React.useCallback(
    (id: string) => panels.current.findIndex((p) => p.id === id),
    [],
  );

  const apply = React.useCallback((handleIndex: number, delta: number, base: number[]) => {
    const a = panels.current[handleIndex];
    const b = panels.current[handleIndex + 1];
    if (!a || !b) {
      return base;
    }
    const total = (base[handleIndex] ?? 0) + (base[handleIndex + 1] ?? 0);
    const lo = Math.max(a.minSize, total - b.maxSize);
    const hi = Math.min(a.maxSize, total - b.minSize);
    const left = clamp((base[handleIndex] ?? 0) + delta, lo, hi);
    const next = [...base];
    next[handleIndex] = left;
    next[handleIndex + 1] = total - left;
    return next;
  }, []);

  const commit = React.useCallback(
    (next: number[]) => {
      setSizes(next);
      onLayout?.(next);
    },
    [onLayout],
  );

  const resizeBy = React.useCallback(
    (handleIndex: number, delta: number) => commit(apply(handleIndex, delta, sizes)),
    [apply, commit, sizes],
  );

  const startDrag = React.useCallback(
    (handleIndex: number, e: React.PointerEvent) => {
      const el = ref.current;
      if (!el || e.button !== 0) {
        return;
      }
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const length = direction === "horizontal" ? rect.width : rect.height;
      const origin = direction === "horizontal" ? e.clientX : e.clientY;
      const base = sizes;
      let latest = base;
      const move = (ev: PointerEvent) => {
        const pos = direction === "horizontal" ? ev.clientX : ev.clientY;
        latest = apply(handleIndex, ((pos - origin) / length) * 100, base);
        setSizes(latest);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
        onLayout?.(latest);
      };
      document.body.style.cursor = direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [apply, direction, onLayout, sizes],
  );

  const bounds = React.useCallback(
    (handleIndex: number) => {
      const a = panels.current[handleIndex];
      const b = panels.current[handleIndex + 1];
      if (!a || !b) {
        return null;
      }
      const total = (sizes[handleIndex] ?? 0) + (sizes[handleIndex + 1] ?? 0);
      return {
        min: Math.max(a.minSize, total - b.maxSize),
        max: Math.min(a.maxSize, total - b.minSize),
      };
    },
    [sizes],
  );

  const value = React.useMemo(
    () => ({ direction, sizes, register, indexOf, resizeBy, startDrag, bounds }),
    [direction, sizes, register, indexOf, resizeBy, startDrag, bounds],
  );

  return (
    <GroupContext.Provider value={value}>
      <div
        ref={ref}
        data-slot="resizable-panel-group"
        data-direction={direction}
        className={cn(
          "flex h-full w-full overflow-hidden",
          direction === "vertical" && "flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </GroupContext.Provider>
  );
}

function ResizablePanel({
  defaultSize,
  minSize = 10,
  maxSize = 100,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { defaultSize?: number; minSize?: number; maxSize?: number }) {
  const { sizes, register, indexOf } = useGroup();
  const id = React.useId();
  register({ id, defaultSize, minSize, maxSize });
  const size = sizes[indexOf(id)];
  return (
    <div
      id={id}
      data-slot="resizable-panel"
      className={cn("min-h-0 min-w-0 overflow-hidden", className)}
      style={{ flex: size === null || size === undefined ? "1 1 0" : `${size} 1 0`, ...style }}
      {...props}
    />
  );
}

/** The divider between two panels. `withHandle` adds a visible grip. */
function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<"div"> & { withHandle?: boolean }) {
  const { direction, sizes, resizeBy, startDrag, bounds } = useGroup();
  const ref = React.useRef<HTMLDivElement>(null);
  const [handleIndex, setHandleIndex] = React.useState(-1);

  // The handle sits between panel N and N+1; count the panels before it.
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.parentElement) {
      return;
    }
    let n = -1;
    for (const child of Array.from(el.parentElement.children)) {
      if (child === el) {
        break;
      }
      if ((child as HTMLElement).dataset.slot === "resizable-panel") {
        n += 1;
      }
    }
    setHandleIndex(n);
  });

  const horizontal = direction === "horizontal";
  const range = handleIndex >= 0 ? bounds(handleIndex) : null;
  const now = sizes[handleIndex];

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={0}
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={now === null || now === undefined ? undefined : Math.round(now)}
      aria-valuemin={range ? Math.round(range.min) : undefined}
      aria-valuemax={range ? Math.round(range.max) : undefined}
      data-slot="resizable-handle"
      onPointerDown={(e) => handleIndex >= 0 && startDrag(handleIndex, e)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 2;
        const back = horizontal ? "ArrowLeft" : "ArrowUp";
        const fwd = horizontal ? "ArrowRight" : "ArrowDown";
        if (handleIndex < 0) {
          return;
        }
        if (e.key === back || e.key === fwd) {
          e.preventDefault();
          resizeBy(handleIndex, e.key === back ? -step : step);
        } else if (
          (e.key === "Home" || e.key === "End") &&
          range &&
          now !== null &&
          now !== undefined
        ) {
          e.preventDefault();
          resizeBy(handleIndex, (e.key === "Home" ? range.min : range.max) - now);
        }
      }}
      className={cn(
        "group/handle relative flex shrink-0 items-center justify-center bg-border-subtle outline-none transition-colors hover:bg-border-focus focus-visible:bg-border-focus",
        horizontal
          ? "w-px cursor-col-resize after:absolute after:inset-y-0 after:-left-1 after:-right-1"
          : "h-px cursor-row-resize after:absolute after:inset-x-0 after:-top-1 after:-bottom-1",
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <span
          aria-hidden="true"
          className={cn(
            "z-10 flex items-center justify-center gap-0.5 rounded-sm border bg-surface-1 shadow-xs group-focus-visible/handle:border-border-focus",
            horizontal ? "h-6 w-2.5 flex-col" : "h-2.5 w-6",
          )}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-0.5 rounded-full bg-fg-tertiary" />
          ))}
        </span>
      ) : null}
    </div>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
