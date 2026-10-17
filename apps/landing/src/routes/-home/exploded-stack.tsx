import * as React from "react";

import type { BrandName } from "@usepreface/ui/logos/registry";

import { useScrollProgress } from "./motion";
import { GlassTile } from "./primitives";

/*
 * Figma "How it works" art: five isometric plates, one per pipeline stage, drawn with the
 * same projection as the brand objects. Motion note: layers separate on scroll, 24 px each.
 * Colours come from CSS variables so the art follows the theme without re-rendering.
 */

type Point = readonly [x: number, y: number, z: number];
type Shape = { pts: Point[]; fill: string; opacity?: number; stroke?: boolean };

const C30 = 0.8660254;
const S30 = 0.5;
const iso = ([x, y, z]: Point) => [(x - y) * C30, (x + y) * S30 - z] as const;

const SIZE = 320;
const DEPTH = 10;
const LEVELS = [0, 90, 180, 270, 360] as const;
const LABELS = ["Connect", "Parse", "Index", "Retrieve", "Answer"] as const;

const plate = (z: number): Shape[] => [
  {
    pts: [
      [0, SIZE, z],
      [SIZE, SIZE, z],
      [SIZE, SIZE, z + DEPTH],
      [0, SIZE, z + DEPTH],
    ],
    fill: "var(--iso-left)",
    stroke: true,
  },
  {
    pts: [
      [SIZE, 0, z],
      [SIZE, SIZE, z],
      [SIZE, SIZE, z + DEPTH],
      [SIZE, 0, z + DEPTH],
    ],
    fill: "var(--iso-right)",
    stroke: true,
  },
  {
    pts: [
      [0, 0, z + DEPTH],
      [SIZE, 0, z + DEPTH],
      [SIZE, SIZE, z + DEPTH],
      [0, SIZE, z + DEPTH],
    ],
    fill: "var(--iso-top)",
    stroke: true,
  },
];

const rect = (
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  fill: string,
  opacity: number,
) =>
  ({
    pts: [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + d, z],
      [x, y + d, z],
    ],
    fill,
    opacity,
  }) satisfies Shape;

const ACCENT = "var(--iso-accent)";
const DETAIL = "var(--iso-detail)";

/** What is printed on each plate: tiles, text lines, a vector cloud, ranked rows, an answer. */
function details(i: number, z: number): Shape[] {
  const out: Shape[] = [];
  if (i === 0) {
    for (let k = 0; k < 4; k++) {
      for (let j = 0; j < 4; j++) {
        const hot = k + j === 3;
        out.push(rect(30 + k * 70, 30 + j * 70, z, 50, 50, hot ? ACCENT : DETAIL, hot ? 1 : 0.25));
      }
    }
  } else if (i === 1) {
    for (let k = 0; k < 8; k++) {
      out.push(rect(30, 30 + k * 34, z, 140 + ((k * 37) % 120), 10, DETAIL, 0.45));
    }
  } else if (i === 2) {
    for (let k = 0; k < 14; k++) {
      for (let j = 0; j < 14; j++) {
        if ((k * 7 + j * 3) % 5 === 0) {
          out.push(rect(20 + k * 20, 20 + j * 20, z, 8, 8, (k + j) % 7 ? DETAIL : ACCENT, 0.6));
        }
      }
    }
  } else if (i === 3) {
    out.push(rect(40, 40, z, 240, 40, ACCENT, 0.9));
    for (let k = 0; k < 4; k++) {
      out.push(rect(40, 100 + k * 46, z, 240 - k * 40, 30, DETAIL, 0.3));
    }
  } else {
    out.push(rect(30, 30, z, 260, 120, DETAIL, 0.2));
    out.push(rect(30, 170, z, 160, 24, ACCENT, 0.9));
    out.push(rect(30, 210, z, 220, 12, DETAIL, 0.45));
    out.push(rect(30, 236, z, 180, 12, DETAIL, 0.45));
  }
  return out;
}

