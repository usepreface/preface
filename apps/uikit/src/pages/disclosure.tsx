import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@usepreface/ui/components/accordion";
import { AspectRatio } from "@usepreface/ui/components/aspect-ratio";
import { Badge } from "@usepreface/ui/components/badge";
import { Button } from "@usepreface/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@usepreface/ui/components/carousel";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@usepreface/ui/components/collapsible";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@usepreface/ui/components/resizable";
import { ScrollArea } from "@usepreface/ui/components/scroll-area";
import { Separator } from "@usepreface/ui/components/separator";
import { ChevronDownIcon, FileIcon } from "@usepreface/ui/icons";
import {
  CrawlAWebsiteIllustration,
  ConnectSlackIllustration,
  NoSourcesIllustration,
  UploadFilesIllustration,
} from "@usepreface/ui/illustrations";
import { Background } from "@usepreface/ui/patterns";
import { SyncStatus } from "@usepreface/ui/preface/data-display";

import { Page, Section, Specimen } from "../components/bench";

const faq = [
  [
    "Does Preface train on our data?",
    "No. Documents, embeddings and logs stay on this instance. Model providers receive only the passages needed for one answer, under your own API keys.",
  ],
  [
    "How often do sources sync?",
    "Every 15 minutes by default. GitHub and Slack also push changes by webhook, so most edits show up within a minute.",
  ],
  [
    "Can we limit who sees which collection?",
    "Yes. Collections inherit access from the source where they can, and admins can restrict any collection to groups from your IdP.",
  ],
] as const;

const slides = [
  [NoSourcesIllustration, "Connect a source", "GitHub, Slack, Notion, Drive and more."],
  [ConnectSlackIllustration, "Answer in Slack", "Mention @preface in any channel."],
  [CrawlAWebsiteIllustration, "Crawl your docs", "Point at a sitemap; Preface keeps it fresh."],
  [UploadFilesIllustration, "Upload files", "PDF, Markdown, DOCX, HTML and text."],
] as const;

const chunks = Array.from({ length: 18 }, (_, i) => ({
  id: `chunk-${String(i + 1).padStart(3, "0")}`,
  score: (0.92 - i * 0.031).toFixed(2),
  text: [
    "Staging credentials live in Vault under secret/staging/db.",
    "Rotation runs every 30 days through the rotate-db workflow.",
    "After rotating, restart the API pods so they pick up the new secret.",
  ][i % 3],
}));

