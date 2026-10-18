import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** A bordered, rounded frame for a data table, so tables sit like the cards around them. */
export function TableCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-background [&_thead_th]:h-9 [&_thead_th]:bg-surface-2 [&_thead_th]:text-xs [&_thead_th]:font-medium [&_thead_th]:text-fg-tertiary [&_td]:py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
