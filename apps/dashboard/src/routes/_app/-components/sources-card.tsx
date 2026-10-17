import { Badge } from "@usepreface/ui/components/badge";
import { DatabaseIcon } from "@usepreface/ui/icons";

export function SourcesCard() {
  return (
    <section
      aria-labelledby="sources-title"
      className="flex min-h-48 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
        <h2 id="sources-title" className="flex-1 text-sm font-semibold text-foreground">
          Sources
        </h2>
        <Badge>0</Badge>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center">
        <DatabaseIcon className="size-5 text-icon-secondary" />
        <span className="text-sm font-medium text-foreground">No sources yet</span>
        <span className="text-xs text-fg-tertiary">
          Connected sources and their sync status will show up here.
        </span>
      </div>
    </section>
  );
}
