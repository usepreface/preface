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
import { placeholder } from "#/lib/placeholder";

const people: ReadonlySet<string> = new Set(["members", "teams", "roles"]);
const access: ReadonlySet<string> = new Set(["authentication", "connections", "domains"]);

/*
 * The organization sidebar. Home and the admin entries are routes; the knowledge and channel
 * entries are placeholders until their pages exist. Admin entries are hidden from members.
 */
export function OrgSidebar({
  slug,
  name,
  admin,
  ...props
}: Parameters<SidebarRender>[0] & { slug: string; name: string; admin: boolean }) {
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

  if (admin) {
    groups.push({
      section: "Admin",
      items: [
        {
          label: "Teams & members",
          icon: UsersIcon,
          link: { to: "/org/$slug/settings/members", params },
          active: people.has(section ?? ""),
        },
        {
          label: "Access & SSO",
          icon: ShieldIcon,
          link: { to: "/org/$slug/settings/authentication", params },
          active: access.has(section ?? ""),
        },
        { label: "AI providers", icon: BrainIcon },
        { label: "API keys", icon: KeyIcon },
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
        <Button variant="outline" className="mb-2 w-full justify-start">
          <PlusIcon data-icon="inline-start" />
          New conversation
        </Button>
      }
      groups={groups}
      footer={
        <SidebarCard
          title={`Self-hosted · ${placeholder.instance.version}`}
          detail={`${placeholder.instance.host} · 1 worker · idle`}
        />
      }
    />
  );
}
