import * as React from "react";

import {
  Add01Icon,
  Alert02Icon,
  Cancel01Icon,
  InformationCircleIcon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { fitScale, IsoPaths, pascal, type IsoArt, type SvgProps } from "../art/iso-art";
import { cn } from "../lib/utils";
import { brandLogos, type BrandName } from "../logos/registry";

/*
 * Empty-state illustrations (Figma page 11): isometric objects on three stacked plates, with an
 * optional status badge or company chip on top. Light and dark artwork switch with the theme.
 */

export type IllustrationMeta = {
  name: string;
  /** Suggested empty-state title. */
  title: string;
  /** Suggested empty-state description. */
  description: string;
  /** Suggested action label. */
  action?: string;
};

type Badge = "ok" | "err" | "warn" | "info" | "spark" | "plus";
type Extra = readonly [kind: string, x: number, y: number];

const BADGES: Record<Badge, [color: string, icon: IconSvgElement]> = {
  ok: ["#17A865", Tick02Icon],
  err: ["#E5484D", Cancel01Icon],
  warn: ["#E8940C", Alert02Icon],
  info: ["#2F6BFF", InformationCircleIcon],
  spark: ["#2F6BFF", SparklesIcon],
  plus: ["#2F6BFF", Add01Icon],
};

/** Single-colour marks that are drawn in ink on light and white on dark, as in Figma. */
const MONO_BRANDS = new Set([
  "github",
  "x",
  "notion",
  "openai",
  "vercel",
  "anthropic",
  "ollama",
  "cursor",
  "model-context-protocol",
  "threads",
  "nextjs",
  "medium",
  "markdown",
  "rss",
]);

export type IllustrationProps = SvgProps & {
  /** auto follows the `.dark` class; light and dark force one artwork. */
  mode?: "auto" | "light" | "dark";
  /** Width in pixels. Height follows the artwork. Defaults to the Figma size (fits 280 × 200). */
  width?: number;
  /** Accessible label. Illustrations are decorative by default. */
  title?: string;
};

function Overlay({
  extra,
  art,
  scale,
  dark,
  id,
}: {
  extra: Extra;
  art: IsoArt;
  scale: number;
  dark: boolean;
  id: string;
}) {
  const [kind, fx, fy] = extra;
  const x = art.w * fx;
  const y = art.h * fy;
  if (kind in BADGES) {
    const [color, icon] = BADGES[kind as Badge];
    const r = 17 / scale;
    const iconSize = 19 / scale;
    return (
      <g filter={`url(#${id}-shadow)`}>
        <circle cx={x} cy={y} r={r + 3 / scale} fill={dark ? "#0D0F12" : "#FFFFFF"} />
        <circle cx={x} cy={y} r={r} fill={color} />
        <HugeiconsIcon
          icon={icon}
          x={x - iconSize / 2}
          y={y - iconSize / 2}
          size={iconSize}
          color="#FFFFFF"
          strokeWidth={2.2}
        />
      </g>
    );
  }
  const Logo = brandLogos[kind as BrandName];
  if (!Logo) {
    return null;
  }
  const s = 46 / scale;
  const logo = s * 0.56;
  return (
    <g filter={`url(#${id}-shadow)`}>
      <rect
        x={x - s / 2}
        y={y - s / 2}
        width={s}
        height={s}
        rx={s * 0.28}
        fill={dark ? "#1F232B" : "#FFFFFF"}
        stroke={dark ? "#2A303B" : "#E5E8ED"}
        strokeWidth={1 / scale}
      />
      <Logo
        variant={MONO_BRANDS.has(kind) ? "mono" : "color"}
        color={dark ? "#F5F8FF" : "#16191F"}
        x={x - logo / 2}
        y={y - logo / 2}
        size={logo}
        aria-hidden="true"
      />
    </g>
  );
}

function Artwork({
  art,
  extras,
  dark,
  width,
  title,
  className,
  ...props
}: SvgProps & {
  art: IsoArt;
  extras: readonly Extra[];
  dark: boolean;
  width?: number | undefined;
  title?: string | undefined;
}) {
  const id = React.useId().replace(/:/g, "");
  const scale = fitScale(art, 280, 200);
  const w = width ?? Math.round(art.w * scale);
  const h = Math.round((w / art.w) * art.h);
  return (
    <svg
      viewBox={`0 0 ${art.w} ${art.h}`}
      width={w}
      height={h}
      fill="none"
      overflow="visible"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-slot="illustration"
      className={cn("shrink-0 overflow-visible", className)}
      {...props}
    >
      <defs>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy={4 / scale}
            stdDeviation={6 / scale}
            floodColor="#16191F"
            floodOpacity={dark ? 0.4 : 0.14}
          />
        </filter>
      </defs>
      <IsoPaths art={art} />
      {extras.map((extra, i) => (
        <Overlay key={i} extra={extra} art={art} scale={scale} dark={dark} id={id} />
      ))}
    </svg>
  );
}

export type IllustrationComponent = ((props: IllustrationProps) => React.ReactNode) &
  Omit<IllustrationMeta, "name"> & {
    /** Display name from Figma, e.g. "No sources". */
    illustrationName: string;
    light: IsoArt;
    dark: IsoArt;
  };

export function createIllustration(
  meta: IllustrationMeta,
  light: IsoArt,
  dark: IsoArt,
  extras: readonly Extra[],
): IllustrationComponent {
  function Component({ mode = "auto", className, ...props }: IllustrationProps) {
    if (mode !== "auto") {
      return (
        <Artwork
          art={mode === "dark" ? dark : light}
          extras={extras}
          dark={mode === "dark"}
          className={className}
          {...props}
        />
      );
    }
    return (
      <>
        <Artwork
          art={light}
          extras={extras}
          dark={false}
          className={cn("dark:hidden", className)}
          {...props}
        />
        <Artwork
          art={dark}
          extras={extras}
          dark
          className={cn("hidden dark:block", className)}
          {...props}
        />
      </>
    );
  }
  Component.displayName = `${pascal(meta.name)}Illustration`;
  const { name, ...rest } = meta;
  return Object.assign(Component, rest, { illustrationName: name, light, dark });
}

/** Render any illustration component with the props shared by all of them. */
export function Illustration({
  of: Art,
  ...props
}: IllustrationProps & { of: IllustrationComponent }) {
  return <Art {...props} />;
}
