import { SiteFooter } from "../../components/layout/site-footer";
import { SiteNav } from "../../components/layout/site-nav";
import { useScrollReveal } from "./hooks/use-scroll-reveal";
import { ClosingCta } from "./sections/closing-cta";
import { CommandPalette } from "./sections/command-palette";
import { Developers } from "./sections/developers";
import { Features } from "./sections/features";
import { Hero } from "./sections/hero";
import { HowItWorks } from "./sections/how-it-works";
import { Integrations } from "./sections/integrations";
import { KnowledgeField } from "./sections/knowledge-field";
import { LogoStrip } from "./sections/logo-strip";
import { Pricing } from "./sections/pricing";
import { SelfHost } from "./sections/self-host";

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
