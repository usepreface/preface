import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** Page section on the landing canvas: 1200 px column, 100 px vertical rhythm. */
export function Section({
  className,
  inner,
  children,
  ...props
}: React.ComponentProps<"section"> & { inner?: string }) {
  return (
    <section className={cn("relative bg-(--landing-canvas)", className)} {...props}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-300 flex-col px-5 py-16 sm:px-8 lg:px-0 lg:py-25",
          inner,
        )}
      >
        {children}
      </div>
    </section>
  );
}
