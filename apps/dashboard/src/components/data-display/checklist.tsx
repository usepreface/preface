import type * as React from "react";

import { AlertIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

export type CheckState = "done" | "todo" | "failed" | "waiting";

export type Check = {
  state: CheckState;
  title: string;
  detail?: string;
  action?: React.ReactNode;
};

const looks = {
  done: { icon: CheckCircleIcon, iconClass: "text-success-fg", row: null, label: "Done" },
  todo: {
    icon: AlertIcon,
    iconClass: "text-warning-fg",
    row: "bg-warning-bg",
    label: "Needs attention",
  },
  failed: { icon: XCircleIcon, iconClass: "text-danger-fg", row: "bg-danger-bg", label: "Failed" },
  waiting: { icon: ClockIcon, iconClass: "text-icon-secondary", row: null, label: "Not started" },
} as const;

/** A short list of checks with their outcome: readiness, test results, next steps. */
export function Checklist({ checks, className }: { checks: readonly Check[]; className?: string }) {
  return (
    <ul className={cn("flex flex-col overflow-hidden rounded-xl border text-left", className)}>
      {checks.map((check) => {
        const look = looks[check.state];
        const Icon = look.icon;
        return (
          <li
            key={check.title}
            className={cn("flex items-center gap-3 border-b px-3.5 py-3 last:border-b-0", look.row)}
          >
            <Icon className={cn("size-4.5 shrink-0", look.iconClass)} aria-label={look.label} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{check.title}</span>
              {check.detail ? (
                <span className="text-xs text-fg-secondary">{check.detail}</span>
              ) : null}
            </div>
            {check.action}
          </li>
        );
      })}
    </ul>
  );
}
