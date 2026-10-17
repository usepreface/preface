import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** Mono pill above section headings. */
export function Eyebrow({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2.5 rounded-full bg-primary-subtle px-3 py-1.5 font-mono text-xs leading-4 font-medium tracking-[0.06em] text-fg-accent uppercase",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}
