import type * as React from "react";

import { fitScale, IsoPaths, pascal, type IsoArt, type SvgProps } from "../art/iso-art";
import { cn } from "../lib/utils";

/*
 * Isometric objects (Figma page 10): true isometric, three tones, one accent.
 *   glacier  - ice tones for dark brand surfaces (covers, social, landing hero)
 *   deep     - signal blues for light marketing surfaces
 *   line     - white faces, slate outline: product UI on light
 *   lineDark - the line set for dark UI
 *   auto     - line on light, lineDark on dark (follows the `.dark` class)
 */

export type ObjectPalette = "glacier" | "deep" | "line" | "lineDark";

export type IsoObjectProps = SvgProps & {
  palette?: ObjectPalette | "auto";
  /** Height of the box the object is fitted into, in pixels. Defaults to 160. */
  size?: number;
  title?: string;
};

export type ObjectComponent = ((props: IsoObjectProps) => React.ReactNode) & {
  objectName: string;
  description?: string | undefined;
  art: Record<ObjectPalette, IsoArt>;
};

function ObjectSvg({
  art,
  size,
  title,
  className,
  ...props
}: SvgProps & { art: IsoArt; size: number; title?: string | undefined }) {
  const scale = fitScale(art, size * 1.6, size, 2);
  return (
    <svg
      viewBox={`0 0 ${art.w} ${art.h}`}
      width={Math.round(art.w * scale)}
      height={Math.round(art.h * scale)}
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-slot="iso-object"
      className={cn("shrink-0", className)}
      {...props}
    >
      <IsoPaths art={art} />
    </svg>
  );
}

export function createObject(
  meta: { name: string; description?: string },
  art: Record<ObjectPalette, IsoArt>,
): ObjectComponent {
  function Component({ palette = "glacier", size = 160, className, ...props }: IsoObjectProps) {
    if (palette === "auto") {
      return (
        <>
          <ObjectSvg
            art={art.line}
            size={size}
            className={cn("dark:hidden", className)}
            {...props}
          />
          <ObjectSvg
            art={art.lineDark}
            size={size}
            className={cn("hidden dark:block", className)}
            {...props}
          />
        </>
      );
    }
    return <ObjectSvg art={art[palette]} size={size} className={className} {...props} />;
  }
  Component.displayName = `${pascal(meta.name)}Object`;
  return Object.assign(Component, { objectName: meta.name, description: meta.description, art });
}
