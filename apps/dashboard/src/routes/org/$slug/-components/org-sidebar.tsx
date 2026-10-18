import { useRouterState } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import {
  AiChatIcon,
  AnalyticsIcon,
  ApiIcon,
  BotIcon,
  ChatIcon,
  DatabaseIcon,
  FileIcon,
  HomeIcon,
  InboxIcon,
  KeyIcon,
  LayersIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  UsersIcon,
} from "@usepreface/ui/icons";

import { NavSidebar, SidebarCard, type NavGroup } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { useOrganization } from "#/hooks/organizations";

const access: ReadonlySet<string> = new Set(["authentication", "connections", "domains"]);

/*
 * The organization sidebar. Home and the admin entries are routes; the knowledge and channel
 * entries stay disabled until implemented. Settings links follow current organization permissions.
 */
export function OrgSidebar({
  slug,
  name,
  ...props
}: Parameters<SidebarRender>[0] & { slug: string; name: string }) {
  const { access: authority } = useOrganization();
  const section = useRouterState({
    select: (state) => state.location.pathname.split("/settings/")[1]?.split("/")[0],
  });
  const params = { slug };

  const groups: NavGroup[] = [
    {
      items: [
        {
          label: "Home",
          icon: HomeIcon,
          link: { to: "/org/$slug", params, activeOptions: { exact: true } },
        },
        { label: "Ask", icon: AiChatIcon },
        { label: "Inbox", icon: InboxIcon },
      ],
    },
    {
      section: "Knowledge",
      items: [
        { label: "Sources", icon: DatabaseIcon },
        { label: "Collections", icon: LayersIcon },
        { label: "Documents", icon: FileIcon },
        { label: "Search quality", icon: AnalyticsIcon },
      ],
    },
    {
      section: "Channels",
      items: [
        { label: "Chat widgets", icon: ChatIcon },
        { label: "Bots", icon: BotIcon },
        { label: "API & MCP", icon: ApiIcon },
      ],
    },
  ];

  {
    groups.push({
      section: "Organization",
      items: [
        ...(authority.permissions.includes("members.read")
          ? [
              {
                label: "Members",
                icon: UsersIcon,
                link: { to: "/org/$slug/settings/members", params } as const,
                active: section === "members",
              },
            ]
          : []),
        ...(authority.permissions.includes("teams.read")
          ? [
              {
                label: "Teams",
                icon: LayersIcon,
                link: { to: "/org/$slug/settings/teams", params } as const,
                active: section === "teams",
              },
            ]
          : []),
        ...(authority.permissions.includes("roles.read")
          ? [
              {
                label: "Roles",
                icon: KeyIcon,
                link: { to: "/org/$slug/settings/roles", params } as const,
                active: section === "roles",
              },
            ]
          : []),
        ...(authority.isOwner
          ? [
              {
                label: "Access & SSO",
                icon: ShieldIcon,
                link: { to: "/org/$slug/settings/authentication", params } as const,
                active: access.has(section ?? ""),
              },
            ]
          : []),
        {
          label: "Settings",
          icon: SettingsIcon,
          link: { to: "/org/$slug/settings/general", params },
          active: section === "general" || section === "audit",
        },
      ],
    });
  }

  return (
    <NavSidebar
      {...props}
      title={name}
      action={
        <Button disabled variant="outline" className="mb-2 w-full justify-start">
          <PlusIcon data-icon="inline-start" />
          New conversation
        </Button>
      }
      groups={groups}
      footer={<SidebarCard title="Self-hosted Preface" detail={window.location.host} />}
    />
  );
}
