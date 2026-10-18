import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** The row of buttons at the bottom of a form card: optional note on the left, actions right. */
export function FormActions({
  note,
  className,
  children,
}: {
  note?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-t pt-4", className)}>
      <div className="min-w-0 flex-1 text-caption text-fg-tertiary">{note}</div>
      {children}
    </div>
  );
}
