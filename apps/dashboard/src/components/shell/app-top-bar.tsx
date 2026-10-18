import type * as React from "react";

import { Link } from "@tanstack/react-router";

import { PrefaceMark } from "@usepreface/ui/brand";
import { Button } from "@usepreface/ui/components/button";
import { Kbd } from "@usepreface/ui/components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";
import {
  ChevronDownIcon,
  HelpIcon,
  InboxIcon,
  MenuIcon,
  SearchIcon,
  SidebarIcon,
} from "@usepreface/ui/icons";
import { TopBar } from "@usepreface/ui/preface/layout";

import { OrgAvatar } from "#/components/organization/org-avatar";
import { Route as RootRoute } from "#/routes/__root";

import { AccountMenu, type Person } from "./account-menu";

/*
 * The 48 px bar above the panels: where you are (an organization or the instance), ⌘K search,
 * inbox, help and the account menu. On small screens a menu button opens the sidebar sheet.
 */
export function AppTopBar({
  workspace,
  person,
  instanceOwner,
  search = true,
  sidebarOpen,
  onOpenMenu,
  onExpandSidebar,
}: {
  /** An organization name, or null for instance-level pages. */
  workspace: string | null;
  person: Person;
  instanceOwner?: boolean;
  search?: boolean;
  sidebarOpen?: boolean;
  onOpenMenu?: () => void;
  onExpandSidebar?: () => void;
}) {
  const { instance } = RootRoute.useRouteContext();
  return (
    <TopBar>
      {onOpenMenu ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open menu"
          className="lg:hidden"
          onClick={onOpenMenu}
        >
          <MenuIcon />
        </Button>
      ) : null}
      {onExpandSidebar && !sidebarOpen ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand sidebar"
          className="max-lg:hidden"
          onClick={onExpandSidebar}
        >
          <SidebarIcon />
        </Button>
      ) : null}
      <Link
        to="/organizations"
        className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        {workspace ? (
          <OrgAvatar name={workspace} size="sm" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-brand-slate">
            <PrefaceMark tone="ice" size={14} title="" />
          </span>
        )}
        <span className="text-sm font-medium text-foreground">
          {workspace ?? instance.instanceName}
        </span>
        <ChevronDownIcon size={14} className="text-icon-secondary" />
      </Link>
      <div className="flex min-w-0 flex-1 justify-center">{search ? <SearchButton /> : null}</div>
      {search ? (
        <Button variant="ghost" size="icon" aria-label="Search" className="sm:hidden">
          <SearchIcon />
        </Button>
      ) : null}
      <IconTip label="Inbox (not available yet)" icon={<InboxIcon />} disabled />
      <IconTip
        label="Help & docs"
        icon={<HelpIcon />}
        className="max-sm:hidden"
        href="https://github.com/usepreface/preface#readme"
      />
      <AccountMenu person={person} instanceOwner={instanceOwner} />
    </TopBar>
  );
}

function SearchButton() {
  return (
    <button
      type="button"
      className="flex h-8 w-full max-w-120 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-fg-tertiary outline-none transition-colors hover:border-border-default focus-visible:ring-3 focus-visible:ring-focus-ring max-sm:hidden"
    >
      <SearchIcon className="size-4 text-icon-secondary" />
      <span className="flex-1 truncate text-left">Search or ask anything</span>
      <Kbd>⌘K</Kbd>
    </button>
  );
}

function IconTip({
  label,
  icon,
  className,
  href,
  disabled,
}: {
  href?: string;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className={className}
            disabled={disabled}
            nativeButton={!href}
            render={href ? <a href={href} target="_blank" rel="noreferrer" /> : undefined}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
