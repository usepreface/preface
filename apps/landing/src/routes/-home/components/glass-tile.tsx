import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";

/** Frosted square with a company logo, used for floating integration tiles. */
export function GlassTile({
  brand,
  size,
  rotate = 0,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"span">, "children"> & {
  brand: BrandName;
  size: number;
  rotate?: number;
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center border border-(--landing-glass-edge) bg-(image:--landing-glass-tile) shadow-(--landing-glass-shadow) backdrop-blur-xl",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        rotate: `${rotate}deg`,
        ...style,
      }}
      {...props}
    >
      <BrandLogo name={brand} size={Math.round(size * 0.5)} aria-hidden="true" />
    </span>
  );
}
