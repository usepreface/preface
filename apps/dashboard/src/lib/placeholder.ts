/*
 * Sample identity shown until the API is wired up: the instance, its owner and the first
 * organization. Every screen reads from here so the copy stays consistent.
 */
export const placeholder = {
  instance: { name: "Acme Knowledge", host: "preface.acme.dev", version: "v1.4.0" },
  owner: { name: "Aisha Khan", email: "aisha@acme.dev", initials: "AK" },
  organization: { name: "Acme", slug: "acme" },
  links: {
    docs: "https://github.com/usepreface/preface#readme",
    github: "https://github.com/usepreface/preface",
  },
} as const;

/** Slugs the setup screen treats as taken, so the unavailable state can be seen. */
export const reservedSlugs: ReadonlySet<string> = new Set(["admin", "api", "settings", "preface"]);
