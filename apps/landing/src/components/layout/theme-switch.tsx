import { useTheme } from "@usepreface/ui/components/theme-provider";
import { MoonIcon, SunIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/** Light/dark segmented switch. The active segment comes from the `.dark` class, not state,
 * so the prerendered markup matches whatever theme the boot script applied. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const segment =
    "flex size-7 items-center justify-center rounded-full text-icon-secondary outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring [&_svg]:size-3.5";
  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn("flex items-center gap-0.5 rounded-full bg-surface-3 p-0.75", className)}
    >
      <button
        type="button"
        aria-label="Light theme"
        onClick={() => setTheme("light")}
        className={cn(segment, "not-dark:bg-surface-1 not-dark:text-icon not-dark:shadow-xs")}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
        className={cn(segment, "dark:bg-surface-1 dark:text-icon dark:shadow-xs")}
      >
        <MoonIcon />
      </button>
    </div>
  );
}
