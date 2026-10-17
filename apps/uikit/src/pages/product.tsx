import * as React from "react";

import { Avatar, AvatarFallback } from "@usepreface/ui/components/avatar";
import { Badge, BadgeDot, Counter } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@usepreface/ui/components/empty";
import { Kbd } from "@usepreface/ui/components/kbd";
import { Switch } from "@usepreface/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import {
  ChatIcon,
  DatabaseIcon,
  McpIcon,
  PlugIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
} from "@usepreface/ui/icons";
import { SlackLogo } from "@usepreface/ui/logos";
import {
  ChannelCard,
  ConnectorTile,
  OnboardingChecklist,
  SettingRow,
  SettingsCard,
  SourceCard,
} from "@usepreface/ui/preface/cards";
import {
  HttpMethod,
  InlineCode,
  LogoTile,
  StatCard,
  SyncStatus,
} from "@usepreface/ui/preface/data-display";
import {
  ApiKeyField,
  EndpointRow,
  EnvVarRow,
  InstallCommand,
  LogLine,
} from "@usepreface/ui/preface/developer";
import { PageHeader } from "@usepreface/ui/preface/layout";

import { Page, Section, Specimen } from "../components/bench";

const tones = ["neutral", "info", "success", "warning", "danger", "violet", "teal"] as const;
const toneLabel = {
  neutral: "Draft",
  info: "Indexing",
  success: "Synced",
  warning: "Stale",
  danger: "Failed",
  violet: "Beta",
  teal: "MCP",
};

