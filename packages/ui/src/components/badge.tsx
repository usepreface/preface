import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

/*
 * Badge, per Figma page 21: three styles (subtle, outline, solid) across seven tones.
 * Outline + dot is the Plane-style label chip. Colour reinforces meaning; text carries it.
 */
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-sm border border-transparent px-2 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-focus-ring has-data-[slot=badge-dot]:pl-1.5 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        subtle: "",
        outline: "border-border-default bg-background text-foreground",
        solid: "text-white",
      },
      tone: {
        neutral: "",
        info: "",
        success: "",
        warning: "",
        danger: "",
        violet: "",
        teal: "",
      },
    },
    compoundVariants: [
      { variant: "subtle", tone: "neutral", className: "bg-neutral-bg text-neutral-fg" },
      { variant: "subtle", tone: "info", className: "bg-info-bg text-info-fg" },
      { variant: "subtle", tone: "success", className: "bg-success-bg text-success-fg" },
      { variant: "subtle", tone: "warning", className: "bg-warning-bg text-warning-fg" },
      { variant: "subtle", tone: "danger", className: "bg-danger-bg text-danger-fg" },
      { variant: "subtle", tone: "violet", className: "bg-violet-bg text-violet-fg" },
      { variant: "subtle", tone: "teal", className: "bg-teal-bg text-teal-fg" },
      { variant: "solid", tone: "neutral", className: "bg-inverse text-fg-inverse" },
      { variant: "solid", tone: "info", className: "bg-info" },
      { variant: "solid", tone: "success", className: "bg-success" },
      { variant: "solid", tone: "warning", className: "bg-warning" },
      { variant: "solid", tone: "danger", className: "bg-danger" },
      { variant: "solid", tone: "violet", className: "bg-violet-500" },
      { variant: "solid", tone: "teal", className: "bg-teal-500" },
    ],
    defaultVariants: {
      variant: "subtle",
      tone: "neutral",
    },
  },
);

const dotTone: Record<NonNullable<VariantProps<typeof badgeVariants>["tone"]>, string> = {
  neutral: "bg-fg-tertiary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  violet: "bg-violet-500",
  teal: "bg-teal-500",
};

function Badge({
  className,
  variant = "subtle",
  tone = "neutral",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant, tone }), className) },
      props,
    ),
    render,
    state: { slot: "badge", variant, tone },
  });
}

/** Small status dot. Inside a Badge it takes the badge tone unless `tone` is set. */
function BadgeDot({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof dotTone }) {
  return (
    <span
      data-slot="badge-dot"
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        tone
          ? dotTone[tone]
          : "bg-fg-tertiary group-data-[tone=info]/badge:bg-info group-data-[tone=success]/badge:bg-success group-data-[tone=warning]/badge:bg-warning group-data-[tone=danger]/badge:bg-danger group-data-[tone=violet]/badge:bg-violet-500 group-data-[tone=teal]/badge:bg-teal-500 group-data-[variant=solid]/badge:bg-white",
        className,
      )}
      {...props}
    />
  );
}

const counterVariants = cva(
  "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1.5 text-2xs font-medium tabular-nums",
  {
    variants: {
      tone: {
        neutral: "bg-surface-4 text-fg-secondary",
        accent: "bg-primary-subtle text-fg-accent",
        danger: "bg-danger text-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** Numeric count for nav items and tabs. */
function Counter({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof counterVariants>) {
  return (
    <span data-slot="counter" className={cn(counterVariants({ tone }), className)} {...props} />
  );
}

export { Badge, BadgeDot, Counter, badgeVariants, counterVariants };
