import { cn } from "../lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-background text-fg-secondary border-border-default pointer-events-none h-5 w-fit min-w-5 gap-1 rounded-xs border px-1 font-mono text-2xs font-medium shadow-[0_1px_0_0_var(--border-default)] select-none in-data-[slot=tooltip-content]:bg-white/10 in-data-[slot=tooltip-content]:border-white/20 in-data-[slot=tooltip-content]:text-fg-inverse in-data-[slot=tooltip-content]:shadow-none [&_svg:not([class*='size-'])]:size-3 pointer-events-none inline-flex items-center justify-center select-none",
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("gap-1 inline-flex items-center", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
