import type * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import type { IconComponent } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { DotGrid } from "@usepreface/ui/patterns";

import { AuthFooter } from "./auth-layout";

/*
 * A centred card on the dotted surface, for screens that confirm or explain something rather than
 * collect much: magic links, invitation problems, re-authentication and auth errors.
 */
export function StatusPage({
  topRight,
  width = "md",
  children,
}: {
  topRight?: React.ReactNode;
  width?: "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-surface-2 px-6 py-8 sm:px-12">
      <DotGrid color="#98A1B0" opacity={0.18} gap={24} radius={1} />
      <header className="relative flex items-center justify-between gap-4">
        <PrefaceLogo size={22} />
        <div className="text-xs font-medium text-fg-tertiary">{topRight}</div>
      </header>
      <main className="relative flex flex-1 items-center justify-center py-10">
        <div
          className={cn(
            "flex w-full animate-in flex-col items-center gap-5 rounded-2xl border bg-surface-1 p-6 text-center shadow-sm duration-500 fade-in-0 zoom-in-95 sm:p-8",
            width === "md" ? "max-w-115" : "max-w-125",
          )}
        >
          {children}
        </div>
      </main>
      <AuthFooter className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" />
    </div>
  );
}

const tones = {
  accent: "bg-primary-subtle text-icon-accent",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-surface-3 text-icon-secondary",
} as const;

export type StatusTone = keyof typeof tones;

/** A round tinted badge with one icon, at the top of status cards and dialogs. */
export function StatusIcon({
  icon: Icon,
  tone,
  size = "md",
  className,
}: {
  icon: IconComponent;
  tone: StatusTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm"
          ? "size-10 [&_svg]:size-5"
          : size === "md"
            ? "size-12 [&_svg]:size-5.5"
            : "size-13 [&_svg]:size-6",
        tones[tone],
        className,
      )}
    >
      <Icon />
    </span>
  );
}
