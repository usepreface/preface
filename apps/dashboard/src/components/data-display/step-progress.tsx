import { Fragment } from "react";

import { CheckIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/** Where a multi-step setup stands: configure → test → activate → approve. `current` is 1-based. */
export function StepProgress({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2 rounded-xl border bg-surface-2 px-4 py-3.5">
      {steps.map((step, index) => {
        const n = index + 1;
        const done = n < current;
        const active = n === current;
        return (
          <Fragment key={step}>
            <li aria-current={active ? "step" : undefined} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5.5 items-center justify-center rounded-full border text-xs font-medium",
                  done && "border-transparent bg-success text-white",
                  active && "border-border-focus bg-primary-subtle text-fg-accent",
                  !done && !active && "border-border-default bg-surface-1 text-fg-tertiary",
                )}
              >
                {done ? <CheckIcon className="size-3" aria-label="Done" /> : n}
              </span>
              <span
                className={cn(
                  "text-13",
                  active
                    ? "font-medium text-foreground"
                    : done
                      ? "text-foreground"
                      : "text-fg-tertiary",
                )}
              >
                {step}
              </span>
            </li>
            {n < steps.length ? (
              <li
                aria-hidden="true"
                className={cn(
                  "mx-3 h-px min-w-6 flex-1",
                  done ? "bg-success" : "bg-border-default",
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
