import type * as React from "react";

import { Link, type LinkOptions } from "@tanstack/react-router";

import { buttonVariants } from "@usepreface/ui/components/button";
import { ArrowRightIcon } from "@usepreface/ui/icons";

export function OverviewCard({
  media,
  title,
  detail,
  badge,
  action,
  link,
}: {
  media: React.ReactNode;
  title: string;
  detail: string;
  badge?: React.ReactNode;
  action: string;
  link: LinkOptions;
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border bg-surface-1 p-5">
      <div className="flex items-center gap-2.5">
        {media}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <p className="flex-1 text-13 text-fg-secondary">{detail}</p>
      <div className="flex items-center gap-2">
        {badge}
        <Link
          {...link}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-auto" })}
        >
          {action}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}
