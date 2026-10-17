import { PrefaceMark } from "@usepreface/ui/brand";
import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Button } from "@usepreface/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import { Kbd } from "@usepreface/ui/components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";
import {
  ChevronDownIcon,
  HelpIcon,
  InboxIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  SidebarIcon,
  UserIcon,
} from "@usepreface/ui/icons";
import { TopBar } from "@usepreface/ui/preface/layout";

import { ThemeSwitch } from "../../../components/theme-switch";
import { placeholder } from "../../../lib/placeholder";

/*
 * The 48 px bar above the panels: organization switcher, ⌘K search, inbox, help and the
 * account menu. On small screens a menu button opens the sidebar sheet instead.
 */
export function AppTopBar({
  sidebarOpen,
  onOpenMenu,
  onExpandSidebar,
}: {
  sidebarOpen: boolean;
  onOpenMenu: () => void;
  onExpandSidebar: () => void;
}) {
  return (
    <TopBar>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        className="lg:hidden"
        onClick={onOpenMenu}
      >
        <MenuIcon />
      </Button>
      {sidebarOpen ? null : (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Expand sidebar"
          className="max-lg:hidden"
          onClick={onExpandSidebar}
        >
          <SidebarIcon />
        </Button>
      )}
      <button
        type="button"
        className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <span className="flex size-6 items-center justify-center rounded-[6px] bg-brand-slate">
          <PrefaceMark tone="ice" size={14} title="" />
        </span>
        <span className="text-sm font-medium text-foreground">{placeholder.organization.name}</span>
        <ChevronDownIcon size={14} className="text-icon-secondary" />
      </button>
      <div className="flex min-w-0 flex-1 justify-center">
        <button
          type="button"
          className="flex h-8 w-full max-w-120 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-fg-tertiary outline-none transition-colors hover:border-border-default focus-visible:ring-3 focus-visible:ring-focus-ring max-sm:hidden"
        >
          <SearchIcon className="size-4 text-icon-secondary" />
          <span className="flex-1 truncate text-left">Search or ask anything</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>
      <Button variant="ghost" size="icon" aria-label="Search" className="sm:hidden">
        <SearchIcon />
      </Button>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Inbox" />}>
          <InboxIcon />
        </TooltipTrigger>
        <TooltipContent>Inbox</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Help" className="max-sm:hidden" />
          }
        >
          <HelpIcon />
        </TooltipTrigger>
        <TooltipContent>Help & docs</TooltipContent>
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {placeholder.owner.initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{placeholder.owner.name}</span>
              <span className="text-xs font-normal text-fg-tertiary">
                {placeholder.owner.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-fg-secondary">
            Theme
            <ThemeSwitch />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogoutIcon />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TopBar>
  );
}
