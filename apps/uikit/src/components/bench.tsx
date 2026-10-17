import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

import { kebab } from "../lib/assets";

/** Page frame: a heading that names the Figma page it mirrors, then sections. */
export function Page({
  figma,
  title,
  description,
  actions,
  className,
  children,
}: {
  figma?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pt-10 pb-24", className)}
    >
      <div className="flex animate-in flex-wrap items-end gap-x-8 gap-y-4 duration-500 fade-in-0 slide-in-from-bottom-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          {figma ? (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 font-mono text-2xs text-fg-secondary">
              <span className="size-1.5 rounded-full bg-primary" />
              Figma · {figma}
            </span>
          ) : null}
          <h1 className="text-display-md text-foreground">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-body-lg text-pretty text-fg-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="flex animate-in flex-col gap-14 delay-75 duration-500 fill-mode-backwards fade-in-0 slide-in-from-bottom-3">
        {children}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  aside,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = kebab(title);
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b pb-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="group/h text-heading-3">
            <a href={`#${id}`} className="outline-none">
              {title}
              <span className="ml-2 text-fg-disabled opacity-0 transition-opacity group-hover/h:opacity-100">
                #
              </span>
            </a>
          </h2>
          {description ? (
            <p className="max-w-3xl text-13 text-fg-secondary">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className={className}>{children}</div>
    </section>
  );
}

/** A labelled specimen tile. */
export function Specimen({
  label,
  className,
  children,
}: {
  label?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div
        className={cn(
          "flex min-h-24 flex-wrap items-center gap-3 rounded-xl border bg-card p-5",
          className,
        )}
      >
        {children}
      </div>
      {label ? <div className="px-1 font-mono text-2xs text-fg-tertiary">{label}</div> : null}
    </div>
  );
}

/** Segmented filter used above galleries. */
export function Toolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-13 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b bg-background/80 px-6 py-3 backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
