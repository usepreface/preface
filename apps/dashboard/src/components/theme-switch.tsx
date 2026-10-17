import { useTheme, type Theme } from "@usepreface/ui/components/theme-provider";
import { ComputerIcon, MoonIcon, SunIcon, type IconComponent } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

const options: [Theme, string, IconComponent][] = [
  ["light", "Light theme", SunIcon],
  ["dark", "Dark theme", MoonIcon],
  ["system", "System theme", ComputerIcon],
];

/** Light, dark or follow the system. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn("flex items-center gap-0.5 rounded-full bg-surface-3 p-0.5", className)}
    >
      {options.map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          onClick={() => setTheme(value)}
          className="flex size-6 items-center justify-center rounded-full text-icon-secondary outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring aria-checked:bg-surface-1 aria-checked:text-icon aria-checked:shadow-xs"
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}
