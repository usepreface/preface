import { useRouterState } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import {
  AiChatIcon,
  AnalyticsIcon,
  ApiIcon,
  BotIcon,
  BrainIcon,
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

const access: ReadonlySet<string> = new Set(["google", "authentication", "connections", "domains"]);

/*
 * The organization sidebar. Home and the admin entries are routes; the knowledge and channel
 * entries stay disabled until implemented. Settings links follow current organization permissions.
 */
export function OrgSidebar({ name, ...props }: Parameters<SidebarRender>[0] & { name: string }) {
  const { access: authority } = useOrganization();
  const section = useRouterState({
    select: (state) => state.location.pathname.split("/settings/")[1]?.split("/")[0],
  });

  const groups: NavGroup[] = [
    {
      items: [
        {
          label: "Home",
          icon: HomeIcon,
          link: { to: "/", activeOptions: { exact: true } },
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

  const peopleLink = authority.permissions.includes("members.read")
    ? ("/settings/members" as const)
    : authority.permissions.includes("teams.read")
      ? ("/settings/teams" as const)
      : authority.permissions.includes("roles.read")
        ? ("/settings/roles" as const)
        : undefined;

  groups.push({
    section: "Admin",
    items: [
      ...(peopleLink
        ? [
            {
              label: "Teams & members",
              icon: UsersIcon,
              link: { to: peopleLink },
              active: section === "members" || section === "teams" || section === "roles",
            },
          ]
        : []),
      ...(authority.isOwner
        ? [
            {
              label: "Access & SSO",
              icon: ShieldIcon,
              link: { to: "/settings/authentication" } as const,
              active: access.has(section ?? ""),
            },
          ]
        : []),
      { label: "AI providers", icon: BrainIcon },
      { label: "API keys", icon: KeyIcon },
      {
        label: "Settings",
        icon: SettingsIcon,
        link: { to: "/settings/general" },
        active: section === "general" || section === "audit",
      },
    ],
  });

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
