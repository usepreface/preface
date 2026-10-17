import * as React from "react";

import { PrefaceMark } from "../brand";
import { cn } from "../lib/utils";
import { brandLogos, type BrandName } from "../logos/registry";
import {
  ARTBOARD,
  Beams,
  CharacterField,
  Clouds,
  DotGrid,
  FacetTessellation,
  GlassPanel,
  Glow,
  Grain,
  Halftone,
  Layer,
  LineGrid,
  MeshGradient,
  PerspectiveGrid,
  Rings,
  Scanlines,
  seeded,
  SKY,
  Starfield,
  Topography,
  Waves,
} from "./primitives";

/*
 * The 35 backgrounds from Figma page 45, as one component:
 *
 *   <Background preset="gradient-glacier" className="h-80 rounded-2xl">
 *     <h1 className="relative">…</h1>
 *   </Background>
 *
 * The artwork is drawn on a 16:9 stage that covers the box (like `object-fit: cover`),
 * so it can be any size. Children render above it.
 */

/** Artboard pixels to stage-relative units, so overlays scale with the stage. */
const u = (px: number) => `${(px / ARTBOARD.w) * 100}cqw`;
const at = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({
  position: "absolute",
  left: `${(x / ARTBOARD.w) * 100}%`,
  top: `${(y / ARTBOARD.h) * 100}%`,
  ...(w === undefined ? {} : { width: `${(w / ARTBOARD.w) * 100}%` }),
  ...(h === undefined ? {} : { height: `${(h / ARTBOARD.h) * 100}%` }),
});

function alpha(hex: string, a = 1) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
}
/** Figma-style linear gradient: 0° runs left to right, 90° top to bottom. */
function lin(stops: [number, string, number?][], angle: number) {
  return `linear-gradient(${angle + 90}deg, ${stops.map(([p, c, a]) => `${alpha(c, a)} ${p * 100}%`).join(", ")})`;
}
function rad(stops: [number, string, number?][], cx: number, cy: number, rx: number, ry: number) {
  return `radial-gradient(${rx * 100}% ${ry * 100}% at ${cx * 100}% ${cy * 100}%, ${stops.map(([p, c, a]) => `${alpha(c, a)} ${p * 100}%`).join(", ")})`;
}

function Wash({ background }: { background: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background }} />
  );
}

const BL = {
  glacier: ["#2F6BFF", "#4D96FF", "#1747C9", "#8EC0FF", "#16191F"],
  ice: ["#BFD5FF", "#8EC0FF", "#DDE8FF", "#C9AEFF", "#EAF2FF"],
  signal: ["#4D96FF", "#00C2FF", "#7C5CFF", "#8EC0FF", "#1747C9"],
  aurora: ["#12B5A6", "#7C5CFF", "#2F6BFF", "#4D96FF", "#0E1D4A"],
  dawn: ["#FFD6C2", "#BFD5FF", "#F7E1F5", "#8EC0FF", "#FFFFFF"],
  deep: ["#1747C9", "#0E1D4A", "#2F6BFF", "#000000", "#142F78"],
} as const;

/* ---------- composed pieces ---------- */

function MockUI({ dark }: { dark: boolean }) {
  const c1 = dark ? "#F5F8FF" : "#0F1A33";
  return (
    <div className="flex flex-col items-start" style={{ gap: u(14), padding: u(28) }}>
      <span
        className="font-sans font-semibold"
        style={{ color: c1, fontSize: u(20), lineHeight: u(26) }}
      >
        Ask Acme
      </span>
      {[300, 260, 320, 180].map((w) => (
        <span
          key={w}
          className="block"
          style={{ width: u(w), height: u(10), borderRadius: u(5), background: alpha(c1, 0.14) }}
        />
      ))}
      <span
        className="font-sans font-medium text-white"
        style={{
          background: alpha("#2F6BFF", 0.9),
          borderRadius: 999,
          padding: `${u(6)} ${u(12)}`,
          fontSize: u(13),
          lineHeight: u(16),
        }}
      >
        3 sources
      </span>
    </div>
  );
}

