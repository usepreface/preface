import { LayersIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

/** Teams don't have images; they share one layered icon on a tile. */
export function TeamTile({ size = "md", archived }: { size?: "md" | "lg"; archived?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center border border-border-subtle",
        size === "md"
          ? "size-8 rounded-lg bg-surface-2 [&_svg]:size-4"
          : "size-12 rounded-xl bg-primary-subtle [&_svg]:size-5.5",
      )}
    >
      <LayersIcon className={archived ? "text-icon-secondary" : "text-icon-accent"} />
    </span>
  );
}
