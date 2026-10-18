import {
  AiChatIcon,
  ChatIcon,
  ChevronDownIcon,
  DatabaseIcon,
  HomeIcon,
  UsersIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { NoOrganizationsIllustration } from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";

import { organizationUrl } from "#/lib/urls";

import { OrgAvatar } from "./org-avatar";

const items: [string, IconComponent][] = [
  ["Home", HomeIcon],
  ["Ask", AiChatIcon],
  ["Sources", DatabaseIcon],
  ["Channels", ChatIcon],
  ["Members", UsersIcon],
];

/** A miniature of the sidebar the new organization will get. Updates as the form is filled in. */
export function OrgPreview({ name, slug }: { name: string; slug: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-90 overflow-hidden rounded-2xl border border-border-subtle bg-surface-1 shadow-lg"
    >
      <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3.5">
        <OrgAvatar
          key={name.slice(0, 1)}
          name={name}
          className="animate-in duration-300 zoom-in-90"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">{name}</span>
          <span className="truncate font-mono text-2xs text-fg-tertiary">
            {organizationUrl(slug)}
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

/** The aside for the organization forms: illustration, then the live preview. */
export function OrgPreviewAside({ name, slug }: { name: string; slug: string }) {
  return (
    <>
      <NoOrganizationsIllustration className="h-64 w-auto" />
      <span className="text-2xs font-semibold tracking-widest text-fg-tertiary uppercase">
        Preview
      </span>
      <OrgPreview name={name || "Organization"} slug={slug || "your-org"} />
    </>
  );
}
