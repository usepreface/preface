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
import { RetrievalTrace } from "@usepreface/ui/ai/sources";
import { PrefaceMark } from "@usepreface/ui/brand";
import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import { Kbd } from "@usepreface/ui/components/kbd";
import {
  AiChatIcon,
  AnalyticsIcon,
  ApiIcon,
  BotIcon,
  ChatIcon,
  ChevronDownIcon,
  CopyIcon,
  DatabaseIcon,
  FileIcon,
  HelpIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  SidebarIcon,
  SlidersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { PageHeader, TopBar } from "@usepreface/ui/preface/layout";

/*
 * The Ask screen from Figma page 31, drawn at its 1440 px design width and scaled into the hero
 * window. It is a picture of the product: inert and hidden from assistive technology.
 */

export const PREVIEW_WIDTH = 1440;
export const PREVIEW_HEIGHT = 785;

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
];

const rotating: CitationSource = {
  index: 1,
  title: "Rotating staging credentials",
  source: "notion",
  path: "Notion · Engineering / Runbooks",
  score: 0.92,
};
const deployYml: CitationSource = {
  index: 2,
  title: "deploy.yml",
  source: "github",
  path: "GitHub · acme/platform / .github",
  score: 0.81,
};
const infraThread: CitationSource = {
  index: 3,
  title: "#infra · Mar 12",
  source: "slack",
  path: "Slack · thread, 14 replies",
  score: 0.64,
};
const citations = [rotating, deployYml, infraThread];

const modelRows = [
  ["Provider", "OpenAI"],
  ["Model", "gpt-4.1"],
  ["Embeddings", "text-embedding-3-large"],
] as const;

function Sidebar() {
  return (
    <aside className="flex w-62 shrink-0 flex-col gap-0.5 overflow-hidden rounded-xl border bg-background px-2 py-3">
      <div className="flex items-center gap-1.5 px-2 pt-0.5 pb-2">
        <span className="flex-1 text-heading-3">Knowledge</span>
        <Button variant="ghost" size="icon-sm" tabIndex={-1}>
          <SlidersIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" tabIndex={-1}>
          <SidebarIcon />
        </Button>
      </div>
      <Button variant="outline" className="mb-1.5 w-full" tabIndex={-1}>
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
          {group.items.map(([label, Icon, count]) => (
            <span
              key={label}
              className={cn(
                "flex h-8 items-center gap-2 rounded-sm px-2 text-sm text-fg-secondary",
                label === "Ask" && "bg-selected font-medium text-foreground",
              )}
            >
              <Icon className={label === "Ask" ? "text-icon" : "text-icon-secondary"} />
              <span className="flex-1 truncate">{label}</span>
              {count ? <Counter>{count}</Counter> : null}
            </span>
          ))}
        </div>
      ))}
    </aside>
  );
}

function Thread() {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center overflow-hidden px-10 py-8">
      <div className="flex w-full max-w-140 flex-col gap-7">
        <UserMessage>How do I rotate the staging database credentials?</UserMessage>
        <AssistantMessage meta="3 sources · 1.4s">
          <p>
            Staging credentials live in Vault under <code>secret/staging/db</code>. Rotate them with
            the ops CLI, then restart the API pods so they pick up the new secret
            <InlineCitation citation={rotating} />.
          </p>
          <div className="dark flex items-center gap-3 rounded-xl border bg-surface-1 px-4 py-3 font-mono text-13 text-foreground">
            <span className="flex-1">
              ops db rotate <span className="text-[#8ec0ff]">--env</span> staging{" "}
              <span className="text-[#8ec0ff]">--restart</span> api
            </span>
            <CopyIcon size={14} className="text-icon-secondary" />
          </div>
          <p>
            Rotation takes about two minutes. If a deploy is running, wait for it to finish - the
            pipeline pins the old secret until it completes
            <InlineCitation citation={deployYml} />.
          </p>
          <CitationList>
            {citations.map((c) => (
              <CitationChip key={c.index} citation={c} />
            ))}
          </CitationList>
          <FeedbackBar text="" onRetry={() => undefined} />
        </AssistantMessage>
        <UserMessage>And for production?</UserMessage>
        <ThinkingIndicator stage="reading">Reading Runbooks / Production…</ThinkingIndicator>
      </div>
    </div>
  );
}

