import { Link } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import {
  AiChatIcon,
  AnalyticsIcon,
  ApiIcon,
  BotIcon,
  BrainIcon,
  ChatIcon,
  ChevronDownIcon,
  DatabaseIcon,
  FileIcon,
  HomeIcon,
  InboxIcon,
  KeyIcon,
  LayersIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  SidebarIcon,
  SlidersIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { placeholder } from "../../../lib/placeholder";

/*
 * Figma "Empty organization" sidebar. Only Home is a route for now; the other items are
 * placeholders for pages that don't exist yet.
 */

type Item = { label: string; icon: IconComponent; to?: "/" };

const nav: { section?: string; items: Item[] }[] = [
  {
    items: [
      { label: "Home", icon: HomeIcon, to: "/" },
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
  {
    section: "Admin",
    items: [
      { label: "Teams & members", icon: UsersIcon },
      { label: "Access & SSO", icon: ShieldIcon },
      { label: "AI providers", icon: BrainIcon },
      { label: "API keys", icon: KeyIcon },
      { label: "Settings", icon: SettingsIcon },
    ],
  },
];

const itemClass = cn(
  "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm text-fg-secondary outline-none transition-colors",
  "hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring",
  "data-[status=active]:bg-selected data-[status=active]:font-medium data-[status=active]:text-foreground",
  "[&_svg]:text-icon-secondary data-[status=active]:[&_svg]:text-icon",
);

function NavItem({ item, onNavigate }: { item: Item; onNavigate?: () => void }) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon />
      <span className="flex-1 truncate">{item.label}</span>
    </>
  );
  return item.to ? (
    <Link to={item.to} className={itemClass} onClick={onNavigate}>
      {content}
    </Link>
  ) : (
    <button type="button" className={itemClass}>
      {content}
    </button>
  );
}

/** The floating sidebar. `onNavigate` closes the mobile sheet after a link is followed. */
export function AppSidebar({
  className,
  onCollapse,
  onNavigate,
}: {
  className?: string;
  onCollapse?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        "flex w-62 shrink-0 flex-col gap-0.5 overflow-y-auto rounded-xl border bg-background px-2 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 px-2 pt-0.5 pb-2">
        <span className="flex-1 truncate text-heading-3 text-foreground">
          {placeholder.organization.name}
        </span>
        <Button variant="ghost" size="icon-sm" aria-label="View options">
          <SlidersIcon />
        </Button>
        {onCollapse ? (
          <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar" onClick={onCollapse}>
            <SidebarIcon />
          </Button>
        ) : null}
      </div>
      <Button variant="outline" className="mb-1.5 w-full">
        <PlusIcon data-icon="inline-start" />
        New source
      </Button>
      {nav.map((group) => (
        <div key={group.section ?? "main"} className="flex flex-col gap-0.5">
          {group.section ? (
            <div className="flex items-center gap-1 px-2 pt-3.5 pb-1 text-13 font-medium text-fg-tertiary">
              <span className="flex-1">{group.section}</span>
              <ChevronDownIcon size={14} className="text-icon-secondary" />
            </div>
          ) : null}
          {group.items.map((item) => (
            <NavItem key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
      <div className="mt-auto flex flex-col gap-1 rounded-lg border bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-50 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-foreground">
            Self-hosted · {placeholder.instance.version}
          </span>
        </div>
        <span className="text-xs text-fg-tertiary">
          {placeholder.instance.host} · 1 worker · idle
        </span>
      </div>
    </nav>
  );
}
