"use client";

import * as React from "react";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "../lib/utils";
import { Button } from "./button";

/*
 * Scroll-snap carousel. Native scrolling does the work (touch, trackpad, keyboard),
 * so there is no animation library and reduced motion is respected by the browser.
 */

type CarouselContextValue = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  orientation: "horizontal" | "vertical";
  index: number;
  count: number;
  canPrev: boolean;
  canNext: boolean;
  scrollTo: (index: number) => void;
  prev: () => void;
  next: () => void;
  setCount: (n: number) => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) {
    throw new Error("useCarousel must be used within <Carousel />");
  }
  return ctx;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Carousel({
  orientation = "horizontal",
  onIndexChange,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical";
  onIndexChange?: (index: number) => void;
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [edges, setEdges] = React.useState({ start: true, end: false });
  const horizontal = orientation === "horizontal";

  const items = React.useCallback(
    () =>
      Array.from(
        viewportRef.current?.querySelectorAll<HTMLElement>("[data-slot=carousel-item]") ?? [],
      ),
    [],
  );

  const scrollTo = React.useCallback(
    (i: number) => {
      const el = items()[i];
      const vp = viewportRef.current;
      if (!el || !vp) {
        return;
      }
      vp.scrollTo({
        [horizontal ? "left" : "top"]: horizontal ? el.offsetLeft : el.offsetTop,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [horizontal, items],
  );

  React.useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) {
      return;
    }
    const update = () => {
      const pos = horizontal ? vp.scrollLeft : vp.scrollTop;
      const max = horizontal ? vp.scrollWidth - vp.clientWidth : vp.scrollHeight - vp.clientHeight;
      const list = items();
      let nearest = 0;
      let best = Infinity;
      list.forEach((el, i) => {
        const d = Math.abs((horizontal ? el.offsetLeft : el.offsetTop) - pos);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });
      setIndex(pos >= max - 2 && list.length ? list.length - 1 : nearest);
      setEdges({ start: pos <= 2, end: pos >= max - 2 });
    };
    update();
    vp.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(vp);
    return () => {
      vp.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [horizontal, items, count]);

  React.useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  const value = React.useMemo<CarouselContextValue>(
    () => ({
      viewportRef,
      orientation,
      index,
      count,
      canPrev: !edges.start,
      canNext: !edges.end,
      scrollTo,
      prev: () => scrollTo(Math.max(index - 1, 0)),
      next: () => scrollTo(Math.min(index + 1, count - 1)),
      setCount,
    }),
    [orientation, index, count, edges, scrollTo],
  );

  return (
    <CarouselContext.Provider value={value}>
      <div
        data-slot="carousel"
        role="region"
        aria-roledescription="carousel"
        className={cn("relative", className)}
        onKeyDownCapture={(e) => {
          const back = horizontal ? "ArrowLeft" : "ArrowUp";
          const fwd = horizontal ? "ArrowRight" : "ArrowDown";
          if (e.key === back || e.key === fwd) {
            if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) {
              return;
            }
            e.preventDefault();
            if (e.key === back) {
              value.prev();
            } else {
              value.next();
            }
          }
        }}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { viewportRef, orientation, setCount } = useCarousel();
  const n = React.Children.count(children);
  React.useEffect(() => setCount(n), [n, setCount]);
  return (
    <div
      ref={viewportRef}
      data-slot="carousel-content"
      className={cn(
        "relative flex snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        orientation === "horizontal"
          ? "snap-x overflow-x-auto overscroll-x-contain"
          : "snap-y flex-col overflow-y-auto overscroll-y-contain",
        "gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { prev, canPrev, orientation } = useCarousel();
  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn("rounded-full bg-surface-1", className)}
      disabled={!canPrev}
      onClick={prev}
      aria-label="Previous slide"
      {...props}
    >
      <HugeiconsIcon
        icon={ArrowLeft01Icon}
        strokeWidth={2}
        className={cn(orientation === "vertical" && "rotate-90")}
      />
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { next, canNext, orientation } = useCarousel();
  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn("rounded-full bg-surface-1", className)}
      disabled={!canNext}
      onClick={next}
      aria-label="Next slide"
      {...props}
    >
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2}
        className={cn(orientation === "vertical" && "rotate-90")}
      />
    </Button>
  );
}

/** Pager dots. The active dot stretches into a pill. */
function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
  const { index, count, scrollTo } = useCarousel();
  return (
    <div
      data-slot="carousel-dots"
      className={cn("flex items-center justify-center gap-1.5", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index ? "true" : undefined}
          onClick={() => scrollTo(i)}
          className="h-1.5 w-1.5 rounded-full bg-surface-4 outline-none transition-[width,background-color] duration-200 hover:bg-border-strong focus-visible:ring-3 focus-visible:ring-focus-ring aria-current:w-5 aria-current:bg-primary motion-reduce:transition-none"
        />
      ))}
    </div>
  );
}

export {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
};
