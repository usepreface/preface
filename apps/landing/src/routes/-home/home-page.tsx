import { ClosingCta } from "./closing-cta";
import { CommandPalette } from "./command-palette";
import { Developers } from "./developers";
import { Features } from "./features";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Integrations } from "./integrations";
import { KnowledgeField } from "./knowledge-field";
import { LogoStrip } from "./logo-strip";
import { useScrollReveal } from "./motion";
import { Pricing } from "./pricing";
import { SelfHost } from "./self-host";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

/** preface.run, section for section with Figma pages 42–44 (Landing v2). */
export function HomePage({ stars }: { stars: number | null }) {
  useScrollReveal();
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <SiteNav stars={stars} />
      <main id="main" className="overflow-x-clip bg-(--landing-canvas) text-foreground">
        <Hero />
        <LogoStrip />
        <KnowledgeField />
        <HowItWorks />
        <CommandPalette />
        <Integrations />
        <Features />
        <Developers />
        <SelfHost />
        <Pricing />
        <ClosingCta />
      </main>
      <SiteFooter />
    </>
  );
}
