import * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background text-foreground placeholder:text-fg-tertiary hover:border-border-strong focus-visible:border-ring focus-visible:ring-focus-ring aria-invalid:border-destructive aria-invalid:ring-danger/25 disabled:bg-muted disabled:text-fg-disabled h-8 rounded-md border px-2.5 py-1 text-base transition-[color,box-shadow,border-color] file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-fg-tertiary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
