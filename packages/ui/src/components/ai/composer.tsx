"use client";

import * as React from "react";

import { ArrowUpIcon, ChevronDownIcon, LayersIcon, PaperclipIcon, StopIcon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

/*
 * Composer (prompt input), per Figma page 30: radius/xl container, text on top, an action row
 * below with attach, collection scope, a hint and the send button. Send stays disabled until
 * there is text; while an answer streams it becomes Stop.
 */

type ComposerContextValue = {
  value: string;
  setValue: (value: string) => void;
  submit: () => void;
  status: "idle" | "streaming";
  disabled: boolean;
};

const ComposerContext = React.createContext<ComposerContextValue | null>(null);

function useComposer() {
  const ctx = React.useContext(ComposerContext);
  if (!ctx) {
    throw new Error("Composer parts must be inside <Composer>");
  }
  return ctx;
}

function Composer({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
  status = "idle",
  disabled = false,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  status?: "idle" | "streaming";
  disabled?: boolean;
}) {
  const [local, setLocal] = React.useState(defaultValue);
  const value = valueProp ?? local;
  const setValue = React.useCallback(
    (next: string) => {
      setLocal(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );
  const submit = React.useCallback(() => {
    if (!value.trim() || disabled || status === "streaming") {
      return;
    }
    onSubmit?.(value);
    if (valueProp === undefined) {
      setLocal("");
    }
  }, [value, disabled, status, onSubmit, valueProp]);

  const ctx = React.useMemo(
    () => ({ value, setValue, submit, status, disabled }),
    [value, setValue, submit, status, disabled],
  );

  return (
    <ComposerContext.Provider value={ctx}>
      <form
        data-slot="composer"
        data-disabled={disabled || undefined}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "flex w-full flex-col gap-3 rounded-xl border border-border-default bg-background pt-3 pr-3 pb-2.5 pl-3.5 shadow-xs transition-[border-color,box-shadow]",
          "has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-focus-ring",
          "data-disabled:bg-surface-2",
          className,
        )}
        {...props}
      >
        {children}
      </form>
    </ComposerContext.Provider>
  );
}

function ComposerInput({ className, onKeyDown, ...props }: React.ComponentProps<"textarea">) {
  const { value, setValue, submit, disabled } = useComposer();
  return (
    <textarea
      data-slot="composer-input"
      rows={1}
      value={value}
      disabled={disabled}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.nativeEvent.isComposing &&
          !event.defaultPrevented
        ) {
          event.preventDefault();
          submit();
        }
      }}
      className={cn(
        "field-sizing-content max-h-48 min-h-5 w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-fg-tertiary disabled:placeholder:text-fg-disabled",
        className,
      )}
      {...props}
    />
  );
}

function ComposerActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="composer-actions"
      className={cn("flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function ComposerAttach(props: React.ComponentProps<typeof Button>) {
  const { disabled } = useComposer();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Attach files"
      disabled={disabled}
      {...props}
    >
      <PaperclipIcon />
    </Button>
  );
}

/** Narrow retrieval to one collection. */
function ComposerScope({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const { disabled } = useComposer();
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className="inline-flex h-6.5 items-center gap-1.5 rounded-sm bg-surface-3 pr-1.5 pl-2 text-xs font-medium text-fg-secondary outline-none transition-colors hover:bg-surface-4 hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring disabled:opacity-50"
          />
        }
      >
        <LayersIcon size={14} className="text-icon-secondary" />
        {current?.label ?? "All collections"}
        <ChevronDownIcon size={12} className="text-icon-secondary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onValueChange(String(next))}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ComposerHint({
  className,
  children = "↵ to send",
  ...props
}: React.ComponentProps<"span">) {
  const { disabled } = useComposer();
  if (disabled) {
    return null;
  }
  return (
    <span
      data-slot="composer-hint"
      className={cn("ml-auto text-xs text-fg-tertiary", className)}
      {...props}
    >
      {children}
    </span>
  );
}

function ComposerSubmit({
  className,
  onStop,
  ...props
}: React.ComponentProps<"button"> & { onStop?: () => void }) {
  const { value, status, disabled } = useComposer();
  const streaming = status === "streaming";
  const ready = value.trim().length > 0 && !disabled;
  return (
    <button
      type={streaming ? "button" : "submit"}
      data-slot="composer-submit"
      aria-label={streaming ? "Stop" : "Send"}
      disabled={streaming ? false : !ready}
      onClick={streaming ? onStop : undefined}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground outline-none transition-colors",
        "hover:bg-primary-hover focus-visible:ring-3 focus-visible:ring-focus-ring",
        "disabled:bg-surface-3 disabled:text-fg-disabled",
        className,
      )}
      {...props}
    >
      {streaming ? <StopIcon /> : <ArrowUpIcon />}
    </button>
  );
}

export {
  Composer,
  ComposerInput,
  ComposerActions,
  ComposerAttach,
  ComposerScope,
  ComposerHint,
  ComposerSubmit,
  useComposer,
};
