import * as React from "react";

import { cn } from "../../lib/utils";

/*
 * Page chrome from Figma page 26 (App shell): the 48px top bar, the 52px page header with
 * breadcrumbs and actions, and the page body.
 */

function TopBar({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="top-bar"
      className={cn("flex h-12 shrink-0 items-center gap-3 bg-canvas pr-3 pl-3.5", className)}
      {...props}
    />
  );
}

function PageHeader({
  icon,
  title,
  breadcrumb,
  actions,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      data-slot="page-header"
      className={cn("flex h-13 shrink-0 items-center gap-2 border-b bg-background px-5", className)}
      {...props}
    >
      {breadcrumb ?? (
        <h1 className="flex items-center gap-2 text-sm font-medium text-foreground [&_svg]:text-icon-secondary">
          {icon}
          {title}
        </h1>
      )}
      {children}
      {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function PageBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-body"
      className={cn("flex flex-1 flex-col gap-6 overflow-auto p-6", className)}
      {...props}
    />
  );
}

function SectionHeading({
  title,
  description,
  actions,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title" | "children"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div data-slot="section-heading" className={cn("flex items-end gap-4", className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-heading-3 text-foreground">{title}</h2>
        {description ? <p className="text-sm text-fg-secondary">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export { TopBar, PageHeader, PageBody, SectionHeading };
