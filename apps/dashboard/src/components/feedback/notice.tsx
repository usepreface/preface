import type * as React from "react";

import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

const tones = {
  info: { icon: InfoIcon, box: "bg-info-bg", iconClass: "text-info-fg" },
  success: { icon: CheckCircleIcon, box: "bg-success-bg", iconClass: "text-success-fg" },
  warning: { icon: AlertIcon, box: "bg-warning-bg", iconClass: "text-warning-fg" },
  danger: { icon: XCircleIcon, box: "bg-danger-bg", iconClass: "text-danger-fg" },
  neutral: { icon: InfoIcon, box: "border bg-surface-2", iconClass: "text-icon-secondary" },
} as const;

/**
 * An inline, page-level message about a condition that is still true: an archived organization,
 * an expiring certificate, a read-only view. Results of an action are toasts, not notices.
 */
export function Notice({
  tone = "info",
  icon,
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof tones;
  icon?: IconComponent;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const look = tones[tone];
  const Icon = icon ?? look.icon;
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg px-3.5 py-3 text-left", look.box, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", look.iconClass)} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? <span className="text-sm font-medium text-foreground">{title}</span> : null}
        {children ? <div className="text-13 text-fg-secondary">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
