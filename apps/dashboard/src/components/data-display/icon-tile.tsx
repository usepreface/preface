import type { IconComponent } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/** One icon on a bordered tile, next to settings and list rows that have no logo. */
export function IconTile({
  icon: Icon,
  size = 36,
  className,
}: {
  icon: IconComponent;
  size?: 28 | 32 | 36 | 44;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-surface-2",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon className="text-icon-accent" size={Math.round(size / 2)} />
    </span>
  );
}
