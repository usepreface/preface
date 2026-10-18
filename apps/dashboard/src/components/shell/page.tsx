import type * as React from "react";

import { Link, type LinkOptions } from "@tanstack/react-router";

import { ChevronRightIcon, type IconComponent } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { PageHeader } from "@usepreface/ui/preface/layout";

export type Crumb = { label: string; icon?: IconComponent; link?: LinkOptions };

/** The 52 px bar at the top of a panel: breadcrumbs on the left, actions on the right. */
export function PageBar({ crumbs, actions }: { crumbs: Crumb[]; actions?: React.ReactNode }) {
  const current = crumbs[crumbs.length - 1];
  return (
    <PageHeader
      title={current?.label}
      actions={actions}
      breadcrumb={
        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              const Icon = crumb.icon;
              const label = (
                <>
                  {Icon ? (
                    <Icon className={cn("size-4", last ? "text-icon" : "text-icon-secondary")} />
                  ) : null}
                  <span className="truncate">{crumb.label}</span>
                </>
              );
              return (
                <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
                  {last ? (
                    <span
                      aria-current="page"
                      className="flex items-center gap-1.5 font-medium text-foreground"
                    >
                      {label}
                    </span>
                  ) : crumb.link ? (
                    <Link
                      {...crumb.link}
                      className="flex items-center gap-1.5 rounded-sm text-fg-secondary outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 text-fg-secondary">{label}</span>
                  )}
                  {last ? null : (
                    <ChevronRightIcon className="size-3.5 text-icon-secondary" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      }
    />
  );
}

/** The scrolling body of a panel, with a readable column width. */
export function PageContent({
  width = "lg",
  className,
  children,
}: {
  width?: "md" | "lg" | "full";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-8 sm:py-7",
          width === "md" ? "max-w-200" : width === "lg" ? "max-w-260" : null,
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A page's own heading: title, a sentence, and actions aligned to the bottom edge. */
export function PageTitle({
  title,
  description,
  actions,
  badges,
  leading,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  leading?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        {leading}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading-2 text-foreground">{title}</h1>
            {badges}
          </div>
          {description ? (
            <p className="max-w-150 text-sm text-fg-secondary">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** A titled block inside a page: connected accounts, sessions, the members table. */
export function PageSection({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-13 text-fg-secondary">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
