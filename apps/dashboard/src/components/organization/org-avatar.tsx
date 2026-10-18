import { cn } from "@usepreface/ui/lib/utils";

import { initialsOf, toneOf } from "#/lib/identity";

const sizes = {
  sm: "size-6 rounded-[6px] text-xs",
  md: "size-8 rounded-lg text-sm",
  lg: "size-10 rounded-[10px] text-base",
  xl: "size-16 rounded-2xl text-2xl",
} as const;

/** Initials and a deterministic color until organization image support is available. */
export function OrgAvatar({
  name,
  size = "md",
  muted,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-white",
        muted ? "bg-fg-tertiary" : toneOf(name),
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
