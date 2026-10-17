"use client";

import * as React from "react";

import {
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from "../../icons";
import { cn } from "../../lib/utils";

/*
 * Account fields from Figma pages 56–57 (onboarding): password with a visibility toggle,
 * a four-segment strength meter, a URL slug input with a fixed prefix, and the step header.
 */

const boxClass =
  "group/box flex h-10 w-full min-w-0 items-center overflow-hidden rounded-lg border border-border-default bg-surface-1 transition-[border-color,box-shadow] hover:border-border-strong has-[input:focus-visible]:border-border-focus has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-focus-ring has-[input[aria-invalid=true]]:border-danger has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-danger/25 has-[input:disabled]:border-border-subtle has-[input:disabled]:bg-surface-2";

const inputClass =
  "h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-fg-tertiary disabled:cursor-not-allowed disabled:text-fg-disabled";

/** Password with a show/hide button. The button keeps its accessible name in sync. */
function PasswordInput({
  className,
  defaultVisible = false,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { defaultVisible?: boolean }) {
  const [visible, setVisible] = React.useState(defaultVisible);
  return (
    <div data-slot="password-input" className={cn(boxClass, "gap-2 pr-1.5 pl-3", className)}>
      <LockIcon className="size-4 shrink-0 text-icon-secondary" aria-hidden="true" />
      <input
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        spellCheck={false}
        className={cn(inputClass, !visible && "tracking-wider")}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible((v) => !v)}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-icon-secondary outline-none hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring disabled:pointer-events-none"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}

/** 0–4. Length, mixed case, digits and symbols each add a point; under 8 characters caps at 1. */
function scorePassword(value: string) {
  if (!value) {
    return 0;
  }
  let score = 0;
  if (value.length >= 12) {
    score += 1;
  }
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) {
    score += 1;
  }
  if (/\d/.test(value)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(value)) {
    score += 1;
  }
  return value.length < 8 ? Math.min(score, 1) : Math.max(score, 1);
}

const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;

/** Four segments: amber below three, green from three. The text says why, not just how much. */
function PasswordStrength({
  value,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & { value: string }) {
  const level = scorePassword(value);
  const parts = [
    `${value.length} characters`,
    /\d/.test(value) && "a number",
    /[^A-Za-z0-9]/.test(value) && "a symbol",
  ].filter(Boolean) as string[];
  const detail =
    parts.length > 1 ? `${parts[0]} with ${parts.slice(1).join(" and ")}` : (parts[0] ?? "");
  const good = level >= 3;
  return (
    <div
      data-slot="password-strength"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full bg-surface-4 transition-colors",
              i < level && (good ? "bg-success" : "bg-warning"),
            )}
          />
        ))}
      </div>
      <p
        aria-live="polite"
        className={cn(
          "flex items-center gap-1.5 text-xs",
          good ? "text-success-fg" : "text-fg-tertiary",
        )}
      >
        {value ? `${strengthLabel[level]} · ${detail}` : "Use 12 or more characters."}
      </p>
    </div>
  );
}

/** Lowercase letters, numbers and single dashes. "Acme, Inc." → "acme-inc". */
function slugify(value: string, max = 48) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

type SlugStatus = "idle" | "checking" | "available" | "taken";

/**
 * URL slug with a fixed host prefix. Follows `source` (the name) until the user edits it;
 * the edit button unlocks it. Status adds the check or the error ring.
 */
