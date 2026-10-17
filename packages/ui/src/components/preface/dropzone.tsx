"use client";

import * as React from "react";

import { CheckIcon, CloseIcon, FileIcon, PdfIcon, UploadIcon } from "../../icons";
import { cn } from "../../lib/utils";

/*
 * File upload for the Files source (Figma page 54). Dashed zone, accent while dragging,
 * per-file progress rows below. The zone is a label for a real file input, so it works
 * with the keyboard and screen readers without extra wiring.
 */

function Dropzone({
  onFiles,
  accept,
  multiple = true,
  disabled,
  hint = "PDF, Markdown, DOCX, HTML and text · up to 200 MB each",
  className,
  ...props
}: Omit<React.ComponentProps<"label">, "onDrop"> & {
  onFiles?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  hint?: React.ReactNode;
}) {
  const [over, setOver] = React.useState(0);
  const depth = React.useRef(0);
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      data-slot="dropzone"
      data-drag-over={over > 0 || undefined}
      data-disabled={disabled || undefined}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setOver(e.dataTransfer.items?.length || 1);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setOver(0);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setOver(0);
        if (!disabled && e.dataTransfer.files.length) {
          onFiles?.(Array.from(e.dataTransfer.files));
        }
      }}
      className={cn(
        "group/dropzone flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-dashed border-border-default bg-surface-1 p-7 text-center transition-colors hover:border-border-strong has-focus-visible:border-border-focus has-focus-visible:ring-3 has-focus-visible:ring-focus-ring data-disabled:pointer-events-none data-disabled:opacity-50 data-drag-over:border-border-focus data-drag-over:bg-primary-subtle",
        className,
      )}
      {...props}
    >
      <input
        id={id}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) {
            onFiles?.(Array.from(e.target.files));
          }
          e.target.value = "";
        }}
      />
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 group-data-drag-over/dropzone:bg-surface-1">
        <UploadIcon className="size-4.5 text-icon-accent" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-foreground">
        {over > 0 ? (
          `Drop to upload ${over} ${over === 1 ? "file" : "files"}`
        ) : (
          <>
            Drop files here or <span className="text-fg-accent">browse</span>
          </>
        )}
      </span>
      {hint ? <span className="text-xs text-fg-tertiary">{hint}</span> : null}
    </label>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB"];
  let v = bytes / 1024;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u += 1;
  }
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${units[u]}`;
}

/** One file row. `progress` 0–1; at 1 the row reads Indexed and the bar turns green. */
function UploadItem({
  name,
  size,
  progress,
  error,
  onRemove,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  name: string;
  size: number;
  progress: number;
  error?: string;
  onRemove?: () => void;
}) {
  const done = progress >= 1 && !error;
  const Icon = name.toLowerCase().endsWith(".pdf") ? PdfIcon : FileIcon;
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <div
      data-slot="upload-item"
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-1 px-3 py-2.5",
        className,
      )}
      {...props}
    >
      <Icon className="size-4.5 shrink-0 text-icon-secondary" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-13 font-medium text-foreground">{name}</span>
          <span
            className={cn(
              "shrink-0 text-xs tabular-nums",
              error ? "text-danger-fg" : done ? "text-success-fg" : "text-fg-tertiary",
            )}
          >
            {formatBytes(size)} · {error ?? (done ? "Indexed" : `${pct}%`)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Uploading ${name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-1 overflow-hidden rounded-full bg-surface-4"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
              error ? "bg-danger" : done ? "bg-success" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={done ? `Remove ${name}` : `Cancel ${name}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon-secondary outline-none hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          {done ? <CheckIcon className="size-4" /> : <CloseIcon className="size-4" />}
        </button>
      ) : null}
    </div>
  );
}

export { Dropzone, UploadItem, formatBytes };
