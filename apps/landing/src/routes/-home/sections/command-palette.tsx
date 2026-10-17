import { Kbd } from "@usepreface/ui/components/kbd";
import { MeshGradient } from "@usepreface/ui/patterns";

import { CommandPaletteDemo } from "../components/command-palette/command-palette-demo";
import { Section } from "../components/section";
import { SectionHeading } from "../components/section-heading";

export function CommandPalette() {
  return (
    <Section aria-labelledby="palette-title" inner="items-center gap-12">
      <SectionHeading
        id="palette-title"
        align="center"
        eyebrow="⌘K"
        title="Every answer, one shortcut away."
        description="Search, ask and act from anywhere in Preface. The first result is always an answer with sources."
      />
      <div
        data-reveal=""
        className="relative flex w-full justify-center rounded-[32px] px-3 py-10 sm:p-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-40 -inset-y-24 -z-0"
        >
          <div className="landing-drift absolute inset-0 [--drift:30px] [--duration:24s]">
            <MeshGradient
              colors={["#BFD5FF", "#8EC0FF", "#DDE8FF", "#C9AEFF"]}
              seed={23}
              blur={160}
              className="opacity-80 dark:hidden"
            />
            <MeshGradient
              colors={["#1747C9", "#2F6BFF", "#0E1D4A", "#4D96FF"]}
              seed={23}
              blur={160}
              className="hidden opacity-60 dark:block"
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--landing-canvas)_72%)]" />
        </div>
        <div className="relative flex w-full justify-center">
          <CommandPaletteDemo />
        </div>
      </div>
      <p data-reveal="" className="flex items-center gap-2 text-sm text-fg-tertiary">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        from any page, any channel
      </p>
    </Section>
  );
}
