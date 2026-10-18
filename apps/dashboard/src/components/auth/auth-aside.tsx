import type * as React from "react";

import type { IconComponent } from "@usepreface/ui/icons";

/** Illustration, a short title and copy, then up to three points. The right half of AuthLayout. */
export function AuthAside({
  art,
  title,
  description,
  points,
  children,
}: {
  art?: React.ReactNode;
  title: string;
  description?: string;
  points?: readonly (readonly [IconComponent, string, string])[];
  children?: React.ReactNode;
}) {
  return (
    <>
      {art}
      <div className="flex max-w-100 flex-col items-center gap-2 text-center">
        <h2 className="text-heading-3 text-foreground">{title}</h2>
        {description ? <p className="text-sm text-fg-secondary">{description}</p> : null}
      </div>
      {children}
      {points ? (
        <ul className="flex w-full max-w-100 flex-col gap-3.5">
          {points.map(([Icon, point, text], i) => (
            <li
              key={point}
              className="flex animate-in gap-3 fill-mode-both duration-500 fade-in-0 slide-in-from-bottom-1"
              style={{ animationDelay: `${200 + i * 90}ms` }}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
                <Icon className="size-4 text-icon-accent" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{point}</span>
                <span className="text-xs text-fg-secondary">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
