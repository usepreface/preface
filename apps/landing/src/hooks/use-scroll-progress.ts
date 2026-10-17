import * as React from "react";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * Scroll progress of `ref` through the viewport: 0 when its top meets the bottom of the
 * screen, 1 when its bottom meets the top. Written to a CSS variable, not React state,
 * so scrolling never re-renders.
 */
export function useScrollProgress<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  variable = "--progress",
) {
  const reduced = useReducedMotion();
  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (reduced) {
      el.style.setProperty(variable, "0.5");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const p = Math.min(Math.max((window.innerHeight - rect.top) / total, 0), 1);
      el.style.setProperty(variable, p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, variable, reduced]);
}