function Glass({
  x,
  y,
  w,
  h,
  dark,
  radius = 24,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  dark: boolean;
  radius?: number;
  children?: React.ReactNode;
}) {
  return (
    <GlassPanel
      dark={dark}
      radius={radius}
      style={{ ...at(x, y, w, h), borderRadius: radius >= 999 ? 999 : u(radius) }}
    >
      {children}
    </GlassPanel>
  );
}

function Mark({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <PrefaceMark
      tone="ice"
      title=""
      aria-hidden
      style={{ ...at(x, y), height: u(size), width: "auto" }}
    />
  );
}

const glitchWord = (
  fill: string,
  dx: number,
  opacity: number,
  extra?: React.SVGProps<SVGTextElement>,
) => (
  <text
    x={260 + dx}
    y={300 + 300 * 0.8}
    fill={fill}
    fillOpacity={opacity}
    fontFamily="var(--font-display)"
    fontWeight={500}
    fontSize={300}
    letterSpacing={-4}
    style={{ mixBlendMode: "screen" }}
    {...extra}
  >
    Preface
  </text>
);

function GlitchWordmark() {
  const id = React.useId().replace(/:/g, "");
  const slices = React.useMemo(() => {
    const { rr } = seeded(31);
    return Array.from({ length: 9 }, () => {
      const y = rr(300, 600);
      const h = rr(8, 36);
      return { dx: rr(-60, 60), y, h };
    });
  }, []);

  return (
    <Layer fit="none">
      <defs>
        {slices.map((s, i) => (
          <clipPath key={i} id={`${id}-${i}`}>
            <rect x={0} y={s.y} width={ARTBOARD.w} height={s.h} />
          </clipPath>
        ))}
      </defs>
      {glitchWord("#00E5FF", -14, 0.8)}
      {glitchWord("#FF2E63", 14, 0.75)}
      {glitchWord("#F5F8FF", 0, 1)}
      {slices.map((s, i) => (
        <g key={i} clipPath={`url(#${id}-${i})`}>
          <rect x={0} y={s.y} width={ARTBOARD.w} height={s.h} fill="#05070D" />
          {glitchWord("#F5F8FF", s.dx, 1)}
        </g>
      ))}
    </Layer>
  );
}

function GlitchBars() {
  const bars = React.useMemo(() => {
    const { rnd, rr } = seeded(8);
    return Array.from({ length: 12 }, () => {
      const y = rr(200, 700);
      const h = rr(4, 18);
      const w = rr(80, 600);
      const fill = rnd() > 0.5 ? "#00E5FF" : "#4D96FF";
      const o = rr(0.2, 0.6);
      return { x: rr(300, 1100), y, w, h, fill, o };
    });
  }, []);
  return (
    <Layer fit="none">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} fillOpacity={b.o} />
      ))}
    </Layer>
  );
}

function Datamosh() {
  const blocks = React.useMemo(() => {
    const { rnd, rr } = seeded(44);
    const cols = ["#1747C9", "#2F6BFF", "#4D96FF", "#8EC0FF", "#16191F", "#EAF2FF"];
    return Array.from({ length: 220 }, () => {
      const w = Math.round(rr(1, 12)) * 16;
      const h = Math.round(rr(1, 6)) * 8;
      const fill = cols[Math.floor(rnd() * cols.length)] ?? "#2F6BFF";
      const o = rr(0.08, 0.8);
      return {
        x: Math.round(rr(0, ARTBOARD.w) / 16) * 16,
        y: Math.round(rr(0, ARTBOARD.h) / 8) * 8,
        w,
        h,
        fill,
        o,
      };
    });
  }, []);
  return (
    <Layer fit="none">
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} fillOpacity={b.o} />
      ))}
    </Layer>
  );
}

