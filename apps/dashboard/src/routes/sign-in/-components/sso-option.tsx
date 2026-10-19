import { Badge } from "@usepreface/ui/components/badge";
import { ShieldIcon, ChevronRightIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import type { BrandName } from "@usepreface/ui/logos/registry";
import { LogoTile } from "@usepreface/ui/preface/data-display";

/** An enabled enterprise sign-in method. */
export function SsoOption({
  brand,
  disabled,
  title,
  detail,
  recommended,
  onSelect,
}: {
  brand?: BrandName;
  disabled?: boolean;
  title: string;
  detail: string;
  recommended?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-colors",
        "hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none disabled:opacity-50",
        recommended ? "border-border-focus bg-primary-subtle" : "bg-surface-1",
      )}
    >
      {brand ? (
        <LogoTile brand={brand} size={36} />
      ) : (
        <span className="flex size-9 items-center justify-center rounded-lg border bg-surface-2">
          <ShieldIcon className="size-5 text-icon-secondary" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="truncate text-xs text-fg-secondary">{detail}</span>
      </span>
      {recommended ? <Badge tone="info">Recommended</Badge> : null}
      <ChevronRightIcon className="size-4 text-icon-secondary" />
    </button>
  );
}
