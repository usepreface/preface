import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@usepreface/ui/components/tooltip";
import { CheckIcon, CodeIcon, CopyIcon, DownloadIcon, ImageIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { copyText, downloadPng, downloadSvg } from "../lib/assets";

/** Icon button with a tooltip. */
export function ActionButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={cn("text-fg-secondary hover:text-fg", className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Copy button that flips to a check for a moment after copying. */
export function CopyButton({
  value,
  label = "Copy",
  toastLabel,
  className,
}: {
  value: string;
  label?: string;
  toastLabel?: string;
  className?: string;
}) {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!done) {
      return;
    }
    const t = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <ActionButton
      label={label}
      className={className}
      onClick={() => {
        void copyText(value, toastLabel).then((ok) => setDone(ok));
      }}
    >
      <span className="relative grid size-3.5 place-items-center">
        <CopyIcon
          size={14}
          className={cn(
            "col-start-1 row-start-1 transition-all duration-200",
            done && "scale-50 opacity-0",
          )}
        />
        <CheckIcon
          size={14}
          className={cn(
            "col-start-1 row-start-1 text-success transition-all duration-200",
            !done && "scale-50 opacity-0",
          )}
        />
      </span>
    </ActionButton>
  );
}

/**
 * A gallery tile for a downloadable piece of art: hover reveals copy JSX, SVG and PNG actions.
 * The tile's first visible <svg> is what gets downloaded.
 */
export function AssetCard({
  name,
  fileName,
  code,
  caption,
  stageClassName,
  className,
  png = true,
  children,
}: {
  name: React.ReactNode;
  fileName: string;
  code?: string;
  caption?: React.ReactNode;
  stageClassName?: string;
  className?: string;
  png?: boolean;
  children: React.ReactNode;
}) {
  const stage = React.useRef<HTMLDivElement>(null);
  return (
    <div
      className={cn(
        "group/asset relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-border-default hover:shadow-sm",
        className,
      )}
    >
      <div
        ref={stage}
        className={cn("flex min-h-36 flex-1 items-center justify-center p-6", stageClassName)}
      >
        {children}
      </div>
      <div className="flex min-w-0 items-center gap-2 border-t bg-card px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-13 font-medium">{name}</span>
          {caption ? (
            <span className="truncate font-mono text-2xs text-fg-tertiary">{caption}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover/asset:opacity-100 group-focus-within/asset:opacity-100">
          {code ? (
            <ActionButton label="Copy JSX" onClick={() => void copyText(code, "Copied JSX")}>
              <CodeIcon size={14} />
            </ActionButton>
          ) : null}
          <ActionButton label="Download SVG" onClick={() => downloadSvg(stage.current, fileName)}>
            <DownloadIcon size={14} />
          </ActionButton>
          {png ? (
            <ActionButton
              label="Download PNG"
              onClick={() => void downloadPng(stage.current, fileName, 4)}
            >
              <ImageIcon size={14} />
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Inline code that copies itself on click. */
export function CopyCode({
  value,
  className,
  toastLabel = "Copied",
}: {
  value: string;
  className?: string;
  toastLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => void copyText(value, toastLabel)}
      className={cn(
        "group/code inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-left font-mono outline-none hover:underline hover:decoration-dotted hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
    >
      <span className="truncate">{value}</span>
      <CopyIcon
        size={11}
        className="shrink-0 opacity-0 transition-opacity group-hover/code:opacity-70"
      />
    </button>
  );
}
