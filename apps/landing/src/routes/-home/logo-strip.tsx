import type * as React from "react";

import {
  ActivityIcon,
  CubeIcon,
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  LayersIcon,
  SunIcon,
  ZapIcon,
  type IconComponent,
} from "@usepreface/ui/icons";

/*
 * Figma "Logos": a 4 × 2 hairline grid under the hero. These are placeholder customer names
 * from the design. Replace them with real logos, used with permission, before launch.
 */
const customers: [string, IconComponent][] = [
  ["Northwind", CubeIcon],
  ["Orbit", GlobeIcon],
  ["Kestrel", ZapIcon],
  ["Lumen", SunIcon],
  ["Halcyon", LayersIcon],
  ["Fernway", GitBranchIcon],
  ["Quarry", DatabaseIcon],
  ["Tidewater", ActivityIcon],
];

function Customer({ name, icon: Icon }: { name: string; icon: IconComponent }) {
  return (
    <span className="flex items-center gap-2 text-fg-secondary opacity-75 transition-opacity hover:opacity-100">
      <Icon size={20} />
      <span className="font-display text-lg font-medium tracking-[-0.01em] lg:text-[1.375rem]">
        {name}
      </span>
    </span>
  );
}

const label = "Trusted by 1,800+ self-hosted teams";

export function LogoStrip() {
  return (
    <section aria-label="Customers" className="relative bg-(--landing-canvas) px-5 sm:px-8 lg:px-0">
      <p className="pb-3.5 text-center font-mono text-[10px] leading-3.5 font-medium tracking-[0.08em] text-fg-tertiary uppercase md:hidden">
        {label}
      </p>
      <ul className="mx-auto grid max-w-300 grid-cols-2 border-r border-b border-(--landing-grid-line) md:grid-cols-4">
        {customers.map(([name, icon], i) => (
          <li
            key={name}
            data-reveal=""
            style={{ "--delay": `${(i % 4) * 60}ms`, "--rise": "10px" } as React.CSSProperties}
            className={`h-16 items-center justify-center border-t border-l border-(--landing-grid-line) md:flex md:h-24 ${i > 3 ? "hidden" : "flex"}`}
          >
            {/* On desktop the second cell carries the label, as in the design. */}
            {i === 1 ? (
              <>
                <span className="md:hidden">
                  <Customer name={name} icon={icon} />
                </span>
                <span className="px-3 text-center font-mono text-[11px] leading-3.5 font-medium tracking-[0.08em] text-fg-tertiary uppercase max-md:hidden">
                  {label}
                </span>
              </>
            ) : (
              <Customer name={name} icon={icon} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
