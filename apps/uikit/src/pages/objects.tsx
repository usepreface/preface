import * as React from "react";

import { Slider } from "@usepreface/ui/components/slider";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import type { ObjectPalette } from "@usepreface/ui/objects";
import { objects } from "@usepreface/ui/objects/registry";
import { DotGrid } from "@usepreface/ui/patterns";

import { AssetCard } from "../components/asset";
import { Page, Section, Toolbar } from "../components/bench";
import { kebab } from "../lib/assets";

const palettes = [
  {
    id: "glacier",
    name: "Glacier",
    use: "Ice tones for dark brand surfaces: covers, social, landing hero",
    stage: "bg-[#0D1017]",
    dots: "#8EC0FF",
  },
  {
    id: "deep",
    name: "Deep",
    use: "Signal blues for light marketing surfaces",
    stage: "bg-[#F5F9FF]",
    dots: "#1747C9",
  },
  {
    id: "line",
    name: "Line",
    use: "White faces and a slate outline, for product UI on light",
    stage: "bg-white",
    dots: "#16191F",
  },
  {
    id: "lineDark",
    name: "Line dark",
    use: "The line set for dark product UI",
    stage: "bg-[#0D0F12]",
    dots: "#F5F8FF",
  },
] as const;

export function ObjectsPage() {
  const [palette, setPalette] = React.useState<ObjectPalette>("glacier");
  const [size, setSize] = React.useState(120);
  const current = palettes.find((p) => p.id === palette) ?? palettes[0];
  const Hero = objects[0];
  return (
    <Page
      figma="10 Objects"
      title="Objects"
      description={`${objects.length} true-isometric objects in four palettes: three tones and one accent each. The first eight are the core metaphors; the rest fill in product moments.`}
    >
      <Section
        title="Palettes"
        description="Each palette has a home surface. auto picks Line on light and Line dark on dark."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {palettes.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPalette(p.id)}
              aria-pressed={palette === p.id}
              className="group/pal relative flex flex-col overflow-hidden rounded-xl border bg-card text-left outline-none transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-3 focus-visible:ring-focus-ring aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary"
            >
              <div
                className={`relative flex h-36 items-center justify-center overflow-hidden ${p.stage}`}
              >
                <DotGrid color={p.dots} opacity={0.12} gap={16} radius={1} />
                {Hero ? (
                  <Hero
                    palette={p.id}
                    size={96}
                    className="relative transition-transform duration-500 group-hover/pal:-translate-y-1"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-0.5 border-t px-3 py-2.5">
                <span className="text-13 font-medium">
                  {p.name}{" "}
                  <code className="ml-1 font-mono text-2xs text-fg-tertiary">palette="{p.id}"</code>
                </span>
                <span className="text-xs text-fg-secondary">{p.use}</span>
              </div>
            </button>
          ))}
        </div>
      </Section>
      <div className="flex flex-col gap-8">
        <Toolbar>
          <Tabs value={palette} onValueChange={(v) => setPalette(v as ObjectPalette)}>
            <TabsList>
              {palettes.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>
                  {p.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <label className="flex items-center gap-3 text-13 text-fg-secondary">
            Size
            <div className="w-32">
              <Slider
                min={64}
                max={200}
                step={8}
                value={size}
                onValueChange={(v) => setSize(Array.isArray(v) ? (v[0] ?? 120) : v)}
              />
            </div>
            <span className="w-10 font-mono text-xs text-fg">{size}</span>
          </label>
        </Toolbar>
        <Section title="Core metaphors" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {objects.slice(0, 8).map((Obj) => (
            <ObjectTile
              key={Obj.objectName}
              Obj={Obj}
              palette={palette}
              size={size}
              stage={current.stage}
              dots={current.dots}
            />
          ))}
        </Section>
        <Section
          title="Product objects"
          className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6"
        >
          {objects.slice(8).map((Obj) => (
            <ObjectTile
              key={Obj.objectName}
              Obj={Obj}
              palette={palette}
              size={Math.round(size * 0.75)}
              stage={current.stage}
              dots={current.dots}
            />
          ))}
        </Section>
      </div>
    </Page>
  );
}

function ObjectTile({
  Obj,
  palette,
  size,
  stage,
  dots,
}: {
  Obj: (typeof objects)[number];
  palette: ObjectPalette;
  size: number;
  stage: string;
  dots: string;
}) {
  const name = (Obj as { displayName?: string }).displayName ?? "Object";
  return (
    <AssetCard
      name={Obj.objectName}
      caption={Obj.description ?? `<${name} />`}
      fileName={`${kebab(Obj.objectName)}-${kebab(palette)}`}
      code={`<${name}${palette === "glacier" ? "" : ` palette="${palette}"`} size={${size}} />`}
      stageClassName={`relative min-h-52 overflow-hidden ${stage}`}
    >
      <DotGrid
        color={dots}
        opacity={0.1}
        gap={16}
        radius={1}
        className="transition-opacity duration-300 group-hover/asset:opacity-60"
      />
      <Obj
        palette={palette}
        size={size}
        className="relative transition-transform duration-500 ease-out group-hover/asset:-translate-y-1.5"
      />
    </AssetCard>
  );
}
