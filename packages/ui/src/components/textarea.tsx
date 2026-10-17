import * as React from "react";

import { cn } from "../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input bg-background placeholder:text-fg-tertiary hover:border-border-strong focus-visible:border-ring focus-visible:ring-focus-ring aria-invalid:border-destructive aria-invalid:ring-danger/25 disabled:bg-muted disabled:text-fg-disabled rounded-md border px-3 py-2 text-base transition-[color,box-shadow,border-color] focus-visible:ring-3 aria-invalid:ring-3 md:text-sm flex field-sizing-content min-h-16 w-full outline-none placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
