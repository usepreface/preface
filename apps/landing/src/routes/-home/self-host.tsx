import * as React from "react";

import { Glow, Grain, PerspectiveGrid, Scanlines, seeded } from "@usepreface/ui/patterns";

import { useInView, useReducedMotion } from "./motion";

/*
 * Figma "Self-host": a night panel with a perspective grid, scanlines and glitch bars, and a
 * terminal that brings the stack up. Motion note: scanline sweep 4 s, glitch bars in 120 ms
 * bursts. The panel is dark in both themes.
 */

const lines: [prefix: string, text: string, link?: string][] = [
  ["$ ", "docker compose up -d"],
  ["✔ ", "postgres   healthy"],
  ["✔ ", "api        :8080"],
  ["✔ ", "worker ×3  ready"],
  ["✔ ", "web        ", "localhost:3000"],
];

// Glitch bars from the Figma seed, as fractions of the panel.
const bars = (() => {
  const { rr, rnd } = seeded(77);
  return Array.from({ length: 7 }, () => ({
    w: rr(40, 220) / 1200,
    h: rr(3, 9),
    color: rnd() > 0.5 ? "#00E5FF" : "#4D96FF",
    opacity: rr(0.25, 0.6),
    x: rr(620, 1150) / 1200,
    y: rr(90, 420) / 520,
    delay: rr(0, 4),
  }));
})();

function Terminal() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, "-20% 0px");
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(lines.length);

  // Prerendered with every line; once JavaScript runs, replay the boot when it scrolls in.
  React.useEffect(() => {
    setShown(reduced ? lines.length : 0);
  }, [reduced]);
  React.useEffect(() => {
    if (!inView || reduced) {
      return;
    }
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= lines.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 420);
    return () => window.clearInterval(id);
  }, [inView, reduced]);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-120 rounded-2xl border border-[#8ec0ff]/25 bg-[#0a0c10]/85 px-5.5 py-4.5 font-mono text-[13px] leading-5.5 backdrop-blur-xl sm:text-[15px]"
    >
      <span className="sr-only">{lines.map(([p, t, l]) => `${p}${t}${l ?? ""}`).join("\n")}</span>
      <div aria-hidden="true" className="flex min-h-37.5 flex-col gap-2 whitespace-pre">
        {lines.slice(0, shown).map(([prefix, text, link], i) => (
          <div key={i} className="animate-in duration-300 fade-in-0 slide-in-from-bottom-1">
            <span className={i === 0 ? "text-[#6b7385]" : "text-[#3dd68c]"}>{prefix}</span>
            <span className={i === 0 ? "text-[#eaf2ff]" : "text-[#d5dae3]"}>{text}</span>
            {link ? <span className="text-[#8ec0ff]">{link}</span> : null}
          </div>
        ))}
        {shown < lines.length ? (
          <span
            data-motion=""
            className="h-5 w-2 bg-[#8ec0ff]"
            style={{ animation: "landing-caret 1s steps(1) infinite" }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function SelfHost() {
  return (
    <section
      id="self-host"
      aria-labelledby="selfhost-title"
      className="bg-(--landing-canvas) px-5 py-8 sm:px-8 lg:px-0 lg:py-16"
    >
      <div
        data-reveal=""
        className="dark relative mx-auto grid max-w-300 items-center gap-10 overflow-hidden rounded-[32px] bg-[#05070d] px-6 py-12 text-foreground sm:px-10 lg:min-h-130 lg:grid-cols-[1fr_480px] lg:gap-0 lg:px-16 lg:py-20"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <Glow x={760} y={120} w={900} h={520} color="#1F55E6" opacity={0.7} blur={140} />
          <PerspectiveGrid horizon={400} color="#8EC0FF" opacity={0.25} />
          <Scanlines gap={3} color="#8EC0FF" opacity={0.05} />
          <div
            data-motion=""
            className="absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-transparent via-[#8ec0ff]/10 to-transparent"
            style={{ animation: "landing-sweep 4s linear infinite" }}
          />
          {bars.map((bar, i) => (
            <span
              key={i}
              data-motion=""
              className="absolute max-lg:hidden"
              style={{
                left: `${bar.x * 100}%`,
                top: `${bar.y * 100}%`,
                width: `${bar.w * 100}%`,
                height: bar.h,
                background: bar.color,
                opacity: bar.opacity,
                animation: `landing-glitch 4s steps(1) ${bar.delay.toFixed(2)}s infinite`,
              }}
            />
          ))}
          <Grain opacity={0.1} />
        </div>
        <div className="relative flex flex-col gap-4.5">
          <span className="w-fit rounded-full bg-[#2f6bff]/18 px-3 py-1.5 font-mono text-xs leading-4 font-medium tracking-[0.06em] text-[#8ec0ff] uppercase">
            Self-hosted
          </span>
          <h2
            id="selfhost-title"
            className="font-display text-[2.375rem] leading-[1.07] font-medium tracking-[-0.03em] text-[#f5f8ff] sm:text-5xl lg:-mr-40 lg:text-[3.5rem] lg:leading-15 lg:whitespace-nowrap"
          >
            Your infra. Your models.
            <br />
            Your data.
          </h2>
          <p className="max-w-120 text-base leading-7 text-[#aeb7c6] lg:text-lg">
            One compose file. OpenAI, Anthropic, Azure, Bedrock or Ollama. Air-gapped installs
            supported. Nothing phones home.
          </p>
        </div>
        <div className="relative flex lg:-mt-24 lg:justify-end">
          <Terminal />
        </div>
      </div>
    </section>
  );
}
