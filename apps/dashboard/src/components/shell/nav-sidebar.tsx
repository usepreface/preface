import type * as React from "react";

import { Link, type LinkOptions } from "@tanstack/react-router";

import { Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { ChevronDownIcon, SidebarIcon, type IconComponent } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

export type NavItem = {
  label: string;
  icon: IconComponent;
  /** Items without a link are placeholders for pages that don't exist yet. */
  link?: LinkOptions;
  count?: number;
  /** Highlights an item whose page is outside the router's active matching. */
  active?: boolean;
};

export type NavGroup = { section?: string; collapsible?: boolean; items: NavItem[] };

const itemClass = cn(
  "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm text-fg-secondary outline-none transition-colors",
  "hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring",
  "data-[status=active]:bg-selected data-[status=active]:font-medium data-[status=active]:text-foreground",
  "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-icon-secondary data-[status=active]:[&_svg]:text-icon",
);

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon />
      <span className="flex-1 truncate">{item.label}</span>
      {item.count ? <Counter>{item.count}</Counter> : null}
    </>
  );

  if (item.link) {
    return (
      <Link
        {...item.link}
        className={itemClass}
        onClick={onNavigate}
        data-status={item.active ? "active" : undefined}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={itemClass} data-status={item.active ? "active" : undefined}>
      {content}
    </button>
  );
}

/** A list of navigation groups: the body of every sidebar, and the settings sub-navigation. */
export function NavList({
  groups,
  onNavigate,
  className,
  label,
}: {
  groups: NavGroup[];
  onNavigate?: () => void;
  className?: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className={cn("flex flex-col gap-0.5", className)}>
      {groups.map((group) => (
        <div key={group.section ?? "main"} className="flex flex-col gap-0.5">
          {group.section ? (
            <div className="flex items-center gap-1 px-2 pt-3.5 pb-1 text-13 font-medium text-fg-tertiary">
              <span className="flex-1">{group.section}</span>
              {group.collapsible ? (
                <ChevronDownIcon size={14} className="text-icon-secondary" />
              ) : null}
            </div>
          ) : null}
          {group.items.map((item) => (
            <NavRow key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

/** The floating sidebar panel: a title, an optional primary action, navigation and a footer card. */
export function NavSidebar({
  title,
  action,
  groups,
  footer,
  onCollapse,
  onNavigate,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  groups: NavGroup[];
  footer?: React.ReactNode;
  onCollapse?: () => void;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-62 shrink-0 flex-col gap-0.5 overflow-y-auto rounded-xl border bg-background px-2 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-2 pt-0.5 pb-2">
        <span className="flex-1 truncate text-heading-3 text-foreground">{title}</span>
        {onCollapse ? (
          <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onCollapse}>
            <SidebarIcon />
          </Button>
        ) : null}
      </div>
      {action}
      <NavList label={title} groups={groups} onNavigate={onNavigate} />
      <div className="min-h-4 flex-1" />
      {footer}
    </div>
  );
}

/** The status card at the bottom of a sidebar. */
export function SidebarCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-50 motion-reduce:hidden" />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
        <span className="truncate text-xs font-medium text-foreground">{title}</span>
      </div>
      <span className="truncate text-xs text-fg-tertiary">{detail}</span>
    </div>
  );
}
