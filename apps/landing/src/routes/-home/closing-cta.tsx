import { PrefaceMark } from "@usepreface/ui/brand";
import { buttonVariants } from "@usepreface/ui/components/button";
import { cn } from "@usepreface/ui/lib/utils";
import { GitHubLogo } from "@usepreface/ui/logos";
import { Clouds, Starfield } from "@usepreface/ui/patterns";

import { site } from "../../site";

/* Figma "CTA": a framed piece of the hero sky, clouds drifting in from top and bottom. */

export function ClosingCta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="bg-(--landing-canvas) px-4 pt-6 pb-16 sm:px-8 lg:px-0 lg:pt-16 lg:pb-32"
    >
      <div
        data-reveal=""
        className="relative isolate mx-auto flex max-w-300 flex-col items-center gap-5 overflow-hidden rounded-[28px] bg-(image:--landing-cta-sky) px-6 py-18 text-center lg:gap-7 lg:rounded-[40px] lg:px-16 lg:py-35"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <Starfield count={160} seed={4} className="hidden dark:block" />
          <div className="landing-drift absolute -inset-x-16 inset-y-0 [--drift:50px] [--duration:40s]">
            <Clouds mode="day" banks={[[0, 0.12, 5]]} seed={51} className="dark:hidden" />
            <Clouds mode="night" banks={[[0, 0.12, 5]]} seed={51} className="hidden dark:block" />
          </div>
          <div className="landing-drift absolute -inset-x-16 inset-y-0 [--drift:-50px] [--duration:52s]">
            <Clouds mode="day" banks={[[0.86, 1.05, 6]]} seed={52} className="dark:hidden" />
            <Clouds
              mode="night"
              banks={[[0.86, 1.05, 6]]}
              seed={52}
              className="hidden dark:block"
            />
          </div>
        </div>

        <span className="landing-float flex size-18 items-center justify-center rounded-[22px] border border-white/80 bg-white/70 shadow-[0_12px_30px_rgb(23_71_201/0.2)] backdrop-blur-lg lg:size-22 dark:bg-white/10">
          <PrefaceMark size={60} title="" className="h-13 w-auto lg:h-15" />
        </span>
        <h2
          id="cta-title"
          className="max-w-200 font-display lg:max-w-none text-[2.125rem] leading-[1.1] font-medium tracking-[-0.035em] text-balance text-(--landing-cta-ink) sm:text-5xl lg:text-[4rem] lg:leading-17"
        >
          Your knowledge, above the noise.
        </h2>
        <p className="text-base text-(--landing-cta-sub) lg:text-[1.1875rem] lg:leading-7">
          Self-host in five minutes. Keep every answer cited.
        </p>
        <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a href="#get-started" className={cn(buttonVariants({ size: "lg" }), "px-4")}>
            Get started
          </a>
          <a
            href={site.github}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 px-4")}
          >
            <GitHubLogo size={16} variant="auto" aria-hidden="true" />
            Star on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
