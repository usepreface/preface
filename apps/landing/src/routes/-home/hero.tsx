import type * as React from "react";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon, CodeTagIcon, ServerIcon, ShieldIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import type { BrandName } from "@usepreface/ui/logos/registry";
import { Clouds, Glow, Starfield } from "@usepreface/ui/patterns";
import { InstallCommand } from "@usepreface/ui/preface/developer";

import { site } from "../../site";
import { GlassTile } from "./primitives";
import { ScaledPreview } from "./product-preview";

/*
 * Figma 42/43 "Hero": sky gradient (stars at night), drifting wisps, the headline, install
 * command, then the product window rising out of a cloud bank with integration tiles
 * floating around it. Coordinates are from the 1440 px frame.
 */

// [brand, x, y relative to the window top, rotation, size]
const tiles: [BrandName, number, number, number, number][] = [
  ["github", 64, -50, -8, 96],
  ["slack", 104, 150, 6, 78],
  ["notion", 28, 310, 4, 72],
  ["google-drive", 118, 450, -5, 64],
  ["discord", 1280, -50, 8, 96],
  ["telegram", 1258, 150, -6, 78],
  ["linear", 1340, 310, -4, 72],
  ["confluence", 1258, 450, 5, 64],
];

// Dashed "circuit" leads from each tile to the window edge (x 170 or 1270).
const circuit = tiles
  .map(([, x, y, , size]) => {
    const tx = x + size / 2;
    const ty = y + size / 2 + 100;
    const ex = tx < 720 ? 170 : 1270;
    const mx = (tx + ex) / 2;
    return `M${tx} ${ty}C${mx} ${ty},${mx} ${ty + 30},${ex} ${ty + 40}`;
  })
  .join("");

const trust: [React.ComponentType<{ size?: number; className?: string }>, string][] = [
  [CodeTagIcon, "Apache-2.0 licensed"],
  [ServerIcon, "Runs on your infra"],
  [ShieldIcon, "SSO, SCIM & audit logs"],
];

function enter(delay: number): React.CSSProperties {
  return { "--delay": `${delay}ms` } as React.CSSProperties;
}

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-(image:--landing-sky)"
    >
      {/* Sky: a bright bloom by day, stars and a blue glow by night. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-225">
        <Glow
          x={420}
          y={-260}
          w={760}
          h={420}
          color="#FFFFFF"
          opacity={0.9}
          blur={140}
          className="dark:hidden"
        />
        <div className="hidden dark:block">
          <Starfield count={260} seed={8} />
          <Glow x={470} y={-160} w={660} h={360} color="#2F6BFF" opacity={0.35} blur={140} />
        </div>
        <div className="landing-drift absolute -inset-x-20 inset-y-0 [--drift:70px]">
          <Clouds mode="day" banks={[]} wisps={7} seed={41} className="dark:hidden" />
          <Clouds mode="night" banks={[]} wisps={7} seed={41} className="hidden dark:block" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-360 flex-col items-center px-5 pt-32 text-center sm:px-8 lg:pt-42">
        <a
          href={`${site.github}/releases`}
          className="landing-enter group flex items-center gap-2.5 rounded-full border border-(--landing-glass-edge) bg-(--landing-glass) py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-foreground backdrop-blur-lg outline-none transition-colors hover:bg-(--landing-glass-edge) focus-visible:ring-3 focus-visible:ring-focus-ring"
          style={enter(0)}
        >
          <span className="rounded-full bg-primary px-2.25 py-0.75 font-mono text-[11px] leading-3.5 text-primary-foreground">
            v1.4
          </span>
          <span className="max-sm:hidden">Discord &amp; Telegram sources are here</span>
          <span className="sm:hidden">Discord &amp; Telegram sources</span>
          <ArrowRightIcon
            size={14}
            className="text-icon-secondary transition-transform group-hover:translate-x-0.5"
          />
        </a>

        <h1
          id="hero-title"
          className="mt-7 font-display text-[2.5rem] leading-[1.05] sm:mt-9 font-medium tracking-[-0.055em] text-foreground sm:text-7xl lg:text-[6.5rem] lg:leading-[6.5rem]"
        >
          <span className="landing-enter block" style={enter(80)}>
            Ask your company
          </span>
          <span className="landing-enter landing-accent-text block pb-2" style={enter(180)}>
            anything.
          </span>
        </h1>

        <p
          className="landing-enter mt-7 max-w-175 text-lg leading-7.5 text-pretty text-fg-secondary lg:text-xl lg:leading-8"
          style={enter(300)}
        >
          Preface is the open-source knowledge platform you host yourself. It reads GitHub, Slack,
          Notion and your docs, then answers in your widget, your team chat and your API - with a
          source for every sentence.
        </p>

        <div
          id="get-started"
          className="landing-enter mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
          style={enter(400)}
        >
          <InstallCommand
            size="lg"
            command="docker compose up -d"
            className="w-full bg-surface-1/80 text-left backdrop-blur-md sm:w-auto"
          />
          <a
            href={site.docs}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 w-full gap-2 px-4 text-[15px] sm:w-auto",
            )}
          >
            Read the docs
            <ArrowRightIcon data-icon="inline-end" />
          </a>
        </div>

        <ul
          className="landing-enter mt-9 flex flex-wrap items-center justify-center gap-x-5.5 gap-y-2 text-sm text-fg-secondary"
          style={enter(480)}
        >
          {trust.map(([Icon, label]) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon size={16} className="text-icon-secondary" />
              {label}
            </li>
          ))}
        </ul>

        {/* The window and its floating tiles share the 1440 px stage. */}
        <div className="relative mt-14 w-full max-w-360 lg:mt-16">
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 700"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 -top-25 hidden h-175 w-full xl:block"
          >
            <path
              d={circuit}
              fill="none"
              stroke="var(--landing-circuit)"
              strokeWidth="1.2"
              strokeDasharray="3 5"
              vectorEffect="non-scaling-stroke"
              data-motion=""
              style={{ animation: "landing-dash 2.4s linear infinite" }}
            />
          </svg>

          <div
            className="landing-enter relative mx-auto max-w-280 rounded-[26px] border border-(--landing-glass-edge) bg-(--landing-glass) p-1.5 shadow-(--landing-window-shadow) backdrop-blur-2xl [--rise:72px] sm:p-2.5"
            style={{ ...enter(560), animationDuration: "1.4s" }}
          >
            <ScaledPreview className="rounded-[18px]" />
          </div>

          <ul
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-2 hidden xl:block"
          >
            {tiles.map(([brand, x, y, rotate, size], i) => (
              <li
                key={brand}
                className="landing-enter absolute [--rise:24px]"
                style={{
                  left: `${(x / 1440) * 100}%`,
                  top: y,
                  ...enter(700 + i * 70),
                }}
              >
                <GlassTile
                  brand={brand}
                  size={size}
                  rotate={rotate}
                  className="landing-float"
                  style={{ "--delay": `${-i * 0.8}s` } as React.CSSProperties}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The cloud bank the window rises from, then a fade into the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-[min(46vw,660px)]"
      >
        <div className="landing-drift absolute -inset-x-24 inset-y-0 [--drift:40px] [--duration:48s]">
          <Clouds mode="day" banks={[[0.8, 1.02, 11]]} seed={42} className="dark:hidden" />
          <Clouds mode="night" banks={[[0.8, 1.02, 11]]} seed={42} className="hidden dark:block" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-(--landing-canvas)" />
      </div>
      <div className="h-20 lg:h-28" />
    </section>
  );
}
