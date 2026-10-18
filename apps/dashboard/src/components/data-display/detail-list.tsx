import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** Label and value pairs, one per row. */
export function DetailList({
  items,
  labelWidth = "w-32",
  className,
}: {
  items: readonly { label: string; value: React.ReactNode; mono?: boolean }[];
  labelWidth?: string;
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-col text-left", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-4 border-b border-border-subtle py-2.5 last:border-b-0"
        >
          <dt className={cn("shrink-0 text-13 text-fg-tertiary", labelWidth)}>{item.label}</dt>
          <dd
            className={cn(
              "min-w-0 flex-1 truncate text-13 font-medium text-foreground",
              item.mono ? "font-mono text-mono-sm font-normal" : null,
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
