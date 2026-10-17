import * as React from "react";

/**
 * auto  - full-colour mark; switches to the brand's light-on-dark artwork in dark mode when it has one
 * color - full-colour mark, always
 * mono  - single colour that follows `currentColor`, for icon rows and dense UI
 */
export type LogoVariant = "auto" | "color" | "mono";

export type LogoProps = Omit<React.ComponentProps<"svg">, "ref"> & {
  variant?: LogoVariant;
  /** Pixel size of the square box the mark is fitted into. Defaults to 16. */
  size?: number | string;
  /** Accessible name. Defaults to the company name. */
  title?: string;
};

/** Unique prefix for gradient and clip-path ids, so two logos on one page never collide. */
export function useLogoId() {
  return `${React.useId().replace(/:/g, "")}-`;
}
