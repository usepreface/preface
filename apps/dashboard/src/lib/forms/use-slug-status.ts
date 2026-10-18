import * as React from "react";

import type { SlugStatus } from "@usepreface/ui/preface/account-fields";

import { reservedSlugs } from "#/lib/placeholder";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Whether a slug is free. Until the API is wired this checks `taken` (the instance's reserved
 * organization slugs by default) after a short pause, so the checking, available and taken
 * states all show up while typing. `current` is the saved slug, which is always available.
 */
export function useSlugStatus(
  slug: string,
  { current, taken = reservedSlugs }: { current?: string; taken?: ReadonlySet<string> } = {},
): SlugStatus {
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    setChecking(true);
    const id = window.setTimeout(() => setChecking(false), 350);
    return () => window.clearTimeout(id);
  }, [slug]);

  if (slug.length < 3 || !SLUG.test(slug)) return "idle";
  if (slug === current) return "available";
  if (checking) return "checking";
  return taken.has(slug) ? "taken" : "available";
}

/** Free alternatives to offer when a slug is taken. */
export function slugSuggestions(slug: string): string[] {
  return ["hq", "inc", "team", "labs", "co"]
    .map((suffix) => `${slug}-${suffix}`)
    .filter((candidate) => !reservedSlugs.has(candidate))
    .slice(0, 3);
}