// Projection bounds for the whole stack, so every layer shares one coordinate system.
const SCALE = 0.82;
const PAD = 6;
const MIN_X = -SIZE * C30;
const MIN_Y = -(LEVELS[4] + DEPTH);
const OFFSET_X = 40;
const OFFSET_Y = 110;
const VIEW_W = 760;
const VIEW_H = 760;

function project(p: Point) {
  const [X, Y] = iso(p);
  return [(X - MIN_X + PAD) * SCALE + OFFSET_X, (Y - MIN_Y + PAD) * SCALE + OFFSET_Y] as const;
}

const path = (pts: Point[]) => {
  const d = pts.map((p, k) => {
    const [x, y] = project(p);
    return `${k ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${d.join("")}Z`;
};

const layers = LEVELS.map((z, i) => {
  const shapes = [...plate(z), ...details(i, z + DEPTH + 0.01)];
  const [lx, ly] = project([SIZE, 0, z + 5]);
  return { i, shapes, label: LABELS[i] ?? "", anchor: [lx, ly] as const };
});

// Source tiles hover beside the bottom plates, where content comes in.
const chips: { brand: BrandName; at: Point }[] = (
  ["github", "slack", "notion", "google-drive"] as const
).map((brand, i) => ({ brand, at: [-30, 60 + i * 70, 10] }));

export function ExplodedStack() {
  const ref = React.useRef<HTMLDivElement>(null);
  useScrollProgress(ref);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full [--iso-accent:#2f6bff] [--iso-detail:#98a1b0] [--iso-left:#f1f3f6] [--iso-line:#3a414d] [--iso-right:#e2e6ec] [--iso-top:#ffffff] dark:[--iso-accent:#5c97ff] dark:[--iso-detail:#525b6a] dark:[--iso-left:#16191f] dark:[--iso-line:#98a1b0] dark:[--iso-right:#121418] dark:[--iso-top:#1f232b] [--progress:0.5]"
      style={
        {
          // 0 → 24 px of extra separation per layer as the stack crosses the viewport.
          "--sep": "calc(clamp(0, (var(--progress) - 0.2) * 2.6, 1) * 24px)",
          aspectRatio: `${VIEW_W} / ${VIEW_H}`,
        } as React.CSSProperties
      }
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="absolute inset-0 size-full overflow-visible"
      >
        {layers.map((layer) => (
          <g
            key={layer.label}
            className="transition-transform duration-150 ease-out"
            style={{ transform: `translateY(calc(var(--sep) * ${-layer.i}))` }}
          >
            {layer.shapes.map((s, k) => (
              <path
                key={k}
                d={path(s.pts)}
                fill={s.fill}
                fillOpacity={s.opacity}
                stroke={s.stroke ? "var(--iso-line)" : undefined}
                strokeWidth={s.stroke ? 1.1 : undefined}
                strokeLinejoin="round"
              />
            ))}
            <path
              d={`M${layer.anchor[0] + 8} ${layer.anchor[1]}h120`}
              stroke="var(--color-primary)"
              strokeOpacity={0.5}
            />
            <circle
              cx={layer.anchor[0] + 8}
              cy={layer.anchor[1]}
              r={4}
              fill="var(--color-primary)"
            />
            <text
              x={layer.anchor[0] + 136}
              y={layer.anchor[1] + 4}
              fill="currentColor"
              className="fill-foreground font-mono text-xs font-medium tracking-[0.08em] uppercase"
            >
              {layer.label}
            </text>
          </g>
        ))}
      </svg>
      {chips.map(({ brand, at }, i) => {
        const [x, y] = project(at);
        return (
          <GlassTile
            key={brand}
            brand={brand}
            size={52}
            className="landing-float absolute max-sm:scale-75"
            style={
              {
                left: `${((x - 60) / VIEW_W) * 100}%`,
                top: `${((y - 20) / VIEW_H) * 100}%`,
                "--delay": `${-i * 1.1}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
