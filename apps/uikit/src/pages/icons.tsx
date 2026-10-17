import * as React from "react";

import { Input } from "@usepreface/ui/components/input";
import { Slider } from "@usepreface/ui/components/slider";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import {
  CloseIcon,
  DownloadIcon,
  iconGroups,
  SearchIcon,
  type IconComponent,
} from "@usepreface/ui/icons";

import { ActionButton } from "../components/asset";
import { Page, Section, Toolbar } from "../components/bench";
import { copyText, downloadSvg, kebab } from "../lib/assets";

const total = Object.values(iconGroups).reduce((n, g) => n + Object.keys(g).length, 0);

function IconTile({
  name,
  Icon,
  size,
  stroke,
}: {
  name: string;
  Icon: IconComponent;
  size: number;
  stroke: number;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const jsx = `<${name}${size === 16 ? "" : ` size={${size}}`}${stroke === 1.5 ? "" : ` strokeWidth={${stroke}}`} />`;
  return (
    <div className="group/icon relative">
      <button
        ref={ref}
        type="button"
        onClick={() => void copyText(jsx, `Copied ${name}`)}
        className="flex w-full flex-col items-center gap-2.5 rounded-lg border bg-card px-2 pt-5 pb-3 text-icon outline-none transition-[border-color,background-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-border-default hover:bg-surface-2 hover:shadow-xs focus-visible:ring-3 focus-visible:ring-focus-ring active:translate-y-0 active:scale-[0.98]"
      >
        <span className="grid h-8 place-items-center transition-transform duration-200 group-hover/icon:scale-110">
          <Icon size={size} strokeWidth={stroke} />
        </span>
        <span className="w-full truncate text-center font-mono text-2xs text-fg-tertiary group-hover/icon:text-fg-secondary">
          {name.replace(/Icon$/, "")}
        </span>
      </button>
      <div className="absolute top-1 right-1 opacity-0 transition-opacity group-hover/icon:opacity-100 group-focus-within/icon:opacity-100">
        <ActionButton
          label="Download SVG"
          onClick={() => downloadSvg(ref.current, kebab(name.replace(/Icon$/, "")))}
        >
          <DownloadIcon size={12} />
        </ActionButton>
      </div>
    </div>
  );
}

export function IconsPage() {
  const [query, setQuery] = React.useState("");
  const [size, setSize] = React.useState("20");
  const [stroke, setStroke] = React.useState(1.5);
  const q = query.trim().toLowerCase();
  const groups = Object.entries(iconGroups)
    .map(
      ([group, icons]) =>
        [
          group,
          Object.entries(icons).filter(
            ([name]) => !q || name.toLowerCase().includes(q) || group.toLowerCase().includes(q),
          ),
        ] as const,
    )
    .filter(([, items]) => items.length);
  const shown = groups.reduce((n, [, items]) => n + items.length, 0);
  return (
    <Page
      figma="08 Iconography"
      title="Icons"
      description={`${total} Hugeicons Free glyphs, stroke-rounded on a 24px grid at 1.5px, with Preface names. Click to copy the JSX; hover for the SVG.`}
    >
      <div className="flex flex-col gap-10">
        <Toolbar>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${total} icons…`}
              className="px-8"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-icon-secondary hover:text-icon"
              >
                <CloseIcon size={14} />
              </button>
            ) : null}
          </div>
          <Tabs value={size} onValueChange={(v) => setSize(String(v))}>
            <TabsList>
              {["16", "20", "24", "32"].map((s) => (
                <TabsTrigger key={s} value={s}>
                  {s}px
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <label className="flex items-center gap-3 text-13 text-fg-secondary">
            Stroke
            <div className="w-28">
              <Slider
                min={1}
                max={2.5}
                step={0.25}
                value={stroke}
                onValueChange={(v) => setStroke(Array.isArray(v) ? (v[0] ?? 1.5) : v)}
              />
            </div>
            <span className="w-8 font-mono text-xs text-fg">{stroke}</span>
          </label>
          <span className="ml-auto font-mono text-xs text-fg-tertiary">
            {shown} / {total}
          </span>
        </Toolbar>
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <SearchIcon size={24} className="text-icon-secondary" />
            <p className="text-body-md text-fg-secondary">No icons match “{query}”.</p>
            <p className="text-13 text-fg-tertiary">
              Any other Hugeicons glyph works with{" "}
              <code className="font-mono">{"<Icon icon={…} />"}</code>.
            </p>
          </div>
        ) : null}
        {groups.map(([group, items]) => (
          <Section
            key={group}
            title={group}
            aside={<span className="font-mono text-xs text-fg-tertiary">{items.length}</span>}
            className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          >
            {items.map(([name, Icon]) => (
              <IconTile key={name} name={name} Icon={Icon} size={Number(size)} stroke={stroke} />
            ))}
          </Section>
        ))}
      </div>
    </Page>
  );
}
