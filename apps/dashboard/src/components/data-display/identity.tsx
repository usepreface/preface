import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@usepreface/ui/components/avatar";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
import { cn } from "@usepreface/ui/lib/utils";

import { initialsOf, toneOf } from "#/lib/identity";

type AvatarSize = "xs" | "sm" | "default" | "lg" | "xl";

/** A person's initials on their colour. Profile images are out of scope for now. */
export function PersonAvatar({
  name,
  size = "default",
  className,
}: {
  name: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback className={cn("text-white", toneOf(name))}>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

/** Avatar, name and a second line (usually the email). */
export function Person({
  name,
  detail,
  size = "default",
  muted,
}: {
  name: string;
  detail?: string;
  size?: AvatarSize;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PersonAvatar name={name} size={size} />
      <div className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-sm font-medium",
            muted ? "text-fg-tertiary" : "text-foreground",
          )}
        >
          {name}
        </span>
        {detail ? <span className="truncate text-xs text-fg-tertiary">{detail}</span> : null}
      </div>
    </div>
  );
}

/** Overlapping avatars with an optional "+n". */
export function PeopleStack({
  names,
  max = 3,
  more,
}: {
  names: readonly string[];
  max?: number;
  more?: string;
}) {
  const extra = names.length - max;
  return (
    <div className="flex items-center gap-2">
      <AvatarGroup>
        {names.slice(0, max).map((name) => (
          <PersonAvatar key={name} name={name} size="sm" />
        ))}
        {extra > 0 ? <AvatarGroupCount>+{extra}</AvatarGroupCount> : null}
      </AvatarGroup>
      {more ? <span className="text-xs text-fg-tertiary">{more}</span> : null}
    </div>
  );
}

const roleTone: Record<string, "info" | "violet"> = { Owner: "info", Admin: "violet" };

/** Organization roles: built-in roles in their colour, custom roles in teal. */
export function RoleBadge({ role, custom }: { role: string; custom?: boolean }) {
  return (
    <Badge variant="outline" tone={custom ? "teal" : (roleTone[role] ?? "neutral")}>
      {role}
    </Badge>
  );
}

export function TeamBadge({ team }: { team: string }) {
  return (
    <Badge variant="outline">
      <BadgeDot />
      {team}
    </Badge>
  );
}