export function ProductPage() {
  const [channels, setChannels] = React.useState({ widget: true, slack: true, mcp: false });
  return (
    <Page
      figma="16-29 Components"
      title="Product components"
      description="Preface-specific pieces built on the Base UI primitives: status, data display, cards, settings and developer surfaces."
    >
      <Section
        title="Buttons"
        description="Primary, Secondary, Outline, Ghost, Danger and Danger outline at S 28 · M 32 · L 40."
        className="flex flex-col gap-4 rounded-xl border bg-card p-6"
      >
        {(["sm", "default", "lg"] as const).map((size) => (
          <div key={size} className="flex flex-wrap items-center gap-2">
            <Button size={size}>
              <PlusIcon data-icon="inline-start" />
              New source
            </Button>
            <Button size={size} variant="secondary">
              Secondary
            </Button>
            <Button size={size} variant="outline">
              Outline
            </Button>
            <Button size={size} variant="ghost">
              Ghost
            </Button>
            <Button size={size} variant="destructive">
              Delete
            </Button>
            <Button size={size} variant="destructive-outline">
              <TrashIcon data-icon="inline-start" />
              Delete organisation
            </Button>
            <Button size={size} disabled>
              Disabled
            </Button>
          </div>
        ))}
      </Section>

      <Section
        title="Badges"
        description="Subtle, outline and solid across seven tones. Outline + dot is the Plane label chip."
        className="flex flex-col gap-3 rounded-xl border bg-card p-6"
      >
        {(["subtle", "outline", "solid"] as const).map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-overline text-fg-tertiary">{variant}</span>
            {tones.map((tone) => (
              <Badge key={tone} variant={variant} tone={tone}>
                {variant === "outline" ? <BadgeDot tone={tone} /> : null}
                {toneLabel[tone]}
              </Badge>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-overline text-fg-tertiary">counter</span>
          <Counter>12</Counter>
          <Counter tone="accent">3</Counter>
          <Counter tone="danger">1</Counter>
          <span className="w-6" />
          {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
            <HttpMethod key={m} method={m} />
          ))}
          <span className="w-6" />
          <InlineCode>secret/staging/db</InlineCode>
          <Kbd>⌘K</Kbd>
        </div>
      </Section>

      <Section title="Sync status" className="flex flex-wrap gap-2 rounded-xl border bg-card p-6">
        <SyncStatus state="synced">Synced 4m ago</SyncStatus>
        <SyncStatus state="syncing">Syncing · 62%</SyncStatus>
        <SyncStatus state="queued" />
        <SyncStatus state="paused" />
        <SyncStatus state="failed">Failed · token expired</SyncStatus>
      </Section>

      <Section
        title="Avatars"
        className="flex flex-wrap items-end gap-4 rounded-xl border bg-card p-6"
      >
        {(["xs", "sm", "default", "lg", "xl"] as const).map((size) => (
          <Avatar key={size} size={size}>
            <AvatarFallback className="bg-brand-slate text-white">VC</AvatarFallback>
          </Avatar>
        ))}
        {(["sm", "default", "lg", "xl"] as const).map((size) => (
          <Avatar key={`org-${size}`} size={size} shape="square">
            <AvatarFallback className="bg-primary text-primary-foreground">AC</AvatarFallback>
          </Avatar>
        ))}
      </Section>

      <Section title="Tabs" className="grid gap-4 md:grid-cols-2">
        <Specimen label="Segmented">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
        </Specimen>
        <Specimen label="Line (page header)">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">
                <DatabaseIcon />
                Documents
                <Counter>2,481</Counter>
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-2 text-fg-secondary">
              Overview panel
            </TabsContent>
            <TabsContent value="documents" className="pt-2 text-fg-secondary">
              Documents panel
            </TabsContent>
            <TabsContent value="settings" className="pt-2 text-fg-secondary">
              Settings panel
            </TabsContent>
          </Tabs>
        </Specimen>
      </Section>

      <Section title="Stat cards" className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Answers this week"
          value="12,480"
          delta="+18.2%"
          trend="up"
          hint="Answers served across all channels."
          series={[4, 6, 5, 8, 7, 9, 11, 10, 13, 14, 16]}
        />
        <StatCard
          label="Median latency"
          value="1.4s"
          delta="−12%"
          trend="down"
          invert
          series={[9, 8, 9, 7, 7, 6, 6, 5, 5, 4, 4]}
        />
        <StatCard
          label="Answer rate"
          value="94.1%"
          delta="±0.2"
          series={[9, 9.4, 8.8, 9.2, 9.6, 9.1, 9.3, 8.9, 9.4, 9.2, 9.5]}
        />
      </Section>

      <Section title="Source cards" className="grid gap-4 md:grid-cols-3">
        <SourceCard
          brand="github"
          name="acme/platform"
          kind="GitHub · repository"
          state="synced"
          status="Synced 4m ago"
          metrics={[
            { label: "Documents", value: "2,481" },
            { label: "Chunks", value: "12.4k" },
            { label: "Answers cited", value: "3,902" },
          ]}
        />
        <SourceCard
          brand="notion"
          name="Product wiki"
          kind="Notion · workspace"
          state="syncing"
          status="Syncing · 62%"
          progress={62}
          metrics={[
            { label: "Documents", value: "1,108" },
            { label: "Chunks", value: "6.2k" },
            { label: "Answers cited", value: "1,240" },
          ]}
        />
        <SourceCard
          brand="slack"
          name="#eng-help"
          kind="Slack · channel"
          state="failed"
          status="Failed · token expired"
          metrics={[
            { label: "Messages", value: "7,812" },
            { label: "Threads", value: "2.1k" },
            { label: "Answers cited", value: "902" },
          ]}
          actions={
            <>
              <Button size="sm">Reconnect</Button>
              <Button size="sm" variant="ghost">
                View logs
              </Button>
            </>
          }
        />
      </Section>

      <Section title="Channel cards" className="grid gap-4 md:grid-cols-3">
        <ChannelCard
          media={
            <LogoTile className="bg-primary text-primary-foreground border-transparent">
              <ChatIcon size={20} />
            </LogoTile>
          }
          name="docs.acme.dev widget"
          description="Chat widget · 3 domains"
          enabled={channels.widget}
          onEnabledChange={(v) => setChannels((c) => ({ ...c, widget: v }))}
          series={[3, 5, 4, 6, 8, 7, 9, 12, 10, 13, 15]}
          footer="1,284 answers · 7d"
          href="#widget"
        />
        <ChannelCard
          media={
            <LogoTile>
              <SlackLogo size={20} />
            </LogoTile>
          }
          name="#support bot"
          description="Slack bot · Acme workspace"
          enabled={channels.slack}
          onEnabledChange={(v) => setChannels((c) => ({ ...c, slack: v }))}
          series={[2, 4, 3, 5, 6, 6, 8, 7, 9, 10, 11]}
          footer="842 answers · 7d"
          href="#slack"
        />
        <ChannelCard
          media={
            <LogoTile className="bg-brand-slate text-white border-transparent">
              <McpIcon size={20} />
            </LogoTile>
          }
          name="Public MCP server"
          description="mcp.acme.dev · 4 tools"
          enabled={channels.mcp}
          onEnabledChange={(v) => setChannels((c) => ({ ...c, mcp: v }))}
          series={[2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0]}
          href="#mcp"
        />
      </Section>

      <Section title="Connectors" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ConnectorTile
          brand="github"
          name="GitHub"
          description="Code, pull requests, issues and discussions."
          connected
        />
        <ConnectorTile
          brand="notion"
          name="Notion"
          description="Pages and databases, permissions included."
        />
        <ConnectorTile
          brand="google-drive"
          name="Google Drive"
          description="Docs, Sheets, Slides and PDFs."
        />
        <ConnectorTile
          brand="confluence"
          name="Confluence"
          description="Spaces and pages from Cloud or Data Center."
        />
      </Section>

      <Section title="Settings" className="flex flex-col gap-4">
        <SettingsCard
          title="Single sign-on"
          description="Require SAML or OIDC for every member. Enterprise plan."
          action={
            <Button variant="outline">
              <ShieldIcon data-icon="inline-start" />
              Configure SSO
            </Button>
          }
        />
        <SettingsCard title="Answering">
          <div>
            <SettingRow
              title="Cite sources"
              description="Every answer links the passages it used."
              control={<Switch defaultChecked />}
            />
            <SettingRow
              title="Answer from Slack DMs"
              description="Off by default. Private messages are never indexed."
              control={<Switch />}
            />
            <SettingRow
              title="Escalate low-confidence answers"
              description="Hand off to #support below 0.4 confidence."
              control={<Switch defaultChecked size="sm" />}
            />
          </div>
        </SettingsCard>
        <SettingsCard
          danger
          title="Delete organisation"
          description="All sources, embeddings, channels and API keys are removed permanently."
          action={<Button variant="destructive-outline">Delete organisation</Button>}
        />
      </Section>

      <Section title="Onboarding & empty state" className="grid gap-4 md:grid-cols-2">
        <OnboardingChecklist
          steps={[
            { title: "Connect a source", description: "GitHub · acme/platform", done: true },
            { title: "Choose an AI provider", description: "OpenAI · gpt-4.1", done: true },
            { title: "Ask your first question", description: "Try the playground" },
            { title: "Add a channel", description: "Widget, Slack bot or API key" },
          ]}
        />
        <Empty className="rounded-xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlugIcon />
            </EmptyMedia>
            <EmptyTitle>Connect your first source</EmptyTitle>
            <EmptyDescription>
              Preface indexes GitHub, Slack, Notion, websites and files. Pick one to start - you can
              add more any time.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button>
              <PlusIcon data-icon="inline-start" />
              Connect source
            </Button>
            <Button variant="outline">Documentation</Button>
          </EmptyContent>
        </Empty>
      </Section>

      <Section
        title="Developer"
        description="Install command, API key, endpoints, environment and logs."
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <InstallCommand command="docker compose up -d" />
          <InstallCommand size="lg" command="npx @usepreface/cli init" />
        </div>
        <ApiKeyField value="pf_live_8Kq2vT7mXw4Rb9LcN1sHd3f9a" className="max-w-lg" />
        <div className="overflow-hidden rounded-xl border">
          <EndpointRow
            method="GET"
            path="/v1/sources"
            description="List connected sources"
            href="#get"
          />
          <EndpointRow
            method="POST"
            path="/v1/answers"
            description="Ask a question, get a cited answer"
            href="#post"
          />
          <EndpointRow
            method="DELETE"
            path="/v1/keys/{id}"
            description="Revoke an API key"
            href="#delete"
          />
        </div>
        <div className="overflow-hidden rounded-xl border">
          <EnvVarRow name="OPENAI_API_KEY" value="sk-..." secret />
          <EnvVarRow name="PREFACE_EMBED_MODEL" value="text-embedding-3-large" />
        </div>
        <div className="overflow-hidden rounded-xl border bg-background py-1">
          <LogLine time="14:02:11.384" source="github/acme-platform">
            Indexed 214 files (1,902 chunks) in 41.2s
          </LogLine>
          <LogLine time="14:02:13.020" level="warn" source="github/acme-platform">
            Rate limited by GitHub API - retrying in 30s
          </LogLine>
          <LogLine time="14:03:02.551" level="error" source="notion/product-wiki">
            Notion token expired - sync paused
          </LogLine>
        </div>
      </Section>

      <Section title="Page header" className="overflow-hidden rounded-xl border">
        <PageHeader
          icon={<DatabaseIcon />}
          title="Sources"
          actions={
            <>
              <Button variant="outline" size="sm">
                Filters
              </Button>
              <Button size="sm">
                <PlusIcon data-icon="inline-start" />
                New source
              </Button>
            </>
          }
        />
      </Section>
    </Page>
  );
}
