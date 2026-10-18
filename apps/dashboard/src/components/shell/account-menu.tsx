import { Link } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import { BuildingIcon, LogoutIcon, ServerIcon, ShieldIcon, UserIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { ThemeSwitch } from "#/components/theme-switch";
import { useSignOut } from "#/hooks/session";
import { initialsOf, toneOf } from "#/lib/identity";

export type Person = { name: string; email: string };

/** The avatar in the top bar and the menu behind it: account pages, organizations, theme, sign out. */
export function AccountMenu({
  person,
  instanceOwner,
}: {
  person: Person;
  instanceOwner?: boolean;
}) {
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
      >
        <Avatar size="sm">
          <AvatarFallback className={cn("text-white", toneOf(person.name))}>
            {initialsOf(person.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{person.name}</span>
            <span className="text-xs font-normal text-fg-tertiary">{person.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/account/profile" />}>
          <UserIcon />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/account/security" />}>
          <ShieldIcon />
          Accounts and sessions
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/organizations" />}>
          <BuildingIcon />
          Switch organization
        </DropdownMenuItem>
        {instanceOwner ? (
          <DropdownMenuItem render={<Link to="/instance" />}>
            <ServerIcon />
            Instance settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm text-fg-secondary">
          Theme
          <ThemeSwitch />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={signOut.pending} onClick={() => void signOut.run()}>
          <LogoutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
