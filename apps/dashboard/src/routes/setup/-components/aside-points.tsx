import type { IconComponent } from "@usepreface/ui/icons";

/** Icon tile, title and one line of copy, stacked. Used in the setup aside. */
export function AsidePoints({ items }: { items: [IconComponent, string, string][] }) {
  return (
    <ul className="flex w-full max-w-100 flex-col gap-3.5">
      {items.map(([Icon, title, text], i) => (
        <li
          key={title}
          className="flex animate-in gap-3 fill-mode-both duration-500 fade-in-0 slide-in-from-bottom-1"
          style={{ animationDelay: `${200 + i * 90}ms` }}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
            <Icon className="size-4 text-icon-accent" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{title}</span>
            <span className="text-xs text-fg-secondary">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
