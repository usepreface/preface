import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Spinner } from "@usepreface/ui/components/spinner";
import { ArrowRightIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/**
 * The primary button of a form. While `pending` it shows a spinner and the pending label, and
 * stays disabled. `arrow` adds the trailing arrow used by the step-by-step auth screens.
 */
export function SubmitButton({
  pending,
  pendingLabel,
  arrow,
  wide,
  size = "default",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type"> & {
  pending?: boolean;
  pendingLabel?: string;
  arrow?: boolean;
  wide?: boolean;
}) {
  return (
    <Button
      {...props}
      type="submit"
      size={size}
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
      className={cn(wide ? "w-full" : null, className)}
    >
      {pending ? (
        <>
          <Spinner data-icon="inline-start" />
          {pendingLabel ?? children}
        </>
      ) : (
        <>
          {children}
          {arrow ? <ArrowRightIcon data-icon="inline-end" /> : null}
        </>
      )}
    </Button>
  );
}
