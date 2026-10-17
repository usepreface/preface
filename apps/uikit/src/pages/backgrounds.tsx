import * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Button } from "@usepreface/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@usepreface/ui/components/dialog";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { ArrowRightIcon, CodeIcon, ExternalLinkIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import {
  Background,
  backgroundGroups,
  backgrounds,
  Beams,
  CharacterField,
  DotGrid,
  FacetTessellation,
  Grain,
  Halftone,
  LineGrid,
  PerspectiveGrid,
  Rings,
  Scanlines,
  Starfield,
  Topography,
  Waves,
  type BackgroundPreset,
} from "@usepreface/ui/patterns";

import { CopyButton } from "../components/asset";
import { Page, Section, Toolbar } from "../components/bench";
import { copyText } from "../lib/assets";

type Group = (typeof backgroundGroups)[number][0] | "All";

const primitives: [name: string, code: string, node: React.ReactNode, bg: string][] = [
  ["DotGrid", "<DotGrid gap={28} />", <DotGrid key="d" />, "#0B0E14"],
  [
    "LineGrid",
    '<LineGrid color="#8EC0FF" />',
    <LineGrid key="l" color="#8EC0FF" opacity={0.18} />,
    "#0B0E14",
  ],
  ["Scanlines", "<Scanlines gap={4} />", <Scanlines key="s" gap={4} opacity={0.12} />, "#0B0E14"],
  ["PerspectiveGrid", "<PerspectiveGrid />", <PerspectiveGrid key="p" fit="none" />, "#050814"],
  ["Topography", "<Topography seed={7} />", <Topography key="t" />, "#0B0F1C"],
  ["Waves", "<Waves />", <Waves key="w" color="#8EC0FF" fit="none" />, "#0B0E14"],
  ["Rings", "<Rings />", <Rings key="r" />, "#090C14"],
  ["Starfield", "<Starfield count={700} />", <Starfield key="st" />, "#03050C"],
  [
    "FacetTessellation",
    "<FacetTessellation size={80} />",
    <FacetTessellation key="f" />,
    "#0D1017",
  ],
  ["Halftone", "<Halftone step={14} />", <Halftone key="h" fit="none" />, "#0A0F1F"],
  ["CharacterField", "<CharacterField />", <CharacterField key="c" />, "#0A0B0D"],
  ["Beams", "<Beams />", <Beams key="b" />, "#05070D"],
  ["Grain", "<Grain opacity={0.2} />", <Grain key="g" opacity={0.5} blend="normal" />, "#1747C9"],
];

function Hero({ preset }: { preset: BackgroundPreset }) {
  const meta = backgrounds.find((b) => b.id === preset);
  return (
    <Background
      preset={preset}
      className="flex aspect-[16/7] min-h-72 w-full flex-col justify-between rounded-2xl p-8 md:p-12"
    >
      <PrefaceLogo
        size={20}
        tone={meta?.dark ? "ice" : "deep"}
        className={meta?.dark ? "[&_[data-slot=preface-wordmark]]:text-white" : ""}
      />
      <div className="flex max-w-xl flex-col gap-4">
        <h3 className="text-display-lg text-balance">Answers with receipts.</h3>
        <p
          className={cn(
            "max-w-md text-body-lg",
            meta?.dark ? "text-white/70" : "text-[#0F1A33]/70",
          )}
        >
          Ask your company anything. Every answer cites the doc, thread or page it came from.
        </p>
        <div className="flex gap-2">
          <Button
            size="lg"
            className={meta?.dark ? "bg-white text-[#0F1A33] hover:bg-white/90" : ""}
          >
            Get started
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </Background>
  );
}

export function BackgroundsPage() {
  const [group, setGroup] = React.useState<Group>("All");
  const [hero, setHero] = React.useState<BackgroundPreset>("sky-day");
  const [open, setOpen] = React.useState<BackgroundPreset | null>(null);
  const items = backgrounds.filter((b) => group === "All" || b.group === group);
  const openMeta = backgrounds.find((b) => b.id === open);
  return (
    <Page
      figma="09 Textures · 45 Backgrounds"
      title="Backgrounds & patterns"
      description={`${backgrounds.length} backgrounds for covers, social, slides, landing sections and OG images, plus the pattern primitives they are built from. Every one is a React component that covers its box at any size.`}
    >
      <Section
        title="On a hero"
        description="Pick any preset below to preview it behind real content."
      >
        <div key={hero} className="animate-in duration-500 fade-in-0 zoom-in-[0.99]">
          <Hero preset={hero} />
        </div>
      </Section>
      <div className="flex flex-col gap-8">
        <Toolbar>
          <Tabs value={group} onValueChange={(v) => setGroup(v as Group)}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="All">All</TabsTrigger>
              {backgroundGroups.map(([g]) => (
                <TabsTrigger key={g} value={g}>
                  {g}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="ml-auto font-mono text-xs text-fg-tertiary">{items.length} presets</span>
        </Toolbar>
        {backgroundGroups
          .filter(([g]) => group === "All" || g === group)
          .map(([g, description]) => (
            <Section
              key={g}
              title={g}
              description={description}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items
                .filter((b) => b.group === g)
                .map((b) => (
                  <div
                    key={b.id}
                    className={cn(
                      "group/bg flex flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      hero === b.id && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen(b.id)}
                      className="relative block outline-none focus-visible:ring-3 focus-visible:ring-focus-ring focus-visible:ring-inset"
                      aria-label={`Preview ${b.name}`}
                    >
                      <Background
                        preset={b.id}
                        className="aspect-video w-full transition-transform duration-700 ease-out group-hover/bg:scale-[1.03]"
                      />
                      <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-2xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/bg:opacity-100">
                        <ExternalLinkIcon size={12} />
                        Preview
                      </span>
                    </button>
                    <div className="flex items-center gap-2 border-t px-3 py-2">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-13 font-medium">{b.name}</span>
                        <code className="truncate font-mono text-2xs text-fg-tertiary">{b.id}</code>
                      </div>
                      <Button
                        size="xs"
                        variant={hero === b.id ? "secondary" : "ghost"}
                        onClick={() => setHero(b.id)}
                      >
                        {hero === b.id ? "On hero" : "Use on hero"}
                      </Button>
                      <CopyButton
                        value={`<Background preset="${b.id}" />`}
                        label="Copy JSX"
                        toastLabel="Copied JSX"
                      />
                    </div>
                  </div>
                ))}
            </Section>
          ))}
      </div>
      <Section
        title="Pattern primitives"
        description="Layers to compose your own. Each draws on a 1600 × 900 artboard that covers its positioned parent; random ones take a seed."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primitives.map(([name, code, node, bg]) => (
            <button
              key={name}
              type="button"
              onClick={() => void copyText(code, `Copied ${name}`)}
              className="group/prim flex flex-col overflow-hidden rounded-xl border bg-card text-left outline-none transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: bg }}>
                {node}
              </div>
              <div className="flex items-center gap-2 border-t px-3 py-2">
                <span className="flex-1 truncate font-mono text-xs">{name}</span>
                <CodeIcon
                  size={14}
                  className="text-icon-secondary opacity-0 transition-opacity group-hover/prim:opacity-100"
                />
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-[min(1100px,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[min(1100px,calc(100vw-2rem))]">
          {open ? <Background preset={open} className="aspect-video w-full" /> : null}
          <div className="flex items-center gap-3 border-t px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <DialogTitle className="text-sm">
                {openMeta?.group} · {openMeta?.name}
              </DialogTitle>
              <DialogDescription className="font-mono text-2xs">{`<Background preset="${open ?? ""}" />`}</DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (open) {
                  setHero(open);
                  setOpen(null);
                }
              }}
            >
              Use on hero
            </Button>
            <Button
              size="sm"
              onClick={() => void copyText(`<Background preset="${open ?? ""}" />`, "Copied JSX")}
            >
              <CodeIcon data-icon="inline-start" />
              Copy JSX
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