function TracePanel() {
  return (
    <aside className="flex w-95 shrink-0 flex-col gap-5 overflow-hidden border-l bg-surface-2 p-5">
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold">Retrieval trace</span>
          <span className="text-xs text-fg-tertiary">
            Hybrid (BM25 + vector) · reranked · 12 → 3
          </span>
        </div>
        <SidebarIcon size={16} className="text-icon-secondary" />
      </div>
      <RetrievalTrace
        chunks={citations.map((c) => ({
          title: c.title,
          source: c.source ?? "notion",
          path: c.path,
          score: c.score ?? 0,
        }))}
      />
      <div className="h-px bg-border" />
      <span className="text-overline text-fg-tertiary">Model</span>
      <div className="flex flex-col gap-2.5">
        {modelRows.map(([label, value]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-24 text-13 text-fg-secondary">{label}</span>
            <span className="flex h-8 flex-1 items-center justify-between rounded-md border border-border-default bg-background px-2.5 text-13">
              {value}
              <ChevronDownIcon size={14} className="text-icon-secondary" />
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}

/** The product screenshot, live-rendered. */
export function ProductPreview({ className }: { className?: string }) {
  return (
    <div
      inert
      aria-hidden="true"
      className={cn("flex flex-col bg-canvas text-left text-foreground select-none", className)}
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
    >
      <TopBar>
        <span className="flex items-center gap-2 rounded-md px-1.5 py-1">
          <span className="flex size-6 items-center justify-center rounded-[6px] bg-brand-slate">
            <PrefaceMark tone="ice" size={16} title="" />
          </span>
          <span className="text-sm font-medium">Acme Inc.</span>
          <ChevronDownIcon size={14} className="text-icon-secondary" />
        </span>
        <div className="flex flex-1 justify-center">
          <span className="flex h-8 w-full max-w-120 items-center gap-2 rounded-md border bg-background px-2.5 text-sm text-fg-tertiary">
            <SearchIcon className="text-icon-secondary" />
            <span className="flex-1 text-left">Search or ask anything</span>
            <Kbd>⌘K</Kbd>
          </span>
        </div>
        <InboxIcon size={18} className="mx-1.5 text-icon-secondary" />
        <HelpIcon size={18} className="mx-1.5 text-icon-secondary" />
        <Avatar size="sm">
          <AvatarFallback className="bg-brand-slate text-white">VC</AvatarFallback>
        </Avatar>
      </TopBar>
      <div className="flex min-h-0 flex-1 gap-2 px-2 pb-2">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background">
          <PageHeader
            title="Ask"
            breadcrumb={
              <span className="flex items-center gap-2 text-sm font-medium text-foreground [&_svg]:text-icon-secondary">
                <AiChatIcon />
                Ask
              </span>
            }
            actions={
              <>
                <Button variant="outline" tabIndex={-1}>
                  <LayersIcon data-icon="inline-start" />
                  All collections
                </Button>
                <Button tabIndex={-1}>
                  <PlusIcon data-icon="inline-start" />
                  New chat
                </Button>
              </>
            }
          />
          <div className="flex min-h-0 flex-1">
            <Thread />
            <TracePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scales the 1440 px preview to the width of its box. The CSS variable has a per-breakpoint
 * starting value, so the prerendered page is already close before the observer measures it.
 */
export function ScaledPreview({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    // Phones show a fixed-scale crop of the left of the screen, as in the mobile design.
    const phone = window.matchMedia("(max-width: 639px)");
    const observer = new ResizeObserver(([entry]) => {
      if (phone.matches) {
        el.style.removeProperty("--preview-scale");
      } else if (entry) {
        el.style.setProperty("--preview-scale", String(entry.contentRect.width / PREVIEW_WIDTH));
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden max-sm:h-75 sm:aspect-[1440/785] [--preview-scale:0.46] sm:[--preview-scale:0.45] md:[--preview-scale:0.55] lg:[--preview-scale:0.7] xl:[--preview-scale:0.764]",
        className,
      )}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: "scale(var(--preview-scale))" }}
      >
        <ProductPreview />
      </div>
    </div>
  );
}
