import type * as React from "react";

/**
 * Isometric artwork as path data: [d, fill, fillOpacity?, stroke?, strokeWidth?, strokeOpacity?].
 * Generated from the Figma brand kit, drawn on a true-isometric grid (30° axes).
 */
export type IsoPath = readonly [
  d: string,
  fill: string | null,
  fillOpacity?: number | null,
  stroke?: string | null,
  strokeWidth?: number | null,
  strokeOpacity?: number | null,
];

export type IsoArt = { readonly w: number; readonly h: number; readonly paths: readonly IsoPath[] };

/** The paths of one artwork, for use inside an <svg> whose viewBox is `0 0 w h`. */
export function IsoPaths({ art }: { art: IsoArt }) {
  return (
    <>
      {art.paths.map(([d, fill, fillOpacity, stroke, strokeWidth, strokeOpacity], i) => (
        <path
          key={i}
          d={d}
          fill={fill ?? "none"}
          fillOpacity={fillOpacity ?? undefined}
          stroke={stroke ?? undefined}
          strokeWidth={stroke ? (strokeWidth ?? 1.5) : undefined}
          strokeOpacity={strokeOpacity ?? undefined}
          strokeLinejoin={stroke ? "round" : undefined}
          strokeLinecap={stroke ? "round" : undefined}
        />
      ))}
    </>
  );
}

/** Fits an artwork's natural size into the Figma display box (280 × 200 for illustrations). */
export function fitScale(art: IsoArt, maxW: number, maxH: number, maxScale = 1) {
  return Math.min(maxScale, maxH / art.h, maxW / art.w);
}

export type SvgProps = Omit<React.ComponentProps<"svg">, "children" | "viewBox">;

/** "No API keys" -> "NoAPIKeys": the export name the generator gives each piece of art. */
export function pascal(name: string) {
  return name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join("");
}
