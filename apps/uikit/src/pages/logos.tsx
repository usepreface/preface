import * as React from "react";

import { Input } from "@usepreface/ui/components/input";
import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";
import { SearchIcon } from "@usepreface/ui/icons";
import * as logos from "@usepreface/ui/logos";
import type { LogoVariant } from "@usepreface/ui/logos";
import { brandGroups, brandLogos, type BrandName } from "@usepreface/ui/logos/registry";

import { AssetCard } from "../components/asset";
import { Page, Section, Toolbar } from "../components/bench";

/** Export name of each logo component, for the copied JSX. */
const exportName = new Map<unknown, string>(Object.entries(logos).map(([k, v]) => [v, k]));
const total = Object.keys(brandLogos).length;

export function LogosPage() {
  const [variant, setVariant] = React.useState<LogoVariant>("auto");
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const groups = Object.entries(brandGroups)
    .map(
      ([group, names]) =>
        [
          group,
          names.filter(
            (n: BrandName) => !q || n.includes(q) || brandLogos[n].title.toLowerCase().includes(q),
          ),
        ] as const,
    )
    .filter(([, names]) => names.length);
  return (
    <Page
      figma="12 Integrations art"
      title="Company logos"
      description={`${total} marks from thesvg.org for connectors, models and socials. Auto follows the theme when a brand ships light and dark artwork; mono uses currentColor. Hover to copy JSX or download.`}
    >
      <div className="flex flex-col gap-10">
        <Toolbar>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-icon-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${total} logos…`}
              className="pl-8"
            />
          </div>
          <Tabs value={variant} onValueChange={(v) => setVariant(v as LogoVariant)}>
            <TabsList>
              <TabsTrigger value="auto">Auto</TabsTrigger>
              <TabsTrigger value="color">Colour</TabsTrigger>
              <TabsTrigger value="mono">Mono</TabsTrigger>
            </TabsList>
          </Tabs>
        </Toolbar>
        {groups.map(([group, names]) => (
          <Section
            key={group}
            title={group}
            aside={<span className="font-mono text-xs text-fg-tertiary">{names.length}</span>}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {names.map((name) => {
              const Logo = brandLogos[name];
              const component = exportName.get(Logo) ?? "BrandLogo";
              return (
                <AssetCard
                  key={name}
                  name={Logo.title}
                  caption={name}
                  fileName={variant === "auto" ? name : `${name}-${variant}`}
                  code={`<${component}${variant === "auto" ? "" : ` variant="${variant}"`} size={24} />`}
                  stageClassName="min-h-28 text-icon"
                >
                  <Logo
                    size={36}
                    variant={variant}
                    className="transition-transform duration-300 group-hover/asset:scale-110"
                  />
                </AssetCard>
              );
            })}
          </Section>
        ))}
      </div>
    </Page>
  );
}
