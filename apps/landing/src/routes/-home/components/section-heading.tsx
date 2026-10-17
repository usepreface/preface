import type * as React from "react";

import { cn } from "@usepreface/ui/lib/utils";

import { Eyebrow } from "./eyebrow";

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
