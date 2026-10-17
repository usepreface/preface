import * as React from "react";

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
