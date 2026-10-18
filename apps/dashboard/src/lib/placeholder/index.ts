/*
 * Sample data shown until the dashboard talks to the API. Every screen reads from here so names,
 * emails and counts stay consistent from one page to the next. Replace module by module as the
 * matching endpoints are wired up.
 */
export const placeholder = {
  instance: { name: "Acme Knowledge", host: "preface.acme.dev", version: "v1.4.0" },
  owner: { name: "Aisha Khan", email: "aisha@acme.dev", title: "Head of Support Engineering" },
  organization: { name: "Acme", slug: "acme" },
  links: {
    docs: "https://github.com/usepreface/preface#readme",
    github: "https://github.com/usepreface/preface",
  },
} as const;

/** Slugs the organization forms treat as taken, so the unavailable state can be seen. */
export const reservedSlugs: ReadonlySet<string> = new Set([
  "acme-old",
  "admin",
  "api",
  "settings",
  "preface",
]);

export * from "./organizations";
export * from "./people";
export * from "./roles";
export * from "./security";
export * from "./activity";
