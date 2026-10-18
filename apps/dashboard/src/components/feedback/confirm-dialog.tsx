import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@usepreface/ui/components/alert-dialog";
import { Input } from "@usepreface/ui/components/input";
import { Label } from "@usepreface/ui/components/label";
import type { IconComponent } from "@usepreface/ui/icons";

import { StatusIcon, type StatusTone } from "#/components/auth/status-page";

/**
 * A confirmation for an action that is hard to undo. With `confirmText`, the person types it
 * before the action unlocks, for the few actions that affect a whole organization.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon,
  tone = "danger",
  title,
  description,
  confirmLabel,
  confirmText,
  destructive = true,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: IconComponent;
  tone?: StatusTone;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  confirmText?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  children?: React.ReactNode;
}) {
  const [typed, setTyped] = React.useState("");
  const inputId = React.useId();
  const locked = confirmText !== undefined && typed.trim() !== confirmText;

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-5 p-6 sm:max-w-110">
        <AlertDialogHeader className="items-start gap-3 text-left">
          <StatusIcon icon={icon} tone={tone} size="sm" />
          <AlertDialogTitle className="text-heading-3">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-fg-secondary">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {confirmText !== undefined ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={inputId}>
              Type <span className="font-mono">{confirmText}</span> to confirm
            </Label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={locked}
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** What happens when the action goes through, one point per consequence. */
export function ConsequenceList({
  items,
}: {
  items: readonly { title: string; detail?: string }[];
}) {
  return (
    <ul className="flex flex-col gap-2.5 rounded-lg border bg-surface-2 px-3.5 py-3 text-left">
      {items.map((item) => (
        <li key={item.title} className="flex gap-2.5">
          <span
            className="mt-1.75 size-1.5 shrink-0 rounded-full bg-fg-tertiary"
            aria-hidden="true"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            {item.detail ? (
              <span className="text-caption text-fg-secondary">{item.detail}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
