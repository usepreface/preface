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
  pending = false,
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
  onConfirm?: () => unknown;
  pending?: boolean;
  children?: React.ReactNode;
}) {
  const [typed, setTyped] = React.useState("");
  const inputId = React.useId();
  const locked = confirmText !== undefined && typed.trim() !== confirmText;

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next);
      }}
    >
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
          <AlertDialogCancel variant="ghost" disabled={pending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={locked || pending}
            onClick={(event) => {
              event.preventDefault();
              void onConfirm?.();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
