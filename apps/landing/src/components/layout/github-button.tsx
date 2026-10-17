import { cn } from "@usepreface/ui/lib/utils";
import { GitHubLogo } from "@usepreface/ui/logos";

import { formatStars } from "../../lib/format-stars";
import { site } from "../../site";

export function GitHubButton({ stars, className }: { stars: number | null; className?: string }) {
  return (
    <a
      href={site.github}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border border-border-default px-3 text-fg-secondary outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring",
        className,
      )}
    >
      <GitHubLogo size={16} variant="auto" aria-hidden="true" />
      <span className="font-mono text-xs">{stars === null ? "Star" : formatStars(stars)}</span>
      <span className="sr-only">
        {stars === null ? "Preface on GitHub" : `Preface on GitHub, ${stars} stars`}
      </span>
    </a>
  );
}
