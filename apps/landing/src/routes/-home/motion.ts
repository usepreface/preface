import * as React from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the visitor asked for less motion. Always false while prerendering. */
export function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

/**
 * Reveals every `[data-reveal]` element once it scrolls into view. Elements stay readable
 * without JavaScript: styles.css only hides them under `html.js`.
 */
export function useScrollReveal() {
  React.useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown])");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-shown", "");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    for (const item of items) {
      observer.observe(item);
    }
    return () => observer.disconnect();
  }, []);
}

/** Whether `ref` is on screen. Used to pause loops that nobody can see. */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, margin = "0px") {
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, margin]);
  return inView;
}

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
