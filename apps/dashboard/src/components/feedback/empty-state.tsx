import type * as React from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@usepreface/ui/components/empty";
import { cn } from "@usepreface/ui/lib/utils";

/** An illustration, a title, one or two sentences and the next action. */
export function EmptyState({
  art,
  title,
  description,
  actions,
  bordered,
  className,
}: {
  art: React.ReactNode;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <Empty
      className={cn("gap-5 py-12", bordered ? "rounded-xl border border-solid" : null, className)}
    >
      <EmptyHeader className="max-w-110 gap-3">
        <EmptyMedia className="mb-1 [&_svg]:h-44 [&_svg]:w-auto">{art}</EmptyMedia>
        <EmptyTitle className="text-heading-3 text-foreground">{title}</EmptyTitle>
        <EmptyDescription className="text-sm text-fg-secondary">{description}</EmptyDescription>
      </EmptyHeader>
      {actions ? (
        <EmptyContent className="flex-row justify-center gap-2.5">{actions}</EmptyContent>
      ) : null}
    </Empty>
  );
}
