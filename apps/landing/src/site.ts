/** Public facts about the site, used by metadata, the nav and the footer. */
export const site = {
  name: "Preface",
  title: "Preface: ask your company anything",
  description:
    "Preface is the open-source knowledge platform you host yourself. It reads GitHub, Slack, Notion and your docs, then answers in your widget, team chat and API with a source for every sentence.",
  origin: import.meta.env.LANDING_SITE.origin,
  indexable: import.meta.env.LANDING_SITE.indexable,
  github: "https://github.com/usepreface/preface",
  /** Until the docs site ships, documentation links go to the repository README. */
  docs: "https://github.com/usepreface/preface#readme",
  npm: "https://www.npmjs.com/org/usepreface",
  /** Where "Contact sales" and "Book a demo" go. Replace with the real inbox or form. */
  contact: "mailto:hello@preface.run",
  /** Social profiles shown in the footer. Leave a handle out until it exists. */
  socials: {
    github: "https://github.com/usepreface",
    npm: "https://www.npmjs.com/org/usepreface",
  } as Partial<Record<"github" | "x" | "discord" | "linkedin" | "youtube" | "npm", string>>,
} as const;
