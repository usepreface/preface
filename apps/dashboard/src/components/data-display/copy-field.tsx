import { Button } from "@usepreface/ui/components/button";
import { useCopyToClipboard } from "@usepreface/ui/hooks/use-copy-to-clipboard";
import { CheckIcon, CopyIcon, EyeIcon, KeyIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/**
 * A read-only value with a copy button: callback URLs, DNS records and other values people paste
 * into another system.
 */
export function CopyField({
  value,
  label,
  mono = true,
  size = "md",
  className,
}: {
  value: string;
  /** What is being copied, for the button's accessible name. */
  label: string;
  mono?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-md border border-border-default bg-surface-2 pr-1 pl-3",
        size === "lg" ? "h-12" : "h-9",
        className,
      )}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-foreground",
          mono ? "font-mono text-mono-sm" : "text-sm",
        )}
        title={value}
        aria-label={label}
      >
        {value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size={copied ? "sm" : "icon-sm"}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        onClick={() => void copy(value)}
        className={copied ? "text-success-fg" : undefined}
      >
        {copied ? (
          <>
            <CheckIcon data-icon="inline-start" />
            Copied
          </>
        ) : (
          <CopyIcon />
        )}
      </Button>
    </div>
  );
}

/** A stored secret: never shown again, only replaced. */
export function SecretField({
  hint,
  label,
  onReplace,
}: {
  hint: string;
  label: string;
  onReplace?: () => void;
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-border-default bg-background pr-1 pl-3">
      <KeyIcon className="size-4 shrink-0 text-icon-secondary" aria-hidden="true" />
      <span
        className="min-w-0 flex-1 truncate font-mono text-mono-sm text-fg-secondary"
        aria-label={`${label}, hidden`}
      >
        {hint}
      </span>
      {onReplace ? (
        <Button type="button" variant="ghost" size="sm" onClick={onReplace}>
          Replace
        </Button>
      ) : (
        <EyeIcon className="mr-2 size-4 text-icon-secondary" aria-hidden="true" />
      )}
    </div>
  );
}
