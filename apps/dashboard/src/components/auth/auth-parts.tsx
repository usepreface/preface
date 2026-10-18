import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { MailIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";

/** Where the code was sent, with a way to go back and use another address. */
export function EmailRecipient({
  email,
  actionLabel = "Change email",
  onAction,
}: {
  email: string;
  actionLabel?: string | null;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-surface-2 py-1.5 pr-1.5 pl-3">
      <MailIcon className="size-4 shrink-0 text-icon-secondary" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{email}</span>
      {actionLabel ? (
        <Button type="button" variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** "Resend in 0:42" while the cooldown runs, a resend button once it's over. */
export function ResendNotice({
  remaining,
  prompt = "Didn’t get it? Check spam, or resend in",
  onResend,
}: {
  remaining?: string;
  prompt?: string;
  onResend?: () => void;
}) {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-fg-tertiary" aria-live="polite">
      {remaining ? (
        <>
          {prompt} <span className="font-mono text-mono-sm text-fg-secondary">{remaining}</span>
        </>
      ) : (
        <>
          Didn’t get it?
          <button
            type="button"
            onClick={onResend}
            className="rounded-sm font-medium text-fg-accent outline-none hover:underline focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            Resend code
          </button>
        </>
      )}
    </p>
  );
}

/** A thin rule with a word in the middle, between alternative ways to continue. */
export function OrDivider({ children = "or" }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-caption text-fg-tertiary" role="separator">
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Continue with an identity provider, the provider's logo in front. Full width at the lg size. */
export function ProviderButton({
  brand,
  variant = "outline",
  size = "lg",
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "variant"> & {
  brand: BrandName;
  variant?: "outline" | "default";
  /** lg spans the form on auth screens; sm sits inline in cards and tables. */
  size?: "lg" | "sm";
}) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(size === "lg" ? "w-full" : null, className)}
      {...props}
    >
      <BrandLogo
        name={brand}
        size={size === "lg" ? 18 : 14}
        data-icon="inline-start"
        aria-hidden="true"
      />
      {children}
    </Button>
  );
}
