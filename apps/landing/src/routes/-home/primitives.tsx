import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";

/** Page section on the landing canvas: 1200 px column, 100 px vertical rhythm. */
export function Section({
  className,
  inner,
  children,
  ...props
}: React.ComponentProps<"section"> & { inner?: string }) {
  return (
    <section className={cn("relative bg-(--landing-canvas)", className)} {...props}>
      <div
        className={cn(
          "mx-auto flex w-full max-w-300 flex-col px-5 py-16 sm:px-8 lg:px-0 lg:py-25",
          inner,
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Mono pill above section headings. */
export function Eyebrow({ className, children, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2.5 rounded-full bg-primary-subtle px-3 py-1.5 font-mono text-xs leading-4 font-medium tracking-[0.06em] text-fg-accent uppercase",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
  id,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "start" | "center";
  className?: string;
  id?: string;
}) {
  const center = align === "center";
  return (
    <div
      data-reveal=""
      className={cn("flex flex-col gap-4.5", center && "items-center text-center", className)}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        id={id}
        className="max-w-205 font-display text-[2.375rem] leading-[1.05] font-medium tracking-[-0.035em] text-balance text-foreground sm:text-5xl lg:text-[3.75rem] lg:leading-[3.875rem]"
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-160 text-lg leading-7 text-pretty text-fg-secondary lg:text-[1.1875rem] lg:leading-7.5">
          {description}
        </p>
      ) : null}
    </div>
  );
}

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
