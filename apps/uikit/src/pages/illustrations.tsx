import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@usepreface/ui/components/empty";
import { Input } from "@usepreface/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { SearchIcon } from "@usepreface/ui/icons";
import { illustrations } from "@usepreface/ui/illustrations/registry";
import { CodeSnippet } from "@usepreface/ui/preface/code-snippet";

import { AssetCard } from "../components/asset";
import { Page, Section, Toolbar } from "../components/bench";
import { kebab } from "../lib/assets";

type Mode = "auto" | "light" | "dark";

const componentName = (Art: (typeof illustrations)[number]) =>
  (Art as { displayName?: string }).displayName ?? "Illustration";

export function IllustrationsPage() {
  const [mode, setMode] = React.useState<Mode>("auto");
  const [view, setView] = React.useState<"art" | "empty">("art");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const items = illustrations.filter(
    (Art) =>
      !q || `${Art.illustrationName} ${Art.title} ${Art.description}`.toLowerCase().includes(q),
  );
  const Featured = illustrations[0];
  return (
    <Page
      figma="11 Illustrations"
      title="Illustrations"
      description={`${illustrations.length} empty-state illustrations: isometric objects on three stacked plates, with status badges and company chips drawn in. Light and dark artwork switch with the theme.`}
    >
      {Featured ? (
        <Section
          title="In an empty state"
          description="Each illustration carries the suggested title, description and action from Figma."
        >
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
            <div className="rounded-xl border bg-card">
              <Empty className="py-14">
                <EmptyHeader>
                  <EmptyMedia>
                    <Featured />
                  </EmptyMedia>
                  <EmptyTitle className="text-heading-3">{Featured.title}</EmptyTitle>
                  <EmptyDescription>{Featured.description}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button>{Featured.action ?? "Get started"}</Button>
                </EmptyContent>
              </Empty>
            </div>
            <CodeSnippet
              className="min-w-0"
              samples={[{ label: "empty-sources.tsx", language: "tsx", code: snippet }]}
            />
          </div>
        </Section>
      ) : null}
      <div className="flex flex-col gap-8">
        <Toolbar>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search illustrations…"
              className="pl-8"
            />
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList>
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="dark">Dark</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={view} onValueChange={(v) => setView(v as "art" | "empty")}>
            <TabsList>
              <TabsTrigger value="art">Artwork</TabsTrigger>
              <TabsTrigger value="empty">With copy</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="ml-auto font-mono text-xs text-fg-tertiary">
            {items.length} / {illustrations.length}
          </span>
        </Toolbar>
        <Section title="Gallery" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((Art) => {
            const name = componentName(Art);
            return (
              <AssetCard
                key={Art.illustrationName}
                name={Art.illustrationName}
                caption={`<${name} />`}
                fileName={`${kebab(Art.illustrationName)}${mode === "auto" ? "" : `-${mode}`}`}
                code={`<${name}${mode === "auto" ? "" : ` mode="${mode}"`} />`}
                stageClassName={
                  mode === "dark"
                    ? "dark min-h-60 bg-[#0D0F12]"
                    : mode === "light"
                      ? "light min-h-60 bg-white"
                      : "min-h-60 bg-[radial-gradient(circle_at_50%_40%,var(--bg-surface-2),transparent_70%)]"
                }
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="transition-transform duration-500 ease-out group-hover/asset:-translate-y-1 group-hover/asset:scale-[1.03]">
                    <Art mode={mode} width={view === "empty" ? 180 : undefined} />
                  </span>
                  {view === "empty" ? (
                    <div className="flex max-w-64 flex-col gap-1">
                      <span className="text-heading-4 text-fg">{Art.title}</span>
                      <span className="text-13 text-fg-secondary">{Art.description}</span>
                    </div>
                  ) : null}
                </div>
              </AssetCard>
            );
          })}
        </Section>
      </div>
    </Page>
  );
}

const snippet = `import { Button } from "@usepreface/ui/components/button"
import { Empty, EmptyContent, EmptyDescription,
  EmptyHeader, EmptyMedia, EmptyTitle } from "@usepreface/ui/components/empty"
import { NoSourcesIllustration } from "@usepreface/ui/illustrations"

export function NoSources() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia>
          <NoSourcesIllustration />
        </EmptyMedia>
        <EmptyTitle>{NoSourcesIllustration.title}</EmptyTitle>
        <EmptyDescription>
          {NoSourcesIllustration.description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Connect source</Button>
      </EmptyContent>
    </Empty>
  )
}`;
