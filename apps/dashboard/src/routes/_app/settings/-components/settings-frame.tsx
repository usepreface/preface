import type * as React from "react";

import { Link } from "@tanstack/react-router";

import {
  ActivityIcon,
  GlobeIcon,
  KeyIcon,
  LayersIcon,
  LockIcon,
  LockKeyIcon,
  SettingsIcon,
  UsersIcon,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { NavList, type NavGroup } from "#/components/shell/nav-sidebar";
import { PageBar, PageContent, type Crumb } from "#/components/shell/page";
import { useOrganization } from "#/hooks/organizations";

function settingsNav(): NavGroup[] {
  return [
    {
      section: "Organization",
      items: [
        {
          label: "General",
          icon: SettingsIcon,
          link: { to: "/settings/general" },
        },
        { label: "Members", icon: UsersIcon, link: { to: "/settings/members" } },
        { label: "Teams", icon: LayersIcon, link: { to: "/settings/teams" } },
        { label: "Roles", icon: KeyIcon, link: { to: "/settings/roles" } },
      ],
    },
    {
      section: "Security",
      items: [
        { label: "Google sign-in", icon: KeyIcon, link: { to: "/settings/google" } },
        {
          label: "Login policy",
          icon: LockIcon,
          link: { to: "/settings/authentication" },
        },
        {
          label: "SSO connections",
          icon: LockKeyIcon,
          link: { to: "/settings/connections" },
        },
        { label: "Domains", icon: GlobeIcon, link: { to: "/settings/domains" } },
        {
          label: "Activity",
          icon: ActivityIcon,
          link: { to: "/settings/audit" },
        },
      ],
    },
  ];
}

/*
 * Every organization settings page: the breadcrumb bar across the panel, the settings
 * navigation on the left (a scrolling row of links on small screens) and the page on the right.
 */
export function SettingsFrame({
  crumbs = [],
  actions,
  width = "lg",
  children,
}: {
  /** Crumbs after "Settings". The last one is the current page. */
  crumbs?: Crumb[];
  actions?: React.ReactNode;
  width?: "md" | "lg" | "full";
  children: React.ReactNode;
}) {
  const { access } = useOrganization();
  const permissions = {
    General: "organization.read",
    Members: "members.read",
    Teams: "teams.read",
    Roles: "roles.read",
    Activity: "audit.read",
  } as const;
  const groups = settingsNav()
    .map((group) => ({
      section: group.section,
      collapsible: group.collapsible,
      items: group.items.filter((item) => {
        if (
          item.label === "Google sign-in" ||
          item.label === "Login policy" ||
          item.label === "SSO connections" ||
          item.label === "Domains"
        )
          return access.isOwner;
        const permission = permissions[item.label as keyof typeof permissions];
        return permission !== undefined && access.permissions.includes(permission);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <PageBar
        crumbs={[
          {
            label: "Settings",
            icon: SettingsIcon,
            link: { to: "/settings/general" },
          },
          ...crumbs,
        ]}
        actions={actions}
      />
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <NavList
          label="Settings"
          groups={groups}
          className="w-54 shrink-0 overflow-y-auto border-r px-2.5 py-2 max-md:hidden"
        />
        <nav
          aria-label="Settings"
          className="flex shrink-0 gap-1 overflow-x-auto border-b px-3 py-2 md:hidden"
        >
          {groups
            .flatMap((group) => group.items)
            .map((item) => (
              <Link
                key={item.label}
                {...item.link}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1.5 text-13 whitespace-nowrap text-fg-secondary",
                  "data-[status=active]:bg-selected data-[status=active]:font-medium data-[status=active]:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <PageContent width={width}>{children}</PageContent>
      </div>
    </>
  );
}
