import type * as React from "react";

import { Link, useParams } from "@tanstack/react-router";

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

function settingsNav(slug: string): NavGroup[] {
  const params = { slug };
  return [
    {
      section: "Organization",
      items: [
        {
          label: "General",
          icon: SettingsIcon,
          link: { to: "/org/$slug/settings/general", params },
        },
        { label: "Members", icon: UsersIcon, link: { to: "/org/$slug/settings/members", params } },
        { label: "Teams", icon: LayersIcon, link: { to: "/org/$slug/settings/teams", params } },
        { label: "Roles", icon: KeyIcon, link: { to: "/org/$slug/settings/roles", params } },
      ],
    },
    {
      section: "Security",
      items: [
        {
          label: "Login policy",
          icon: LockIcon,
          link: { to: "/org/$slug/settings/authentication", params },
        },
        {
          label: "SSO connections",
          icon: LockKeyIcon,
          link: { to: "/org/$slug/settings/connections", params },
        },
        { label: "Domains", icon: GlobeIcon, link: { to: "/org/$slug/settings/domains", params } },
        {
          label: "Activity",
          icon: ActivityIcon,
          link: { to: "/org/$slug/settings/audit", params },
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
  const { slug } = useParams({ from: "/org/$slug/_app" });
  const groups = settingsNav(slug);

  return (
    <>
      <PageBar
        crumbs={[
          {
            label: "Settings",
            icon: SettingsIcon,
            link: { to: "/org/$slug/settings/general", params: { slug } },
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
