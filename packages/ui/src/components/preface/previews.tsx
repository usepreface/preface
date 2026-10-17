import * as React from "react";

import { ArrowUpRightIcon, CalendarIcon } from "../../icons";
import { cn } from "../../lib/utils";
import type { BrandName } from "../../logos/registry";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { LogoTile } from "./data-display";

/*
 * Hover-card bodies from Figma page 52: person, source and citation previews. Put them inside
 * HoverCardContent. Previews only repeat what a click would show; never put actions only here.
 */

/** Person: avatar, name, email, a line of context, two stats and a footer. */
function PersonPreview({
  name,
  email,
  avatarUrl,
  initials,
  bio,
  stats,
  meta,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  name: string;
  email?: string;
  avatarUrl?: string;
  initials?: string;
  bio?: React.ReactNode;
  stats?: { value: React.ReactNode; label: React.ReactNode }[];
  meta?: React.ReactNode;
}) {
  const fallback =
    initials ??
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <div data-slot="person-preview" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary text-primary-foreground">{fallback}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{name}</span>
          {email ? <span className="truncate text-xs text-fg-tertiary">{email}</span> : null}
        </div>
      </div>
      {bio ? <p className="text-13 text-fg-secondary">{bio}</p> : null}
      {stats?.length ? (
        <div className="flex flex-wrap gap-4">
          {stats.map((s, i) => (
            <span key={i} className="flex items-baseline gap-1">
              <span className="text-13 font-medium text-foreground tabular-nums">{s.value}</span>
              <span className="text-xs text-fg-tertiary">{s.label}</span>
            </span>
          ))}
        </div>
      ) : null}
      {meta ? (
        <div className="flex items-center gap-1.5 text-xs text-fg-tertiary">
          <CalendarIcon className="size-3.5 text-icon-secondary" aria-hidden="true" />
          {meta}
        </div>
      ) : null}
    </div>
  );
}

/** Source: logo tile, name, kind, description and a row of status badges. */
function SourcePreview({
  brand,
  name,
  kind,
  description,
  badges,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  brand?: BrandName;
  name: string;
  kind?: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
}) {
  return (
    <div data-slot="source-preview" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center gap-3">
        <LogoTile brand={brand} size={36} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-foreground">{name}</span>
          {kind ? <span className="truncate text-xs text-fg-tertiary">{kind}</span> : null}
        </div>
      </div>
      {description ? <p className="text-13 text-fg-secondary">{description}</p> : null}
      {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}
    </div>
  );
}

/** Citation: source, title, the quoted passage with the matched span emphasised, and where. */
function CitationPreview({
  brand,
  title,
  href,
  quote,
  location,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children" | "title"> & {
  brand?: BrandName;
  title: React.ReactNode;
  href?: string;
  quote: React.ReactNode;
  location?: React.ReactNode;
}) {
  const head = (
    <>
      <LogoTile brand={brand} size={20} />
      <span className="min-w-0 flex-1 truncate text-13 font-medium text-foreground">{title}</span>
      {href ? (
        <ArrowUpRightIcon className="size-3.5 shrink-0 text-icon-secondary" aria-hidden="true" />
      ) : null}
    </>
  );
  return (
    <div data-slot="citation-preview" className={cn("flex flex-col gap-2.5", className)} {...props}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          {head}
        </a>
      ) : (
        <div className="flex items-center gap-2">{head}</div>
      )}
      <blockquote className="border-l-2 border-primary pl-2.5 text-13 text-fg-secondary [&_mark]:bg-transparent [&_mark]:text-foreground">
        {quote}
      </blockquote>
      {location ? <p className="text-xs text-fg-tertiary">{location}</p> : null}
    </div>
  );
}

export { CitationPreview, PersonPreview, SourcePreview };
