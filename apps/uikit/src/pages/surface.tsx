import { CopyCode } from "../components/asset";
import { Page, Section } from "../components/bench";

const radii = [
  ["rounded-xs", "4", "Kbd, HTTP method"],
  ["rounded-sm", "6", "Small buttons, menu items, tags"],
  ["rounded-md", "8", "Buttons, inputs, selects"],
  ["rounded-lg", "10", "Menus, popovers, source items"],
  ["rounded-xl", "14", "Cards, composer, command palette"],
  ["rounded-2xl", "20", "Chat widget, bubbles"],
  ["rounded-3xl", "28", "Marketing panels"],
  ["rounded-full", "999", "Pills, avatars, switches"],
] as const;

const shadows = [
  ["shadow-none", "Elevation/0 Flat"],
  ["shadow-xs", "Elevation/1 Raised"],
  ["shadow-sm", "Elevation/2 Card"],
  ["shadow-md", "Elevation/3 Popover"],
  ["shadow-xl", "Elevation/4 Modal"],
  ["shadow-glow", "Glow/Signal"],
] as const;

const surfaces = [
  "bg-canvas",
  "bg-surface-1",
  "bg-surface-2",
  "bg-surface-3",
  "bg-surface-4",
  "bg-overlay",
] as const;

export function SurfacePage() {
  return (
    <Page
      figma="14 Spacing, radius & elevation"
      title="Radius & elevation"
      description="Corner radii, elevation and the surface ladder. Click a class to copy it."
    >
      <Section title="Radius" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {radii.map(([cls, px, use]) => (
          <div key={cls} className="flex flex-col gap-2">
            <div
              className={`${cls} flex h-20 items-center justify-center border border-border-default bg-surface-2 font-mono text-xs text-fg-secondary transition-colors hover:border-primary hover:bg-primary-subtle hover:text-fg-accent`}
            >
              {px}px
            </div>
            <CopyCode value={cls} toastLabel="Copied class" className="text-xs text-fg-accent" />
            <span className="text-xs text-fg-tertiary">{use}</span>
          </div>
        ))}
      </Section>
      <Section
        title="Elevation"
        className="grid grid-cols-2 gap-6 rounded-xl bg-canvas p-8 md:grid-cols-3"
      >
        {shadows.map(([cls, name]) => (
          <div
            key={cls}
            className={`${cls} flex h-24 flex-col items-start justify-end rounded-xl border bg-card p-4 transition-transform duration-200 hover:-translate-y-1`}
          >
            <CopyCode value={cls} toastLabel="Copied class" className="text-xs text-fg-accent" />
            <span className="text-xs text-fg-tertiary">{name}</span>
          </div>
        ))}
      </Section>
      <Section
        title="Nested surfaces"
        description="Canvas → surface 1 → 2 → 3 → 4. Each step is one level of nesting."
      >
        <div className="rounded-xl bg-canvas p-5">
          {surfaces.slice(1).reduceRight<React.ReactNode>(
            (inner, cls) => (
              <div
                className={`${cls} flex flex-col items-start gap-3 rounded-lg border p-4 *:last:self-stretch`}
              >
                <CopyCode
                  value={cls}
                  toastLabel="Copied class"
                  className="text-xs text-fg-secondary"
                />
                {inner}
              </div>
            ),
            null,
          )}
        </div>
      </Section>
    </Page>
  );
}
