import { Badge } from "@usepreface/ui/components/badge";
import { ChevronRightIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import type { BrandName } from "@usepreface/ui/logos/registry";
import { LogoTile } from "@usepreface/ui/preface/data-display";

/** One organization's single sign-on, offered when an email matches more than one. */
export function SsoOption({
  brand,
  title,
  detail,
  recommended,
  onSelect,
}: {
  brand: BrandName;
  title: string;
  detail: string;
  recommended?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors",
        "hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring",
        recommended ? "border-border-focus bg-primary-subtle" : "bg-surface-1",
      )}
    >
      <LogoTile brand={brand} size={36} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="truncate text-xs text-fg-secondary">{detail}</span>
      </span>
      {recommended ? <Badge tone="info">Recommended</Badge> : null}
      <ChevronRightIcon className="size-4 text-icon-secondary" />
    </button>
  );
}
