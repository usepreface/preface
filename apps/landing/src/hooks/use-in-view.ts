import * as React from "react";

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
