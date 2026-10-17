import {
  AiChatIcon,
  ChatIcon,
  ChevronDownIcon,
  DatabaseIcon,
  HomeIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { placeholder } from "../../../lib/placeholder";

const items: [string, IconComponent][] = [
  ["Home", HomeIcon],
  ["Ask", AiChatIcon],
  ["Sources", DatabaseIcon],
  ["Channels", ChatIcon],
  ["Members", UsersIcon],
];

/** A miniature of the sidebar the new organization will get. Updates as the name is typed. */
export function OrgPreview({ name, slug }: { name: string; slug: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-90 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-lg"
    >
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3.5">
        <span
          key={name.slice(0, 1)}
          className="flex size-8 animate-in items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground duration-300 zoom-in-90"
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="truncate font-mono text-2xs text-fg-tertiary">
            {placeholder.instance.host}/{slug}
          </span>
        </span>
        <ChevronDownIcon className="size-3.5 text-icon-secondary" />
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        {items.map(([label, Icon], i) => (
          <span
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              i === 0 ? "bg-selected font-medium text-foreground" : "text-fg-secondary",
            )}
          >
            <Icon className={cn("size-4", i === 0 ? "text-icon" : "text-icon-secondary")} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
