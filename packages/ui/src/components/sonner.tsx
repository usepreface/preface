"use client";

import type * as React from "react";

import {
  Alert02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  Loading03Icon,
  MultiplicationSignCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Toaster as Sonner, toast, useSonner, type ExternalToast, type ToasterProps } from "sonner";

import { cn } from "../lib/utils";
import { useOptionalTheme } from "./theme-provider";

/*
 * Toasts, built on sonner and styled to the Preface overlay tokens.
 * Mount <Toaster /> once near the root, then call toast() anywhere:
 *
 *   toast.success("Source connected", { description: "Notion · 1,284 pages" })
 *   toast.promise(sync(), { loading: "Syncing…", success: "Synced", error: "Sync failed" })
 */

const icon = (glyph: typeof Alert02Icon, className: string) => (
  <HugeiconsIcon icon={glyph} strokeWidth={2} className={cn("size-[18px]", className)} />
);

function Toaster({ theme, className, toastOptions, style, ...props }: ToasterProps) {
  const context = useOptionalTheme();
  return (
    <Sonner
      theme={theme ?? context?.theme ?? "system"}
      className={cn("toaster group", className)}
      gap={10}
      icons={{
        success: icon(CheckmarkCircle02Icon, "text-success"),
        info: icon(InformationCircleIcon, "text-info"),
        warning: icon(Alert02Icon, "text-warning"),
        error: icon(MultiplicationSignCircleIcon, "text-danger"),
        loading: icon(Loading03Icon, "animate-spin text-fg-secondary"),
        close: <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />,
      }}
      style={
        {
          "--normal-bg": "var(--bg-overlay)",
          "--normal-text": "var(--text-primary)",
          "--normal-border": "var(--border-default)",
          "--border-radius": "var(--radius-lg)",
          "--width": "380px",
          fontFamily: "var(--font-sans)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: "!gap-3 !px-4 !py-3.5 !shadow-lg !items-start",
          content: "!gap-0.5",
          title: "!text-sm !font-medium !leading-5 text-fg",
          description: "!text-[13px] !leading-[18px] !text-fg-secondary",
          icon: "!m-0 !mt-px !size-[18px] !justify-start",
          actionButton:
            "!h-7 !rounded-md !bg-primary !px-2.5 !text-xs !font-medium !text-primary-foreground transition-colors hover:!bg-primary-hover",
          cancelButton:
            "!h-7 !rounded-md !bg-surface-3 !px-2.5 !text-xs !font-medium !text-fg-secondary hover:!bg-surface-4",
          closeButton: "!border-border-default !bg-overlay !text-fg-secondary hover:!bg-surface-2",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast, useSonner, type ExternalToast, type ToasterProps };
