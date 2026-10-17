import * as React from "react";

import {
  AssistantMessage,
  FeedbackBar,
  ThinkingIndicator,
  UserMessage,
} from "@usepreface/ui/ai/chat";
import {
  CitationChip,
  CitationList,
  InlineCitation,
  type CitationSource,
} from "@usepreface/ui/ai/citation";
import {
  Composer,
  ComposerActions,
  ComposerAttach,
  ComposerHint,
  ComposerInput,
  ComposerScope,
  ComposerSubmit,
} from "@usepreface/ui/ai/composer";
import { RetrievalTrace } from "@usepreface/ui/ai/sources";
import { PrefaceMark } from "@usepreface/ui/brand";
import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Kbd } from "@usepreface/ui/components/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import { Separator } from "@usepreface/ui/components/separator";
import {
  AiChatIcon,
  ApiIcon,
  BotIcon,
  BrainIcon,
  ChatIcon,
  ChevronDownIcon,
  DatabaseIcon,
  FileIcon,
  HelpIcon,
  HomeIcon,
  InboxIcon,
  KeyIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  SidebarIcon,
  SlidersIcon,
  AnalyticsIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { CodeSnippet } from "@usepreface/ui/preface/code-snippet";
import { PageHeader, TopBar } from "@usepreface/ui/preface/layout";

/*
 * Recreates Figma page 31 "Desktop / Ask": canvas top bar, floating sidebar, panel with
 * the thread on the left and the retrieval trace on the right.
 */

const nav: { section?: string; items: [string, IconComponent, number?][] }[] = [
  {
    items: [
      ["Home", HomeIcon],
      ["Ask", AiChatIcon],
      ["Inbox", InboxIcon, 3],
    ],
  },
  {
    section: "Knowledge",
    items: [
      ["Sources", DatabaseIcon, 12],
      ["Collections", LayersIcon],
      ["Documents", FileIcon],
      ["Search quality", AnalyticsIcon],
    ],
  },
  {
    section: "Channels",
    items: [
      ["Chat widgets", ChatIcon],
      ["Bots", BotIcon],
      ["API & MCP", ApiIcon],
    ],
  },
  {
    section: "Admin",
    items: [
      ["Teams & members", UsersIcon],
      ["Access & SSO", ShieldIcon],
      ["AI providers", BrainIcon],
      ["API keys", KeyIcon],
      ["Settings", SettingsIcon],
    ],
  },
];

const citations: CitationSource[] = [
  {
    index: 1,
    title: "Rotating staging credentials",
    source: "notion",
    path: "Notion · Engineering / Runbooks",
    score: 0.92,
    href: "https://notion.so",
    snippet: "Run ops db rotate --env staging --restart api.",
  },
  {
    index: 2,
    title: "deploy.yml",
    source: "github",
    path: "GitHub · acme/platform / .github",
    score: 0.81,
    href: "https://github.com",
    snippet: "The pipeline pins DATABASE_URL until the run completes.",
  },
  {
    index: 3,
    title: "#infra · Mar 12",
    source: "slack",
    path: "Slack · thread, 14 replies",
    score: 0.64,
    href: "https://slack.com",
    snippet: "Wait for in-flight deploys before rotating.",
  },
];

const modelRows: { label: string; options: string[] }[] = [
  { label: "Provider", options: ["OpenAI", "Anthropic", "Ollama"] },
  { label: "Model", options: ["gpt-4.1", "gpt-4.1-mini"] },
  { label: "Embeddings", options: ["text-embedding-3-large", "text-embedding-3-small"] },
];

function NavItem({
  label,
  icon: Icon,
  count,
  active,
}: {
  label: string;
  icon: IconComponent;
  count?: number;
  active?: boolean;
}) {
  return (
    <a
      href={`#${label}`}
      data-active={active || undefined}
      className={cn(
        "flex h-8 items-center gap-2 rounded-sm px-2 text-sm text-fg-secondary outline-none transition-colors",
        "hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring",
        "data-active:bg-selected data-active:font-medium data-active:text-foreground",
      )}
    >
      <Icon className={active ? "text-icon" : "text-icon-secondary"} />
      <span className="flex-1 truncate">{label}</span>
      {count ? <Counter>{count}</Counter> : null}
    </a>
  );
}

function AppSidebar() {
  return (
    <aside className="flex w-62 shrink-0 flex-col gap-0.5 overflow-y-auto rounded-xl border bg-background px-2 py-3">
      <div className="flex items-center gap-1.5 px-2 pt-0.5 pb-2">
        <span className="flex-1 text-heading-3">Knowledge</span>
        <Button variant="ghost" size="icon-sm" aria-label="View options">
          <SlidersIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar">
          <SidebarIcon />
        </Button>
      </div>
      <Button variant="outline" className="mb-1.5 w-full">
        <PlusIcon data-icon="inline-start" />
        New source
      </Button>
      {nav.map((group, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {group.section ? (
            <div className="flex items-center gap-1 px-2 pt-3.5 pb-1 text-13 font-medium text-fg-tertiary">
              <span className="flex-1">{group.section}</span>
              <ChevronDownIcon size={14} className="text-icon-secondary" />
            </div>
          ) : null}
          {group.items.map(([label, icon, count]) => (
            <NavItem key={label} label={label} icon={icon} count={count} active={label === "Ask"} />
          ))}
        </div>
      ))}
      <div className="mt-auto flex flex-col gap-1 rounded-lg border bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success" />
          <span className="text-xs font-medium">Self-hosted · v1.4.0</span>
        </div>
        <span className="text-xs text-fg-tertiary">eu-west-1 · 3 workers · all healthy</span>
      </div>
    </aside>
  );
}

export function DashboardPage() {
  const [scope, setScope] = React.useState("all");
  return (
    <div className="flex h-[calc(100svh-3.25rem)] min-h-[720px] flex-col bg-canvas">
      <TopBar>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-hover"
        >
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-brand-slate">
            <PrefaceMark tone="ice" size={16} title="" />
          </span>
          <span className="text-sm font-medium">Acme Inc.</span>
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
          <AvatarFallback className="bg-brand-slate text-white">VC</AvatarFallback>
        </Avatar>
      </TopBar>
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          <PageHeader
            icon={<AiChatIcon />}
            title="Ask"
            actions={
              <>
                <Button variant="outline">
                  <LayersIcon data-icon="inline-start" />
                  All collections
                </Button>
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  New chat
                </Button>
              </>
            }
          />
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-10 py-8">
                <div className="flex w-full max-w-140 flex-col gap-7">
                  <UserMessage>How do I rotate the staging database credentials?</UserMessage>
                  <AssistantMessage meta="3 sources · 1.4s">
                    <p>
                      Staging credentials live in Vault under <code>secret/staging/db</code>. Rotate
                      them with the ops CLI, then restart the API pods so they pick up the new
                      secret
                      <InlineCitation citation={citations[0]} />.
                    </p>
                    <CodeSnippet
                      samples={[
                        {
                          label: "Terminal",
                          language: "bash",
                          code: "ops db rotate --env staging --restart api",
                        },
                      ]}
                    />
                    <p>
                      Rotation takes about two minutes. If a deploy is running, wait for it to
                      finish - the pipeline pins the old secret until it completes
                      <InlineCitation citation={citations[1]} />.
                    </p>
                    <CitationList>
                      {citations.map((c) => (
                        <CitationChip key={c.index} citation={c} />
                      ))}
                    </CitationList>
                    <FeedbackBar
                      text="Staging credentials live in Vault…"
                      onRetry={() => undefined}
                    />
                  </AssistantMessage>
                  <UserMessage>And for production?</UserMessage>
                  <ThinkingIndicator stage="reading">
                    Reading Runbooks / Production…
                  </ThinkingIndicator>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 px-10 pb-5">
                <Composer className="max-w-140">
                  <ComposerInput placeholder="Ask anything about Acme…" />
                  <ComposerActions>
                    <ComposerAttach />
                    <ComposerScope
                      value={scope}
                      onValueChange={setScope}
                      options={[
                        { value: "all", label: "All collections" },
                        { value: "eng", label: "Engineering" },
                      ]}
                    />
                    <ComposerHint />
                    <ComposerSubmit />
                  </ComposerActions>
                </Composer>
                <span className="text-xs text-fg-tertiary">
                  Preface can be wrong. Answers link to their sources - check them.
                </span>
              </div>
            </div>
            <aside className="hidden w-95 shrink-0 flex-col gap-5 overflow-y-auto border-l bg-surface-2 p-5 xl:flex">
              <div className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">Retrieval trace</span>
                  <span className="text-xs text-fg-tertiary">
                    Hybrid (BM25 + vector) · reranked · 12 → 3
                  </span>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Hide panel">
                  <SidebarIcon />
                </Button>
              </div>
              <RetrievalTrace
                chunks={citations.map((c) => ({
                  title: c.title,
                  source: c.source ?? "notion",
                  path: c.path,
                  score: c.score ?? 0,
                  href: c.href,
                }))}
              />
              <Separator />
              <span className="text-overline text-fg-tertiary">Model</span>
              <div className="flex flex-col gap-2.5">
                {modelRows.map(({ label, options }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-24 text-13 text-fg-secondary">{label}</span>
                    <Select defaultValue={options[0]}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
