import { Link } from "@tanstack/react-router";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Button } from "@usepreface/ui/components/button";
import { Kbd, KbdGroup } from "@usepreface/ui/components/kbd";
import { ArrowRightIcon, GridIcon, iconGroups } from "@usepreface/ui/icons";
import { illustrations } from "@usepreface/ui/illustrations/registry";
import { brandLogos } from "@usepreface/ui/logos/registry";
import { objects } from "@usepreface/ui/objects/registry";
import { Background, backgrounds } from "@usepreface/ui/patterns";
import { CodeSnippet } from "@usepreface/ui/preface/code-snippet";

import { Section } from "../components/bench";
import { labPages } from "../lab";
import { nav } from "../nav";

const iconCount = Object.values(iconGroups).reduce((n, g) => n + Object.keys(g).length, 0);

const stats = [
  [Object.keys(labPages).length, "components in the lab"],
  [iconCount, "icons"],
  [Object.keys(brandLogos).length, "company logos"],
  [illustrations.length, "illustrations"],
  [objects.length, "isometric objects"],
  [backgrounds.length, "backgrounds"],
] as const;

export function OverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 pt-8 pb-24">
      <Background
        preset="gradient-glacier"
        className="flex min-h-[340px] animate-in flex-col justify-between gap-10 rounded-2xl p-8 duration-700 fade-in-0 zoom-in-[0.98] md:p-12"
      >
        <div className="flex items-center gap-3">
          <PrefaceLogo
            size={22}
            tone="ice"
            className="[&_[data-slot=preface-wordmark]]:text-white"
          />
          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-2xs tracking-wider text-white/80 uppercase backdrop-blur">
            UI Kit
          </span>
        </div>
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-display-xl text-balance text-white">
            The Preface interface, as code.
          </h1>
          <p className="max-w-xl text-body-lg text-pretty text-white/70">
            Components on Base UI and shadcn/ui, AI elements, icons, logos, illustrations and
            backgrounds, all on the Figma tokens. Every page here mirrors a page in the brand kit,
            in light and dark.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="bg-white text-[#0F1A33] hover:bg-white/90"
              nativeButton={false}
              render={<Link to="/foundations/colors" />}
            >
              Start with foundations
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <span className="flex items-center gap-2 text-13 text-white/60">
              or search
              <KbdGroup>
                <Kbd className="border-white/20 bg-white/10 text-white">⌘</Kbd>
                <Kbd className="border-white/20 bg-white/10 text-white">K</Kbd>
              </KbdGroup>
            </span>
          </div>
        </div>
      </Background>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([n, label], i) => (
          <div
            key={label}
            className="flex animate-in flex-col gap-1 bg-card px-5 py-4 duration-500 fill-mode-backwards fade-in-0 slide-in-from-bottom-1"
            style={{ animationDelay: `${120 + i * 50}ms` }}
          >
            <span className="font-display text-3xl font-medium tracking-tight tabular-nums">
              {n}
            </span>
            <span className="text-xs text-fg-secondary">{label}</span>
          </div>
        ))}
      </div>

      {nav.slice(1).map((section) => (
        <Section
          key={section.label}
          title={section.label}
          className={
            (section.items.length as number) === 4
              ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {section.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs outline-none transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-border-default hover:shadow-sm focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-subtle text-fg-accent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <item.icon size={18} />
              </span>
              <span className="text-heading-4">{item.title}</span>
              <span className="text-13 text-fg-secondary">{item.description}</span>
              <span className="mt-auto inline-flex items-center gap-1 pt-1 text-13 font-medium text-fg-accent">
                Open
                <ArrowRightIcon
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </Section>
      ))}

      <Section
        title="Component lab"
        description="shadcn/ui's Base UI example pages, re-pointed at the Preface components: every variant, size and state."
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(labPages).map(([name, page]) => (
            <Link
              key={name}
              to="/lab/$name"
              params={{ name }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-13 text-fg-secondary outline-none transition-colors hover:border-border-default hover:bg-surface-2 hover:text-fg focus-visible:ring-3 focus-visible:ring-focus-ring"
            >
              <GridIcon size={12} className="text-icon-secondary" />
              {page.title}
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Using the kit">
        <CodeSnippet
          samples={[
            {
              label: "styles.css",
              language: "css",
              code: `@import "@usepreface/ui/globals.css";`,
            },
            {
              label: "App.tsx",
              language: "tsx",
              code: `import { Button } from "@usepreface/ui/components/button"\nimport { toast, Toaster } from "@usepreface/ui/components/sonner"\nimport { NoSourcesIllustration } from "@usepreface/ui/illustrations"\nimport { SearchIcon } from "@usepreface/ui/icons"\nimport { Background } from "@usepreface/ui/patterns"\n\nexport function Example() {\n  return (\n    <Background preset="gradient-glacier" className="rounded-2xl p-12">\n      <Button onClick={() => toast.success("Searching")}>\n        <SearchIcon data-icon="inline-start" />\n        Search\n      </Button>\n      <Toaster />\n    </Background>\n  )\n}`,
            },
          ]}
        />
      </Section>
    </div>
  );
}