function PixelSort() {
  const id = React.useId().replace(/:/g, "");
  const cols = React.useMemo(() => {
    const { rr } = seeded(52);
    const out: { x: number; top: number; h: number; o: number }[] = [];
    for (let x = 0; x < ARTBOARD.w; x += 8) {
      const top = rr(200, 520);
      const h = rr(120, 520);
      out.push({ x, top, h, o: rr(0.2, 0.9) });
    }
    return out;
  }, []);
  return (
    <Layer fit="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#EAF2FF" />
          <stop offset="0.4" stopColor="#4D96FF" stopOpacity={0.8} />
          <stop offset="1" stopColor="#1747C9" stopOpacity={0} />
        </linearGradient>
      </defs>
      {cols.map((c) => (
        <rect
          key={c.x}
          x={c.x}
          y={c.top}
          width={8}
          height={c.h}
          fill={`url(#${id})`}
          opacity={0.4 + c.o * 0.6}
        />
      ))}
    </Layer>
  );
}

const PILL_BRANDS: BrandName[] = [
  "github",
  "slack",
  "notion",
  "discord",
  "google-drive",
  "telegram",
  "linear",
  "confluence",
];

/* ---------- presets ---------- */

type Preset = {
  group: "Sky" | "Gradient blur" | "Grain" | "Glass" | "Glitch" | "Pattern";
  name: string;
  /** True when the background is dark, so content on it should use light text. */
  dark: boolean;
  base: string;
  render: () => React.ReactNode;
};