function UrlSlugInput({
  prefix,
  source,
  value,
  defaultValue,
  onValueChange,
  status = "idle",
  className,
  id,
  onBlur,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "prefix" | "onChange"> & {
  prefix: string;
  source?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (slug: string, edited: boolean) => void;
  status?: SlugStatus;
}) {
  const [edited, setEdited] = React.useState(defaultValue !== null && defaultValue !== undefined);
  const [locked, setLocked] = React.useState(
    source !== null &&
      source !== undefined &&
      (defaultValue === null || defaultValue === undefined),
  );
  const [inner, setInner] = React.useState(defaultValue ?? slugify(source ?? ""));
  const ref = React.useRef<HTMLInputElement>(null);
  const suggested = slugify(source ?? "");
  const slug = value ?? (edited ? inner : suggested);

  return (
    <div data-slot="url-slug-input" className={cn(boxClass, className)}>
      <span className="flex h-full shrink-0 items-center border-r border-border-default bg-surface-2 px-3 font-mono text-sm text-fg-tertiary select-none">
        {prefix}
      </span>
      <input
        ref={ref}
        id={id}
        value={slug}
        readOnly={locked}
        aria-invalid={status === "taken" || undefined}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
          setEdited(true);
          setInner(next);
          onValueChange?.(next, true);
        }}
        onBlur={(e) => {
          const clean = slugify(e.target.value);
          if (clean !== slug) {
            setInner(clean);
            onValueChange?.(clean, true);
          }
          onBlur?.(e);
        }}
        className={cn(inputClass, "pl-3 font-mono text-sm read-only:cursor-default")}
        {...props}
      />
      <span className="flex shrink-0 items-center gap-1 pr-1.5 pl-2">
        {status === "available" ? (
          <CheckCircleIcon className="size-4 text-success-fg" aria-label="Available" />
        ) : null}
        {status === "taken" ? (
          <AlertCircleIcon className="size-4 text-danger-fg" aria-label="Taken" />
        ) : null}
        {locked ? (
          <button
            type="button"
            aria-label="Edit URL"
            onClick={() => {
              setLocked(false);
              setEdited(true);
              setInner(slug);
              requestAnimationFrame(() => ref.current?.select());
            }}
            className="flex size-7 items-center justify-center rounded-md text-icon-secondary outline-none hover:bg-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
          >
            <EditIcon className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

/** Caption under a field. Tone sets colour and the leading icon. */
function FieldHint({
  tone = "neutral",
  className,
  children,
  ...props
}: React.ComponentProps<"p"> & { tone?: "neutral" | "success" | "danger" }) {
  const Icon = tone === "success" ? CheckIcon : tone === "danger" ? AlertCircleIcon : null;
  return (
    <p
      data-slot="field-hint"
      data-tone={tone}
      className={cn(
        "flex items-center gap-1.5 text-xs text-fg-tertiary data-[tone=danger]:text-danger-fg data-[tone=success]:text-success-fg",
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      {children}
    </p>
  );
}

/** "1 Instance — 2 Organization". Done steps fill, the current step rings. */
function SetupSteps({
  steps,
  current,
  className,
  ...props
}: React.ComponentProps<"ol"> & { steps: string[]; current: number }) {
  return (
    <ol data-slot="setup-steps" className={cn("flex items-center gap-2.5", className)} {...props}>
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const cur = n === current;
        return (
          <li
            key={label}
            aria-current={cur ? "step" : undefined}
            className="flex items-center gap-2.5"
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5.5 items-center justify-center rounded-full bg-surface-3 text-xs font-medium text-fg-tertiary",
                  done && "bg-primary text-primary-foreground",
                  cur && "border border-border-focus bg-primary-subtle text-fg-accent",
                )}
              >
                {done ? <CheckIcon className="size-3" aria-label="Done" /> : n}
              </span>
              <span
                className={cn(
                  "text-13",
                  cur
                    ? "font-medium text-foreground"
                    : done
                      ? "text-foreground"
                      : "text-fg-tertiary",
                )}
              >
                {label}
              </span>
            </span>
            {n < steps.length ? (
              <span
                aria-hidden="true"
                className={cn("h-px w-8", done ? "bg-primary" : "bg-border-default")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export {
  FieldHint,
  PasswordInput,
  PasswordStrength,
  SetupSteps,
  UrlSlugInput,
  scorePassword,
  slugify,
};
export type { SlugStatus };