export function DisclosurePage() {
  const [open, setOpen] = React.useState(true);
  return (
    <Page
      figma="53 Disclosure & layout"
      title="Disclosure & layout"
      description="Accordion, collapsible, carousel, resizable panes, scroll areas, separators and aspect-ratio frames."
    >
      <Section
        title="Accordion"
        description="Short, specific questions. Answers start with yes, no or the thing itself."
        className="grid gap-6 md:grid-cols-2"
      >
        <Specimen label="Single · collapsible" className="items-stretch p-2">
          <Accordion defaultValue={[faq[0][0]]} className="w-full">
            {faq.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Specimen>
        <Specimen label="Multiple" className="items-stretch p-2">
          <Accordion multiple defaultValue={[faq[1][0], faq[2][0]]} className="w-full">
            {faq.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Specimen>
      </Section>

      <Section
        title="Collapsible"
        description="One region that hides detail, like the retrieval steps under an answer."
        className="flex"
      >
        <Specimen className="w-full max-w-lg flex-col items-stretch">
          <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium">Retrieval · 3 sources, 6 passages</span>
              <CollapsibleTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Toggle details" />}
              >
                <ChevronDownIcon
                  className={open ? "rotate-180 transition-transform" : "transition-transform"}
                />
              </CollapsibleTrigger>
            </div>
            <div className="rounded-lg border px-3 py-2 font-mono text-xs">
              notion · Rotating staging credentials · 0.92
            </div>
            <CollapsibleContent className="flex flex-col gap-2">
              <div className="rounded-lg border px-3 py-2 font-mono text-xs">
                github · acme/platform/docs/secrets.md · 0.88
              </div>
              <div className="rounded-lg border px-3 py-2 font-mono text-xs">
                slack · #platform · 12 Oct thread · 0.81
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Specimen>
      </Section>

      <Section
        title="Carousel"
        description="Paged with buttons, dots, swipe or the arrow keys. Never auto-advances."
        className="grid max-w-xl"
      >
        <Specimen className="flex-col flex-nowrap items-stretch gap-4">
          <Carousel aria-label="Getting started" className="w-full min-w-0">
            <CarouselContent>
              {slides.map(([Art, title, text]) => (
                <CarouselItem key={title}>
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-border-subtle bg-surface-2 p-6 text-center">
                    <Art className="h-36 w-auto" />
                    <span className="text-heading-3">{title}</span>
                    <span className="text-13 text-fg-secondary">{text}</span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-4 flex items-center justify-between">
              <CarouselPrevious />
              <CarouselDots />
              <CarouselNext />
            </div>
          </Carousel>
        </Specimen>
      </Section>

      <Section
        title="Resizable"
        description="Split panes for the document viewer and answer trace. Drag the handle or focus it and use the arrow keys."
        className="flex"
      >
        <div className="h-80 w-full overflow-hidden rounded-xl border bg-card">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={34} minSize={20}>
              <div className="flex h-full flex-col gap-1 p-3">
                <span className="px-1 pb-1 text-xs font-medium text-fg-tertiary">Documents</span>
                {["secrets.md", "rotate-db.yml", "runbook.md", "onboarding.md"].map((f, i) => (
                  <div
                    key={f}
                    className={
                      i === 0
                        ? "flex items-center gap-2 rounded-md bg-selected px-2 py-1.5 text-13"
                        : "flex items-center gap-2 rounded-md px-2 py-1.5 text-13 text-fg-secondary"
                    }
                  >
                    <FileIcon className="size-4 text-icon-secondary" />
                    {f}
                  </div>
                ))}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize documents" />
            <ResizablePanel minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={62} minSize={25}>
                  <div className="flex h-full flex-col gap-2 p-4">
                    <span className="text-sm font-medium">docs/secrets.md</span>
                    <p className="text-13 text-fg-secondary">
                      Staging credentials live in Vault under{" "}
                      <code className="font-mono text-foreground">secret/staging/db</code>. Rotation
                      runs every 30 days through the rotate-db workflow.
                    </p>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Resize trace" />
                <ResizablePanel minSize={20}>
                  <div className="flex h-full flex-col gap-2 bg-surface-2 p-4">
                    <span className="text-xs font-medium text-fg-tertiary">Answer trace</span>
                    <div className="flex items-center gap-2">
                      <SyncStatus state="synced">Retrieved 6 passages</SyncStatus>
                      <Badge tone="info">Reranked</Badge>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Section>

      <Section
        title="Scroll area, separator & aspect ratio"
        description="Thin overlay scrollbars; hairline separators; fixed ratios for previews and OG images."
        className="grid gap-6 md:grid-cols-3"
      >
        <Specimen label="Scroll area" className="items-stretch p-0">
          <ScrollArea className="h-56 w-full">
            <div className="flex flex-col p-3">
              {chunks.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i ? <Separator className="my-2" /> : null}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between font-mono text-2xs text-fg-tertiary">
                      <span>{c.id}</span>
                      <span>{c.score}</span>
                    </div>
                    <span className="text-13">{c.text}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </ScrollArea>
        </Specimen>
        <Specimen label="Separator" className="flex-col items-stretch gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Preface UI</span>
            <span className="text-13 text-fg-secondary">Base UI components in Preface style.</span>
          </div>
          <Separator />
          <div className="flex h-5 items-center gap-3 text-13 text-fg-secondary">
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>GitHub</span>
            <Separator orientation="vertical" />
            <span>Changelog</span>
          </div>
        </Specimen>
        <Specimen label="Aspect ratio · 1200×630" className="items-stretch p-3">
          <AspectRatio ratio={1200 / 630} className="w-full overflow-hidden rounded-lg border">
            <Background preset="studio-mist" className="size-full">
              <div className="flex size-full items-end p-4">
                <span className="text-heading-3">Cited answers from your docs</span>
              </div>
            </Background>
          </AspectRatio>
        </Specimen>
      </Section>
    </Page>
  );
}