const PRESETS = {
  "sky-day": {
    group: "Sky",
    name: "Day",
    dark: false,
    base: SKY.day,
    render: () => (
      <>
        <Clouds mode="day" banks={[[0.8, 1.04, 8]]} wisps={6} seed={11} />
        <Grain opacity={0.05} />
      </>
    ),
  },
  "sky-dusk": {
    group: "Sky",
    name: "Dusk",
    dark: false,
    base: SKY.dusk,
    render: () => (
      <>
        <Glow x={900} y={520} w={700} h={260} color="#FFD6C2" opacity={0.6} blur={120} />
        <Clouds mode="dusk" banks={[[0.8, 1.04, 8]]} wisps={5} seed={12} />
        <Grain opacity={0.05} />
      </>
    ),
  },
  "sky-night": {
    group: "Sky",
    name: "Night",
    dark: true,
    base: SKY.night,
    render: () => (
      <>
        <Starfield count={380} height={630} seed={3} />
        <Glow x={1150} y={90} w={180} h={180} color="#EAF2FF" opacity={0.9} blur={30} />
        <Clouds mode="night" banks={[[0.84, 1.06, 8]]} wisps={3} seed={13} />
        <Grain opacity={0.06} />
      </>
    ),
  },
  "sky-above-the-clouds": {
    group: "Sky",
    name: "Above the clouds",
    dark: false,
    base: SKY.day,
    render: () => (
      <>
        <Glow x={520} y={-260} w={560} h={560} color="#FFFFFF" opacity={0.85} blur={140} />
        <Clouds
          mode="day"
          banks={[
            [0.55, 0.72, 6],
            [0.72, 1.04, 9],
          ]}
          seed={14}
        />
        <Grain opacity={0.04} />
      </>
    ),
  },
  "sky-cloud-frame": {
    group: "Sky",
    name: "Cloud frame",
    dark: false,
    base: lin(
      [
        [0, "#8EC7FF"],
        [1, "#DCEEFF"],
      ],
      90,
    ),
    render: () => (
      <>
        <Clouds
          mode="day"
          banks={[
            [0.0, 0.1, 6],
            [0.88, 1.06, 7],
          ]}
          seed={15}
        />
        <Grain opacity={0.05} />
      </>
    ),
  },
  "gradient-glacier": {
    group: "Gradient blur",
    name: "Glacier",
    dark: true,
    base: "#0D1017",
    render: () => (
      <>
        <MeshGradient colors={[...BL.glacier]} seed={1} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "gradient-ice": {
    group: "Gradient blur",
    name: "Ice",
    dark: false,
    base: "#F5F9FF",
    render: () => (
      <>
        <MeshGradient colors={[...BL.ice]} seed={2} />
        <Grain opacity={0.06} />
      </>
    ),
  },
  "gradient-signal": {
    group: "Gradient blur",
    name: "Signal",
    dark: true,
    base: "#1F55E6",
    render: () => (
      <>
        <MeshGradient colors={[...BL.signal]} seed={3} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "gradient-aurora": {
    group: "Gradient blur",
    name: "Aurora",
    dark: true,
    base: "#060B1C",
    render: () => (
      <>
        <MeshGradient colors={[...BL.aurora]} seed={4} blur={260} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "gradient-dawn": {
    group: "Gradient blur",
    name: "Dawn",
    dark: false,
    base: "#FBFCFF",
    render: () => (
      <>
        <MeshGradient colors={[...BL.dawn]} seed={5} />
        <Grain opacity={0.05} />
      </>
    ),
  },
  "gradient-deep": {
    group: "Gradient blur",
    name: "Deep",
    dark: true,
    base: "#050814",
    render: () => (
      <>
        <MeshGradient colors={[...BL.deep]} seed={6} blur={180} />
        <Grain opacity={0.12} />
      </>
    ),
  },
  "grain-spotlight": {
    group: "Grain",
    name: "Spotlight",
    dark: true,
    base: `${rad(
      [
        [0, "#4D96FF", 0.55],
        [0.6, "#1747C9", 0.12],
        [1, "#1747C9", 0],
      ],
      0.5,
      0,
      0.6,
      0.9,
    )}, #0B0E14`,
    render: () => <Grain opacity={0.18} />,
  },
  "grain-horizon": {
    group: "Grain",
    name: "Horizon",
    dark: true,
    base: "#07090F",
    render: () => (
      <>
        <Glow x={-200} y={560} w={2000} h={140} color="#2F6BFF" opacity={0.9} blur={90} />
        <Glow x={300} y={600} w={1000} h={40} color="#8EC0FF" opacity={0.9} blur={30} />
        <div
          aria-hidden
          style={{
            ...at(0, 628, ARTBOARD.w),
            height: u(1.5),
            background: lin(
              [
                [0, "#EAF2FF", 0],
                [0.5, "#EAF2FF", 1],
                [1, "#EAF2FF", 0],
              ],
              0,
            ),
          }}
        />
        <Grain opacity={0.16} />
      </>
    ),
  },
  "grain-duotone": {
    group: "Grain",
    name: "Duotone",
    dark: true,
    base: lin(
      [
        [0, "#1747C9"],
        [0.55, "#16191F"],
        [1, "#0A0B0D"],
      ],
      35,
    ),
    render: () => <Grain opacity={0.2} />,
  },
  "grain-paper": {
    group: "Grain",
    name: "Paper",
    dark: false,
    base: "#F6F8FC",
    render: () => (
      <>
        <DotGrid gap={24} radius={1.1} color="#1747C9" opacity={0.12} />
        <Glow x={900} y={-200} w={900} h={600} color="#BFD5FF" opacity={0.5} blur={200} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "glass-cards-dark": {
    group: "Glass",
    name: "Cards · Dark",
    dark: true,
    base: "#0B0E16",
    render: () => (
      <>
        <MeshGradient colors={[...BL.glacier]} seed={7} />
        <Glass x={220} y={200} w={520} h={420} dark>
          <MockUI dark />
        </Glass>
        <Glass x={820} y={300} w={560} h={360} dark>
          <MockUI dark />
        </Glass>
        <Mark x={1240} y={160} size={110} />
        <Grain opacity={0.08} />
      </>
    ),
  },
  "glass-cards-light": {
    group: "Glass",
    name: "Cards · Light",
    dark: false,
    base: "#EEF4FF",
    render: () => (
      <>
        <MeshGradient colors={[...BL.ice, "#4D96FF"]} seed={8} />
        <Glass x={220} y={200} w={520} h={420} dark={false}>
          <MockUI dark={false} />
        </Glass>
        <Glass x={820} y={300} w={560} h={360} dark={false}>
          <MockUI dark={false} />
        </Glass>
        <Grain opacity={0.05} />
      </>
    ),
  },
  "glass-panel": {
    group: "Glass",
    name: "Panel",
    dark: true,
    base: "#0A0D14",
    render: () => (
      <>
        <Glow x={500} y={150} w={600} h={600} color="#2F6BFF" opacity={1} blur={120} />
        <Glow x={800} y={300} w={380} h={380} color="#8EC0FF" opacity={0.9} blur={90} />
        <Glass x={400} y={160} w={800} h={580} dark radius={40} />
        <Mark x={670} y={320} size={260} />
        <Grain opacity={0.08} />
      </>
    ),
  },
  "glass-pills": {
    group: "Glass",
    name: "Pills",
    dark: false,
    base: "#F2F7FF",
    render: () => (
      <>
        <MeshGradient colors={["#8EC0FF", "#BFD5FF", "#C9AEFF", "#4D96FF"]} seed={9} />
        {PILL_BRANDS.map((k, i) => {
          const Logo = brandLogos[k];
          return (
            <Glass
              key={k}
              x={160 + (i % 4) * 340}
              y={220 + Math.floor(i / 4) * 260 + (i % 2) * 50}
              w={240}
              h={88}
              dark={false}
              radius={999}
            >
              <div className="flex h-full items-center" style={{ paddingInline: u(22) }}>
                <Logo variant="color" aria-hidden style={{ width: u(34), height: u(34) }} />
              </div>
            </Glass>
          );
        })}
        <Grain opacity={0.05} />
      </>
    ),
  },
  "glitch-rgb-split": {
    group: "Glitch",
    name: "RGB split",
    dark: true,
    base: "#05070D",
    render: () => (
      <>
        <GlitchWordmark />
        <Scanlines gap={4} color="#FFFFFF" opacity={0.05} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "glitch-scanlines": {
    group: "Glitch",
    name: "Scanlines",
    dark: true,
    base: "#070A12",
    render: () => (
      <>
        <Glow x={500} y={150} w={600} h={600} color="#1F55E6" opacity={0.8} blur={160} />
        <Mark x={540} y={190} size={520} />
        <GlitchBars />
        <Scanlines gap={3} color="#8EC0FF" opacity={0.08} />
        <Grain opacity={0.12} />
      </>
    ),
  },
  "glitch-datamosh": {
    group: "Glitch",
    name: "Datamosh",
    dark: true,
    base: "#0A0E1A",
    render: () => (
      <>
        <Datamosh />
        <Scanlines gap={4} color="#000000" opacity={0.25} />
        <Grain opacity={0.1} />
      </>
    ),
  },
  "glitch-pixel-sort": {
    group: "Glitch",
    name: "Pixel sort",
    dark: true,
    base: "#05070D",
    render: () => (
      <>
        <PixelSort />
        <Grain opacity={0.12} />
      </>
    ),
  },
  "pattern-dot-grid": {
    group: "Pattern",
    name: "Dot grid",
    dark: true,
    base: "#0B0E14",
    render: () => (
      <>
        <DotGrid />
        <Wash
          background={rad(
            [
              [0, "#0B0E14", 0],
              [1, "#0B0E14", 1],
            ],
            0.5,
            0.5,
            0.7,
            0.8,
          )}
        />
      </>
    ),
  },
  "pattern-line-grid": {
    group: "Pattern",
    name: "Line grid",
    dark: false,
    base: "#F7FAFF",
    render: () => (
      <>
        <LineGrid />
        <Wash
          background={rad(
            [
              [0, "#F7FAFF", 0],
              [1, "#F7FAFF", 1],
            ],
            0.5,
            0.45,
            0.6,
            0.7,
          )}
        />
      </>
    ),
  },
  "pattern-facet-tessellation": {
    group: "Pattern",
    name: "Facet tessellation",
    dark: true,
    base: "#0D1017",
    render: () => (
      <>
        <FacetTessellation />
        <Wash
          background={lin(
            [
              [0, "#0D1017", 0.1],
              [1, "#0D1017", 0.95],
            ],
            0,
          )}
        />
      </>
    ),
  },
  "pattern-topography": {
    group: "Pattern",
    name: "Topography",
    dark: true,
    base: "#0B0F1C",
    render: () => (
      <>
        <Topography />
        <Grain opacity={0.08} />
      </>
    ),
  },
  "pattern-character-field": {
    group: "Pattern",
    name: "Character field",
    dark: true,
    base: "#0A0B0D",
    render: () => (
      <>
        <CharacterField opacity={0.6} />
        <Wash
          background={lin(
            [
              [0, "#0A0B0D", 0.85],
              [0.5, "#0A0B0D", 0],
              [1, "#0A0B0D", 0.85],
            ],
            0,
          )}
        />
      </>
    ),
  },
  "pattern-halftone": {
    group: "Pattern",
    name: "Halftone",
    dark: true,
    base: `${rad(
      [
        [0, "#1F55E6", 0.4],
        [1, "#1F55E6", 0],
      ],
      1,
      0,
      0.9,
      1.1,
    )}, #0A0F1F`,
    render: () => <Halftone fit="none" />,
  },
  "pattern-perspective-grid": {
    group: "Pattern",
    name: "Perspective grid",
    dark: true,
    base: lin(
      [
        [0, "#050814"],
        [0.5, "#0E1D4A"],
        [1, "#050814"],
      ],
      90,
    ),
    render: () => (
      <>
        <Glow x={300} y={330} w={1000} h={200} color="#4D96FF" opacity={0.7} blur={100} />
        <PerspectiveGrid fit="none" />
        <Grain opacity={0.08} />
      </>
    ),
  },
  "pattern-beams": {
    group: "Pattern",
    name: "Beams",
    dark: true,
    base: "#05070D",
    render: () => (
      <>
        <Beams />
        <Grain opacity={0.12} />
      </>
    ),
  },
  "pattern-starfield": {
    group: "Pattern",
    name: "Starfield",
    dark: true,
    base: rad(
      [
        [0, "#14245C"],
        [1, "#03050C"],
      ],
      0.5,
      0.4,
      0.8,
      0.9,
    ),
    render: () => (
      <>
        <Starfield />
        <Grain opacity={0.06} />
      </>
    ),
  },
  "pattern-waves": {
    group: "Pattern",
    name: "Waves",
    dark: false,
    base: "#F5F9FF",
    render: () => <Waves fit="none" />,
  },
  "pattern-rings": {
    group: "Pattern",
    name: "Rings",
    dark: true,
    base: "#090C14",
    render: () => (
      <>
        <Rings fit="none" />
        <Glow x={650} y={300} w={300} h={300} color="#2F6BFF" opacity={0.8} blur={90} />
        <Mark x={730} y={380} size={140} />
      </>
    ),
  },
  "pattern-conic": {
    group: "Pattern",
    name: "Conic",
    dark: true,
    base: "conic-gradient(from 0deg at 50% 30%, #0A0F1F 0%, #1747C9 25%, #8EC0FF 50%, #1747C9 75%, #0A0F1F 100%)",
    render: () => <Grain opacity={0.12} />,
  },
} satisfies Record<string, Preset>;

export type BackgroundPreset = keyof typeof PRESETS;

/** Every preset with its group and name, in Figma order. */
export const backgrounds = (Object.keys(PRESETS) as BackgroundPreset[]).map((id) => {
  const { group, name, dark } = PRESETS[id];
  return { id, group, name, dark };
});

export const backgroundGroups = [
  [
    "Sky",
    "Billow-style volumetric clouds from stacked blurred ellipses. Day for light surfaces, Night for dark. Cloud frame leaves the centre clear for a CTA.",
  ],
  ["Gradient blur", "Soft colour fields from the brand palettes, blurred and finished with grain."],
  ["Grain", "Single light sources with heavy film grain, for covers and quotes."],
  ["Glass", "Frosted panels over colour, for product shots and integration grids."],
  ["Glitch", "Signal-error textures for launches and changelogs. Use sparingly."],
  ["Pattern", "Quiet geometric textures for sections, slides and OG images."],
] as const;

export type BackgroundProps = React.ComponentProps<"div"> & {
  preset: BackgroundPreset;
};

export function Background({ preset, className, style, children, ...props }: BackgroundProps) {
  const p = PRESETS[preset];
  return (
    <div
      data-slot="background"
      data-preset={preset}
      data-dark={p.dark || undefined}
      className={cn(
        "relative isolate overflow-hidden",
        p.dark ? "text-white" : "text-[#0F1A33]",
        className,
      )}
      style={style}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 aspect-video min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 [container-type:inline-size]"
        style={{ background: p.base }}
      >
        {p.render()}
      </div>
      {children}
    </div>
  );
}
