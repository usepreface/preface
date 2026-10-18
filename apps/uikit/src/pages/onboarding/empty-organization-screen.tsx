import * as React from "react";

import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Input } from "@usepreface/ui/components/input";
import { Kbd } from "@usepreface/ui/components/kbd";
import { Progress } from "@usepreface/ui/components/progress";
import {
  AiChatIcon,
  ChevronDownIcon,
  DatabaseIcon,
  HelpIcon,
  HomeIcon,
  InboxIcon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import {
  NoAIProviderIllustration,
  NoConnectorsIllustration,
  NoConversationsIllustration,
} from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";
import { PageHeader, TopBar } from "@usepreface/ui/preface/layout";

import { AppSidebar } from "../dashboard";
import type { Owner } from "./instance-screen";
import { DEMO_HOST } from "./layout";

export function EmptyOrgScreen({
  owner,
  org,
}: {
  owner: Owner;
  org: { name: string; slug: string };
}) {
  const first = owner.name.split(/\s+/)[0] ?? owner.name;
  const initials = owner.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const steps: [
    string,
    React.ComponentType<{ className?: string }>,
    string,
    string,
    IconComponent | null,
    boolean,
  ][] = [
    [
      "Connect a source",
      NoConnectorsIllustration,
      "GitHub, Slack, Notion, Drive, websites or files. Preface indexes and keeps them fresh.",
      "Connect source",
      PlusIcon,
      true,
    ],
    [
      "Choose an AI provider",
      NoAIProviderIllustration,
      "Use OpenAI, Anthropic, Azure or Bedrock, or a local model through Ollama.",
      "Add provider",
      null,
      false,
    ],
    [
      "Ask your first question",
      NoConversationsIllustration,
      "Try the playground once a source has synced. Every answer cites where it came from.",
      "Open playground",
      AiChatIcon,
      false,
    ],
  ];
  return (
    <div className="flex min-h-[calc(100svh-6.25rem)] flex-col bg-canvas">
      <TopBar>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover"
        >
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-primary text-xs font-semibold text-primary-foreground">
            {org.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{org.name}</span>
          <ChevronDownIcon size={14} className="text-icon-secondary" />
        </button>
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            className="flex h-8 w-full max-w-120 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-fg-tertiary hover:border-border-default"
          >
            <SearchIcon className="text-icon-secondary" />
            <span className="flex-1 text-left">Search or ask anything</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>
        <Button variant="ghost" size="icon" aria-label="Inbox">
          <InboxIcon />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpIcon />
        </Button>
        <Avatar size="sm">
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
      </TopBar>
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <AppSidebar
          active="Home"
          title={org.name}
          counts={false}
          status={`${DEMO_HOST.slice(0, -1)} · 1 worker · idle`}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          <PageHeader
            icon={<HomeIcon />}
            title="Home"
            actions={
              <Button>
                <UsersIcon data-icon="inline-start" />
                Invite members
              </Button>
            }
          />
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-7">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h1 className="text-heading-2">
                  Welcome to {org.name}, {first}
                </h1>
                <p className="text-sm text-fg-secondary">
                  Your organization is ready. Three steps to the first cited answer.
                </p>
              </div>
              <div className="flex w-55 flex-col gap-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-fg-secondary">Setup</span>
                  <span className="text-fg-tertiary">0 of 3</span>
                </div>
                <Progress value={0} aria-label="Setup progress" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([title, Art, text, cta, Icon, primary], i) => (
                <div
                  key={title}
                  className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1"
                >
                  <div className="flex h-37.5 items-center justify-center border-b border-border-subtle bg-surface-2">
                    <Art className="h-30 w-auto" />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-2 p-4.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface-3 text-fg-secondary",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm font-semibold">{title}</span>
                    </div>
                    <p className="flex-1 text-13 text-fg-secondary">{text}</p>
                    <Button variant={primary ? "default" : "outline"} className="mt-1">
                      {Icon ? <Icon data-icon="inline-start" /> : null}
                      {cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_380px]">
              <div className="flex min-h-48 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
                <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
                  <span className="flex-1 text-sm font-semibold">Sources</span>
                  <Badge>0</Badge>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center">
                  <DatabaseIcon className="size-5 text-icon-secondary" />
                  <span className="text-sm font-medium">No sources yet</span>
                  <span className="text-xs text-fg-tertiary">
                    Connected sources and their sync status will show up here.
                  </span>
                </div>
              </div>
              <InviteCard owner={owner} initials={initials} orgSlug={org.slug} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InviteCard({
  owner,
  initials,
  orgSlug,
}: {
  owner: Owner;
  initials: string;
  orgSlug: string;
}) {
  const domain = owner.email.split("@")[1] ?? "acme.dev";
  const [email, setEmail] = React.useState("");
  const [invited, setInvited] = React.useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-semibold">Invite your team</span>
        <span className="text-xs text-fg-tertiary">
          {1 + invited.length} {invited.length ? "members" : "member"}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{owner.name}</span>
          <span className="truncate text-xs text-fg-tertiary">{owner.email}</span>
        </span>
        <Badge tone="info">Owner</Badge>
      </div>
      {invited.map((m) => (
        <div key={m} className="flex items-center gap-2.5">
          <Avatar>
            <AvatarFallback>{m.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm">{m}</span>
          <Badge variant="outline">Invited</Badge>
        </div>
      ))}
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !invited.includes(email)) {
            setInvited((l) => [...l, email]);
            setEmail("");
          }
        }}
      >
        <Input
          type="email"
          aria-label={`Invite to ${orgSlug}`}
          placeholder={`name@${domain}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="secondary">
          Invite
        </Button>
      </form>
    </div>
  );
}
