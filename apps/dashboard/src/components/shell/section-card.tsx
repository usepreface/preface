import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

/** A titled card on a settings page: a form, a status summary or a danger action. */
export function SectionCard({
  title,
  description,
  danger,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  danger?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-surface-1 px-5 py-4.5 sm:px-6",
        danger ? "border-danger/50" : null,
        className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-13 text-fg-secondary">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
