import type * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@usepreface/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@usepreface/ui/components/sheet";
import { cn } from "@usepreface/ui/lib/utils";

type OverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  /** Left side of the footer: a short note. */
  note?: React.ReactNode;
  /** Buttons for the right side of the footer. */
  footer: React.ReactNode;
  children: React.ReactNode;
  /** Wraps the body and footer, usually a <form>. */
  as?: (content: React.ReactNode) => React.ReactNode;
};

/** A centred dialog with a header, a scrolling body and a footer on surface-2. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  note,
  footer,
  children,
  as,
  size = "md",
}: OverlayProps & { size?: "md" | "lg" }) {
  const content = (
    <>
      <div className="flex max-h-[min(70svh,40rem)] flex-col gap-4 overflow-y-auto px-6 pb-5">
        {children}
      </div>
      <DialogFooter className="flex-row items-center gap-2 border-t bg-surface-2 px-5 py-3.5 sm:justify-end">
        <div className="min-w-0 flex-1 text-caption text-fg-tertiary">{note}</div>
        {footer}
      </DialogFooter>
    </>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("gap-0 overflow-hidden p-0", size === "md" ? "sm:max-w-140" : "sm:max-w-150")}
      >
        <DialogHeader className="gap-1 px-6 pt-5 pb-3 pr-12">
          <DialogTitle className="text-heading-3">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-fg-secondary">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {as ? as(content) : content}
      </DialogContent>
    </Dialog>
  );
}

/** A side sheet for longer forms and details: a role, a domain challenge, an audit event. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  note,
  footer,
  children,
  as,
  media,
}: OverlayProps & { media?: React.ReactNode }) {
  const content = (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">{children}</div>
      <SheetFooter className="flex-row items-center gap-2 border-t px-5 py-3.5">
        <div className="min-w-0 flex-1 text-caption text-fg-tertiary">{note}</div>
        {footer}
      </SheetFooter>
    </>
  );
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-125"
      >
        <SheetHeader className="flex-row items-center gap-3 border-b px-5 py-4 pr-12">
          {media}
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle className="text-base font-medium">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="text-xs text-fg-secondary">
                {description}
              </SheetDescription>
            ) : null}
          </div>
        </SheetHeader>
        {as ? as(content) : content}
      </SheetContent>
    </Sheet>
  );
}
