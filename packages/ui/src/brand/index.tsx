/*
 * Preface brand marks, matching Figma pages 02 Logo and 04 App icons.
 *
 *   <PrefaceMark />                  Facet mark, follows the theme (deep on light, ice on dark)
 *   <PrefaceLogo />                  Horizontal lockup: mark + "Preface" wordmark
 *   <PrefaceLogo layout="stacked" />
 *   <PrefaceAppIcon skin="glacier" />
 */
import * as React from "react";

import { cn } from "../lib/utils";

/** Six facets on a 48 grid, top-centre clockwise, with their base opacities. */
const FACETS: ReadonlyArray<readonly [d: string, opacity: number]> = [
  ["M24.57 23.02L24.57 10.98L34.99 17Z", 1],
  ["M25.13 24L35.55 17.98L35.55 30.02Z", 0.8],
  ["M24.57 24.98L34.99 31L24.57 37.02Z", 0.62],
  ["M23.43 24.98L13.01 31L23.43 37.02Z", 0.45],
  ["M22.87 24L12.45 17.98L12.45 30.02Z", 0.62],
  ["M23.43 23.02L23.43 10.98L13.01 17Z", 0.8],
];

const GRADIENTS = {
  ice: ["#EAF2FF", "#4D96FF"],
  deep: ["#5C97FF", "#1747C9"],
} as const;

export type MarkTone = "auto" | "ice" | "deep" | "white" | "ink" | "current";

type MarkProps = Omit<React.ComponentProps<"svg">, "ref"> & {
  /** auto = deep on light, ice on dark. current = solid currentColor. */
  tone?: MarkTone;
  /** Height in pixels. The cropped mark is 24 × 27 on the grid. */
  size?: number;
  /** Show the full 48px safe area instead of cropping to the hexagon. */
  padded?: boolean;
  /** Raise facet contrast for very small sizes (≤ 20px), as the favicon does. */
  compact?: boolean;
  title?: string;
};

function MarkSvg({
  tone,
  size = 24,
  padded = false,
  compact = false,
  title = "Preface",
  className,
  ...props
}: Omit<MarkProps, "tone"> & { tone: Exclude<MarkTone, "auto"> }) {
  const id = React.useId().replace(/:/g, "");
  const viewBox = padded ? "0 0 48 48" : "12 10.5 24 27";
  const width = padded ? size : Math.round((size * 24) / 27);
  const gradient = tone === "ice" || tone === "deep" ? GRADIENTS[tone] : null;
  const fill = gradient
    ? `url(#${id}-g)`
    : tone === "white"
      ? "#FFFFFF"
      : tone === "ink"
        ? "#16191F"
        : "currentColor";
  const opacities = compact ? [1, 0.85, 0.7, 0.55, 0.7, 0.85] : FACETS.map(([, o]) => o);
  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={size}
      fill="none"
      role="img"
      aria-label={title}
      data-slot="preface-mark"
      className={cn("shrink-0", className)}
      {...props}
    >
      <title>{title}</title>
      {gradient ? (
        <defs>
          <linearGradient
            id={`${id}-g`}
            x1="12"
            y1="10"
            x2="36"
            y2="38"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={gradient[0]} />
            <stop offset="1" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
      ) : null}
      {FACETS.map(([d], i) => (
        <path key={d} d={d} fill={fill} fillOpacity={opacities[i]} />
      ))}
    </svg>
  );
}

/** The Facet mark. */
function PrefaceMark({ tone = "auto", className, ...props }: MarkProps) {
  if (tone === "auto") {
    return (
      <>
        <MarkSvg tone="deep" className={cn("dark:hidden", className)} {...props} />
        <MarkSvg tone="ice" className={cn("hidden dark:block", className)} {...props} />
      </>
    );
  }
  return <MarkSvg tone={tone} className={className} {...props} />;
}

/** "Preface" set in Space Grotesk Medium, -3.5% tracking, as in the Figma wordmark. */
function PrefaceWordmark({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="preface-wordmark"
      className={cn(
        "font-display font-medium leading-none tracking-[-0.035em] text-foreground",
        className,
      )}
      {...props}
    >
      Preface
    </span>
  );
}

type LogoProps = React.ComponentProps<"span"> & {
  /** Wordmark font size in pixels; the mark scales with it. */
  size?: number;
  layout?: "horizontal" | "stacked";
  tone?: MarkTone;
};

/** Mark + wordmark lockup. Horizontal: mark = 0.92 × type size, gap = 0.26 ×. */
function PrefaceLogo({
  size = 20,
  layout = "horizontal",
  tone = "auto",
  className,
  style,
  ...props
}: LogoProps) {
  const stacked = layout === "stacked";
  return (
    <span
      data-slot="preface-logo"
      role="img"
      aria-label="Preface"
      className={cn("inline-flex items-center", stacked && "flex-col", className)}
      style={{ gap: Math.round(size * (stacked ? 0.32 : 0.26)), ...style }}
      {...props}
    >
      <PrefaceMark
        tone={tone}
        size={Math.round(size * (stacked ? 1.5 : 0.92))}
        title=""
        aria-hidden
      />
      <PrefaceWordmark aria-hidden style={{ fontSize: size }} />
    </span>
  );
}

export type AppIconSkin = "glacier" | "dither" | "hybrid" | "frost";

/** Rounded-square app icon. Glacier is the product icon; Dither is marketing; Frost is the light skin. */
function PrefaceAppIcon({
  skin = "glacier",
  size = 48,
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & { skin?: AppIconSkin; size?: number }) {
  const small = size <= 20;
  const rich = size >= 56;
  const background: Record<AppIconSkin, string> = {
    glacier: "#16191F",
    dither: "linear-gradient(140deg, #2F6BFF 0%, #5C97FF 55%, #8EC0FF 100%)",
    hybrid: "#16191F",
    frost: "#F5F9FF",
  };
  const tone: MarkTone =
    skin === "dither" ? "white" : skin === "frost" ? "deep" : small ? "white" : "ice";
  return (
    <span
      data-slot="preface-app-icon"
      role="img"
      aria-label="Preface"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        skin === "frost" && "ring-1 ring-inset ring-border",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.225),
        background: background[skin],
        ...style,
      }}
      {...props}
    >
      {rich && (skin === "dither" || skin === "hybrid") ? (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${skin === "dither" ? "rgb(255 255 255 / 0.4)" : "rgb(77 150 255 / 0.6)"} ${Math.max(0.75, size / 200)}px, transparent ${Math.max(1, size / 160)}px)`,
            backgroundSize: `${Math.max(4, size / 40)}px ${Math.max(4, size / 40)}px`,
            maskImage: `radial-gradient(circle at ${skin === "dither" ? "0% 0%" : "100% 100%"}, black, transparent 110%)`,
          }}
        />
      ) : null}
      <PrefaceMark
        tone={tone}
        size={Math.round(size * (small ? 0.78 : 0.56))}
        compact={small}
        title=""
        aria-hidden
        className="relative"
      />
    </span>
  );
}

export { PrefaceMark, PrefaceWordmark, PrefaceLogo, PrefaceAppIcon };
