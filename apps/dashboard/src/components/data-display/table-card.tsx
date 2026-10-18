import type * as React from "react";

import { Skeleton } from "@usepreface/ui/components/skeleton";
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

/** Rows of placeholders while a table loads: a person column, then short values. */
export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <TableCard>
      <div aria-busy="true" aria-label="Loading">
        <div className="h-9 border-b bg-surface-2" />
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center gap-6 border-b px-3 py-3.5 last:border-b-0">
            <span className="flex flex-1 items-center gap-2.5">
              <Skeleton className="size-8 rounded-full" />
              <span className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-44" />
              </span>
            </span>
            {[...Array.from({ length: columns - 1 }).keys()].map((column) => (
              <Skeleton key={column} className="h-3 w-20 max-md:hidden" />
            ))}
          </div>
        ))}
      </div>
    </TableCard>
  );
}
