import * as React from "react";

import { cn } from "../lib/utils";

/*
 * Patterns and textures from Figma page 09 (Textures) and 45 (Backgrounds), as React.
 * Every pattern draws into a 1600 × 900 artboard that covers its positioned parent
 * (`relative` + `overflow-hidden` on the parent). Random patterns use the same seeded
 * generator as the Figma plugin, so the same seed gives the same picture.
 */

export const ARTBOARD = { w: 1600, h: 900 } as const;

/** Park–Miller generator used by the Figma builds. */
export function seeded(seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return { rnd, rr: (a: number, b: number) => a + rnd() * (b - a) };
}

export type PatternProps = Omit<React.ComponentProps<"svg">, "children" | "viewBox"> & {
  /** Any CSS colour. Defaults suit dark brand surfaces. */
  color?: string;
  opacity?: number;
  seed?: number;
  /** How the artboard fills a box that is not 16:9. Defaults to cover. */
  fit?: "slice" | "meet" | "none";
};

/** Full-bleed SVG layer on the 1600 × 900 artboard. */
export function Layer({
  className,
  children,
  fit = "slice",
  ...props
}: React.ComponentProps<"svg"> & { fit?: "slice" | "meet" | "none" }) {
  return (
    <svg
      viewBox={`0 0 ${ARTBOARD.w} ${ARTBOARD.h}`}
      preserveAspectRatio={fit === "none" ? "none" : `xMidYMid ${fit}`}
      aria-hidden="true"
      data-slot="pattern"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

function useFilterId() {
  return React.useId().replace(/:/g, "");
}

/* ---------- grids ---------- */

type TextureProps = Omit<React.ComponentProps<"div">, "color"> & {
  color?: string;
  opacity?: number;
};

function Texture({
  className,
  style,
  background,
  size,
  ...props
}: Omit<TextureProps, "color" | "opacity"> & { background: string; size: string }) {
  return (
    <div
      aria-hidden="true"
      data-slot="pattern"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{ backgroundImage: background, backgroundSize: size, ...style }}
      {...props}
    />
  );
}

function rgba(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;
}

/** Dot grid. Sizes are CSS pixels, so the texture stays crisp at any box size. */
export function DotGrid({
  color = "#8EC0FF",
  opacity = 0.35,
  gap = 28,
  radius = 1.3,
  ...props
}: TextureProps & { gap?: number; radius?: number }) {
  return (
    <Texture
      background={`radial-gradient(circle at center, ${rgba(color, opacity)} ${radius}px, transparent ${radius + 0.6}px)`}
      size={`${gap}px ${gap}px`}
      {...props}
    />
  );
}

/** Square line grid in CSS pixels. */
export function LineGrid({
  color = "#1747C9",
  opacity = 0.12,
  gap = 48,
  ...props
}: TextureProps & { gap?: number }) {
  const c = rgba(color, opacity);
  return (
    <Texture
      background={`linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px)`}
      size={`${gap}px ${gap}px`}
      {...props}
    />
  );
}

/** Horizontal scanlines in CSS pixels. */
export function Scanlines({
  color = "#FFFFFF",
  opacity = 0.05,
  gap = 4,
  ...props
}: TextureProps & { gap?: number }) {
  return (
    <Texture
      background={`linear-gradient(to bottom, ${rgba(color, opacity)} 1px, transparent 1px)`}
      size={`100% ${gap}px`}
      {...props}
    />
  );
}

export function PerspectiveGrid({
  color = "#8EC0FF",
  opacity = 0.4,
  horizon = 450,
  ...props
}: PatternProps & { horizon?: number }) {
  const { w, h } = ARTBOARD;
  const d = React.useMemo(() => {
    let s = "";
    const vx = w / 2;
    for (let i = -24; i <= 24; i++) s += `M${vx} ${horizon}L${vx + (i * w) / 10} ${h}`;
    for (let k = 1; k < 18; k++) {
      const y = horizon + (h - horizon) * Math.pow(k / 18, 2.2);
      s += `M0 ${y.toFixed(1)}H${w}`;
    }
    return s;
  }, [horizon, h, w]);
  return (
    <Layer {...props}>
      <path d={d} stroke={color} strokeOpacity={opacity} vectorEffect="non-scaling-stroke" />
    </Layer>
  );
}

/* ---------- line art ---------- */

export function Topography({
  color = "#8EC0FF",
  opacity = 0.55,
  seed = 7,
  lines = 26,
  cx = 1050,
  cy = 420,
  ...props
}: PatternProps & { lines?: number; cx?: number; cy?: number }) {
  const { w, h } = ARTBOARD;
  const rings = React.useMemo(() => {
    const { rr } = seeded(seed);
    const k = [rr(2, 4), rr(3, 6), rr(5, 8)] as const;
    const ph = [rr(0, 6), rr(0, 6), rr(0, 6)] as const;
    const out: { d: string; o: number }[] = [];
    for (let i = 1; i <= lines; i++) {
      const R = ((i * Math.max(w, h)) / lines) * 0.75;
      let d = "";
      for (let j = 0; j <= 120; j++) {
        const a = (j / 120) * Math.PI * 2;
        const r2 =
          R *
          (1 +
            0.08 * Math.sin(k[0] * a + ph[0]) +
            0.05 * Math.sin(k[1] * a + ph[1] + i * 0.3) +
            0.03 * Math.sin(k[2] * a + ph[2]));
        d += `${(j ? "L" : "M") + (cx + r2 * Math.cos(a)).toFixed(1)} ${(
          cy +
          r2 * 0.62 * Math.sin(a)
        ).toFixed(1)}`;
      }
      out.push({ d: `${d}Z`, o: 1 - i / (lines + 2) });
    }
    return out;
  }, [seed, lines, cx, cy, w, h]);
  return (
    <Layer {...props}>
      {rings.map((r, i) => (
        <path
          key={i}
          d={r.d}
          stroke={color}
          strokeOpacity={opacity * r.o}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </Layer>
  );
}

export function Waves({
  color = "#1747C9",
  opacity = 0.45,
  lines = 34,
  amplitude = 60,
  ...props
}: PatternProps & { lines?: number; amplitude?: number }) {
  const { w, h } = ARTBOARD;
  const paths = React.useMemo(() => {
    const out: { d: string; o: number }[] = [];
    for (let i = 0; i < lines; i++) {
      let d = "";
      const y0 = h * (0.2 + (0.6 * i) / lines);
      const A = amplitude * (0.6 + i / lines);
      const f = ((2 * Math.PI) / w) * (1.2 + i * 0.05);
      for (let x = 0; x <= w; x += 8)
        d += `${(x ? "L" : "M") + x} ${(y0 + A * Math.sin(f * x + i * 0.35)).toFixed(1)}`;
      out.push({ d, o: 0.4 + (0.6 * i) / lines });
    }
    return out;
  }, [lines, amplitude, w, h]);
  return (
    <Layer {...props}>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={color}
          strokeOpacity={opacity * p.o}
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </Layer>
  );
}

export function Rings({
  color = "#8EC0FF",
  opacity = 0.5,
  count = 22,
  cx = 800,
  cy = 450,
  ...props
}: PatternProps & { count?: number; cx?: number; cy?: number }) {
  const R = ARTBOARD.w / count / 1.4;
  return (
    <Layer {...props}>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={(i + 1) * R}
          fill="none"
          stroke={color}
          strokeOpacity={opacity * (1 - (i + 1) / (count + 1))}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </Layer>
  );
}

export function Starfield({
  color = "#EAF2FF",
  count = 700,
  seed = 5,
  height = 900,
  ...props
}: PatternProps & { count?: number; height?: number }) {
  const stars = React.useMemo(() => {
    const { rr } = seeded(seed);
    return Array.from(
      { length: count },
      () => [rr(0, ARTBOARD.w), rr(0, height), rr(0.4, 1.6), rr(0.2, 0.95)] as const,
    );
  }, [seed, count, height]);
  return (
    <Layer {...props}>
      {stars.map(([x, y, r, o], i) => (
        <circle
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={r.toFixed(2)}
          fill={color}
          fillOpacity={o.toFixed(2)}
        />
      ))}
    </Layer>
  );
}

export function FacetTessellation({
  colors = ["#4D96FF", "#8EC0FF", "#2F6BFF"],
  size = 80,
  seed = 6,
  ...props
}: PatternProps & { colors?: string[]; size?: number }) {
  const tris = React.useMemo(() => {
    const { rnd, rr } = seeded(seed);
    const hgt = size * 0.866;
    const out: [string, string, number][] = [];
    for (let r = 0; r * hgt < ARTBOARD.h + hgt; r++) {
      for (let c = -1; c * size < ARTBOARD.w + size; c++) {
        const x = c * size + (r % 2 ? size / 2 : 0);
        const y = r * hgt;
        const col = colors[Math.floor(rnd() * colors.length)] ?? "#4D96FF";
        out.push([`M${x} ${y}L${x + size} ${y}L${x + size / 2} ${y + hgt}Z`, col, rr(0.04, 0.5)]);
        out.push([
          `M${x + size / 2} ${y + hgt}L${x + size * 1.5} ${y + hgt}L${x + size} ${y}Z`,
          col,
          rr(0.02, 0.35),
        ]);
      }
    }
    return out;
  }, [colors, size, seed]);
  return (
    <Layer {...props}>
      {tris.map(([d, c, o], i) => (
        <path key={i} d={d} fill={c} fillOpacity={o.toFixed(2)} />
      ))}
    </Layer>
  );
}

/** Ordered (Bayer 4×4) dither that fades with distance from a corner, as on the brand covers. */
export function Halftone({
  color = "#4D96FF",
  opacity = 0.9,
  step = 14,
  dot = 4,
  focus = [ARTBOARD.w, 0],
  reach = 1500,
  ...props
}: PatternProps & {
  step?: number;
  dot?: number;
  focus?: readonly [number, number];
  reach?: number;
}) {
  const [ox, oy] = focus;
  const d = React.useMemo(() => {
    const B = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    let s = "";
    for (let y = 0; y < ARTBOARD.h; y += step) {
      for (let x = 0; x < ARTBOARD.w; x += step) {
        const keep = 1 - Math.hypot(x - ox, y - oy) / reach;
        const th = ((B[Math.round(y / step) % 4]?.[Math.round(x / step) % 4] ?? 0) + 0.5) / 16;
        if (keep > th) s += `M${x} ${y}h${dot}v${dot}h-${dot}z`;
      }
    }
    return s;
  }, [step, dot, ox, oy, reach]);
  return (
    <Layer {...props}>
      <path d={d} fill={color} fillOpacity={opacity} />
    </Layer>
  );
}

/** Isometric lattice: two 30° families and verticals, hairlines at any scale. */
export function IsoLattice({
  color = "#8EC0FF",
  opacity = 0.26,
  step = 64,
  ...props
}: PatternProps & { step?: number }) {
  const { w, h } = ARTBOARD;
  const d = React.useMemo(() => {
    const t = Math.tan(Math.PI / 6);
    let s = "";
    for (let c = -h / t; c < w + h / t; c += step / t) {
      s += `M${c.toFixed(1)} 0L${(c + h / t).toFixed(1)} ${h}`;
      s += `M${(c + h / t).toFixed(1)} 0L${c.toFixed(1)} ${h}`;
    }
    for (let x = 0; x <= w; x += step / t) s += `M${x.toFixed(1)} 0V${h}`;
    return s;
  }, [step, w, h]);
  return (
    <Layer fit="none" {...props}>
      <path d={d} stroke={color} strokeOpacity={opacity} vectorEffect="non-scaling-stroke" />
    </Layer>
  );
}

/** Monospace glyph field, the "knowledge field" texture behind marketing headlines. */
export function CharacterField({
  color = "#8EC0FF",
  opacity = 0.5,
  seed = 21,
  threshold = 0.2,
  glyphs = "[1]{}#/:;.·+=<>*~",
  fontSize = 14,
  lineHeight = 20,
  cellWidth = 16,
  ...props
}: PatternProps & {
  threshold?: number;
  glyphs?: string;
  fontSize?: number;
  lineHeight?: number;
  cellWidth?: number;
}) {
  const lines = React.useMemo(() => {
    const { rnd, rr } = seeded(seed);
    const g = glyphs.split("");
    const cols = Math.floor(ARTBOARD.w / cellWidth);
    const rows = Math.floor(ARTBOARD.h / lineHeight);
    const out: string[] = [];
    for (let r = 0; r < rows; r++) {
      let line = "";
      for (let c = 0; c < cols; c++) {
        const v = Math.sin(c * 0.12 + r * 0.2) + Math.sin(c * 0.05 - r * 0.11) + rr(-0.6, 0.6);
        line += v > threshold ? (g[Math.floor(rnd() * g.length)] ?? ".") : " ";
      }
      out.push(line);
    }
    return out;
  }, [seed, threshold, glyphs, cellWidth, lineHeight]);
  return (
    <Layer {...props}>
      <g
        fill={color}
        fillOpacity={opacity}
        fontFamily="var(--font-mono)"
        fontSize={fontSize}
        style={{ whiteSpace: "pre" }}
      >
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={(i + 1) * lineHeight - 5}
            textLength={line.length * cellWidth}
            xmlSpace="preserve"
          >
            {line}
          </text>
        ))}
      </g>
    </Layer>
  );
}

/* ---------- light and texture ---------- */

/** Film grain. Put it last so it sits on top. */
export function Grain({
  opacity = 0.1,
  frequency = 0.9,
  blend = "overlay",
  ...props
}: PatternProps & { frequency?: number; blend?: React.CSSProperties["mixBlendMode"] }) {
  const id = useFilterId();
  return (
    <Layer fit="none" style={{ mixBlendMode: blend, opacity }} {...props}>
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={frequency}
          numOctaves={3}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </Layer>
  );
}

/** A soft blurred ellipse. Coordinates are on the 1600 × 900 artboard. */
export function Glow({
  x,
  y,
  w,
  h,
  color,
  opacity = 1,
  blur = 120,
  ...props
}: Omit<PatternProps, "color"> & {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  blur?: number;
}) {
  const id = useFilterId();
  return (
    <Layer {...props}>
      <filter id={id} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation={blur / 2} />
      </filter>
      <ellipse
        cx={x + w / 2}
        cy={y + h / 2}
        rx={w / 2}
        ry={h / 2}
        fill={color}
        fillOpacity={opacity}
        filter={`url(#${id})`}
      />
    </Layer>
  );
}

/** Oversized blurred colour fields, finished with grain in the presets. Five hues at most. */
export function MeshGradient({
  colors,
  seed = 5,
  blur = 220,
  ...props
}: Omit<PatternProps, "color"> & { colors: string[]; blur?: number }) {
  const id = useFilterId();
  const blobs = React.useMemo(() => {
    const { rr } = seeded(seed);
    return colors.map((c) => {
      const R = rr(500, 900);
      const w = R * rr(1, 1.6);
      return {
        c,
        x: rr(-0.2, 0.9) * ARTBOARD.w,
        y: rr(-0.3, 0.8) * ARTBOARD.h,
        w,
        h: R,
        o: rr(0.6, 1),
      };
    });
  }, [colors, seed]);
  return (
    <Layer {...props}>
      <filter id={id} x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation={blur / 2} />
      </filter>
      <g filter={`url(#${id})`}>
        {blobs.map((b, i) => (
          <ellipse
            key={i}
            cx={b.x + b.w / 2}
            cy={b.y + b.h / 2}
            rx={b.w / 2}
            ry={b.h / 2}
            fill={b.c}
            fillOpacity={b.o}
          />
        ))}
      </g>
    </Layer>
  );
}

/** Diagonal light beams. */
export function Beams({
  beams = [
    [200, -200, 260, 1400, 24, "#4D96FF", 0.6, 40],
    [700, -200, 140, 1400, 18, "#8EC0FF", 0.5, 30],
    [1100, -200, 220, 1400, 28, "#2F6BFF", 0.5, 50],
  ],
  ...props
}: Omit<PatternProps, "color"> & {
  beams?: [
    x: number,
    y: number,
    w: number,
    h: number,
    rotate: number,
    color: string,
    opacity: number,
    blur: number,
  ][];
}) {
  const id = useFilterId();
  return (
    <Layer {...props}>
      <defs>
        {beams.map(([, , , , , color, op, blur], i) => (
          <React.Fragment key={i}>
            <linearGradient id={`${id}-g${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={color} stopOpacity={0} />
              <stop offset="0.5" stopColor={color} stopOpacity={op} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id={`${id}-f${i}`} x="-50%" y="-10%" width="200%" height="120%">
              <feGaussianBlur stdDeviation={blur / 2} />
            </filter>
          </React.Fragment>
        ))}
      </defs>
      {beams.map(([x, y, w, h, rot], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={`url(#${id}-g${i})`}
          filter={`url(#${id}-f${i})`}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ))}
    </Layer>
  );
}

const CLOUD_TONES = {
  day: { hi: "#FFFFFF", mid: "#F3F8FF", lo: "#D9E8FB", sh: "#B9D2F2", op: 1, bm: 1.3 },
  dusk: { hi: "#FBF4F4", mid: "#ECE6F4", lo: "#CDD3EF", sh: "#A9B4E2", op: 1, bm: 1.9 },
  night: { hi: "#3E5594", mid: "#2E447F", lo: "#22356A", sh: "#141F45", op: 0.7, bm: 1.9 },
} as const;

export type CloudMode = keyof typeof CLOUD_TONES;

/**
 * Billow-style cumulus banks from stacked blurred ellipses.
 * `banks`: [top, bottom, count] as fractions of the height.
 */
export function Clouds({
  mode = "day",
  banks = [[0.78, 1.04, 7]],
  wisps = 0,
  seed = 11,
  ...props
}: Omit<PatternProps, "color"> & {
  mode?: CloudMode;
  banks?: [number, number, number][];
  wisps?: number;
}) {
  const id = useFilterId();
  const C = CLOUD_TONES[mode];
  const layers = React.useMemo(() => {
    const { rr } = seeded(seed);
    const { w, h } = ARTBOARD;
    type E = [cx: number, cy: number, rx: number, ry: number, o: number];
    const wisp: E[] = [];
    const sh: E[] = [];
    const lo: E[] = [];
    const mid: E[] = [];
    const hi: E[] = [];
    const add = (arr: E[], x: number, y: number, ew: number, eh: number, o: number) =>
      arr.push([x + ew / 2, y + eh / 2, ew / 2, eh / 2, o]);
    for (let i = 0; i < wisps; i++) {
      const x = rr(-0.1, 0.9) * w;
      const y = rr(0.05, 0.4) * h;
      const ew = rr(260, 620);
      const eh = rr(14, 34);
      add(wisp, x, y, ew, eh, rr(0.35, 0.7) * C.op);
      rr(14, 26);
    }
    for (const [ya, yb, n] of banks) {
      const cl: [number, number, number][] = [];
      for (let i = 0; i < n; i++) cl.push([rr(-0.08, 1.08) * w, rr(ya, yb) * h, rr(160, 280)]);
      for (const [cx, cy, R] of cl)
        add(sh, cx - R * 1.6, cy - R * 0.1, R * 3.2, R * 0.9, 0.7 * C.op);
      for (const [cx, cy, R] of cl)
        for (let k = 0; k < 9; k++) {
          const r = rr(0.35, 0.6) * R;
          add(lo, cx + rr(-1.3, 1.3) * R - r, cy + rr(-0.15, 0.25) * R - r, r * 2.2, r * 1.7, C.op);
          rr(18, 30);
        }
      for (const [cx, cy, R] of cl)
        for (let k = 0; k < 11; k++) {
          const r = rr(0.3, 0.55) * R;
          add(mid, cx + rr(-1.1, 1.1) * R - r, cy + rr(-0.6, -0.05) * R - r, r * 2, r * 1.8, C.op);
          rr(12, 24);
        }
      for (const [cx, cy, R] of cl)
        for (let k = 0; k < 9; k++) {
          const r = rr(0.18, 0.38) * R;
          add(hi, cx + rr(-0.9, 0.8) * R - r, cy + rr(-0.95, -0.45) * R - r, r * 2, r * 1.9, C.op);
          rr(8, 16);
        }
    }
    return [
      { fill: C.hi, blur: 10, items: wisp },
      { fill: C.sh, blur: 23, items: sh },
      { fill: C.lo, blur: 12 * C.bm, items: lo },
      { fill: C.mid, blur: 9 * C.bm, items: mid },
      { fill: C.hi, blur: 6 * C.bm, items: hi },
    ];
  }, [seed, wisps, banks, C]);
  return (
    <Layer {...props}>
      <defs>
        {layers.map((l, i) => (
          <filter key={i} id={`${id}-${i}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={l.blur} />
          </filter>
        ))}
      </defs>
      {layers.map((l, i) => (
        <g key={i} filter={`url(#${id}-${i})`} fill={l.fill}>
          {l.items.map(([cx, cy, rx, ry, o], k) => (
            <ellipse key={k} cx={cx} cy={cy} rx={rx} ry={ry} fillOpacity={o} />
          ))}
        </g>
      ))}
    </Layer>
  );
}

export const SKY = {
  day: "linear-gradient(180deg, #5AA2F5 0%, #A9D0FF 55%, #EEF6FF 100%)",
  dusk: "linear-gradient(180deg, #5F8BE8 0%, #A9C3F5 50%, #F2E9F2 100%)",
  night: "linear-gradient(180deg, #050A1F 0%, #0E1B4D 55%, #1D3477 100%)",
} as const;

/** Frosted panel: background blur, light gradient fill and a gradient hairline. */
export function GlassPanel({
  dark = true,
  radius = 24,
  className,
  style,
  ...props
}: React.ComponentProps<"div"> & { dark?: boolean; radius?: number }) {
  return (
    <div
      data-slot="glass-panel"
      className={cn("relative overflow-hidden backdrop-blur-[36px]", className)}
      style={{
        borderRadius: radius,
        background: `linear-gradient(120deg, rgb(255 255 255 / ${dark ? 0.14 : 0.55}), rgb(255 255 255 / ${dark ? 0.04 : 0.22}))`,
        boxShadow: `inset 0 0 0 1.2px rgb(255 255 255 / ${dark ? 0.16 : 0.6}), 0 24px 60px ${dark ? "rgb(0 0 0 / 0.45)" : "rgb(23 71 201 / 0.14)"}`,
        ...style,
      }}
      {...props}
    />
  );
}
