import { CopyCode } from "../components/asset";
import { Page, Section } from "../components/bench";

const styles: [utility: string, figma: string, spec: string, sample: string][] = [
  ["text-display-2xl", "Display/2XL", "Space Grotesk 80/84 · -3.5%", "Ask your company"],
  ["text-display-xl", "Display/XL", "Space Grotesk 64/68 · -3%", "Ask your company anything"],
  ["text-display-lg", "Display/L", "Space Grotesk 48/52 · -2.5%", "Answers with receipts"],
  ["text-display-md", "Display/M", "Space Grotesk 36/40 · -2%", "Connect your first source"],
  ["text-heading-1", "Heading/H1", "Space Grotesk 28/34 · -1.5%", "Knowledge sources"],
  ["text-heading-2", "Heading/H2", "Geist SemiBold 22/28 · -1.2%", "Retrieval settings"],
  ["text-heading-3", "Heading/H3", "Geist SemiBold 18/24 · -0.8%", "Single sign-on"],
  ["text-heading-4", "Heading/H4", "Geist SemiBold 15/20 · -0.4%", "Answers this week"],
  [
    "text-body-lg",
    "Body/L",
    "Geist 16/24",
    "Preface indexes GitHub, Slack, Notion, websites and files.",
  ],
  [
    "text-body-md",
    "Body/M",
    "Geist 14/20",
    "Staging credentials live in Vault under secret/staging/db.",
  ],
  ["text-body-sm", "Body/S", "Geist 13/18", "Notion · Engineering / Runbooks"],
  ["text-caption", "Caption", "Geist 12/16", "Synced 4m ago · 2,481 documents"],
  [
    "text-overline",
    "Overline",
    "JetBrains Mono Medium 11/14 · +6% · caps",
    "Every answer has a source",
  ],
  ["text-mono-md", "Mono/M", "JetBrains Mono 13/20", "docker compose up -d"],
  ["text-mono-sm", "Mono/S", "JetBrains Mono 12/16", "pf_live_…3f9a"],
  ["text-mono-xs", "Mono/XS", "JetBrains Mono 11/14", "14:02:11.384 INFO"],
];

export function TypePage() {
  return (
    <Page
      figma="06 Typography"
      title="Typography"
      description="Space Grotesk for display, Geist for interface, JetBrains Mono for code, IDs and labels. Click a class name to copy it."
    >
      <Section title="Families" className="grid gap-3 md:grid-cols-3">
        {[
          ["font-display", "Space Grotesk", "Display and headings"],
          ["font-sans", "Geist", "Interface text"],
          ["font-mono", "JetBrains Mono", "Code, keys, overlines"],
        ].map(([cls, name, use]) => (
          <div
            key={name}
            className="flex flex-col gap-3 rounded-xl border bg-card p-5 transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-sm"
          >
            <span className={`${cls} text-5xl leading-none`}>Aa</span>
            <span className={`${cls} truncate text-sm text-fg-secondary`}>
              ABCDEFGHIJKLM abcdefghijklm 0123456789
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-fg-tertiary">
                {use} · <CopyCode value={cls} toastLabel="Copied class" className="align-bottom" />
              </span>
            </div>
          </div>
        ))}
      </Section>
      <Section title="Text styles" description="Utilities named after the Figma text styles.">
        <div className="flex flex-col divide-y rounded-xl border bg-card">
          {styles.map(([utility, figma, spec, sample]) => (
            <div
              key={utility}
              className="grid grid-cols-[200px_1fr] items-baseline gap-6 px-5 py-4 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex flex-col gap-0.5">
                <CopyCode
                  value={utility}
                  toastLabel="Copied class"
                  className="text-xs text-fg-accent"
                />
                <span className="text-xs text-fg-secondary">{figma}</span>
                <span className="text-2xs text-fg-tertiary">{spec}</span>
              </div>
              <span className={`${utility} min-w-0 truncate text-foreground`}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Text colours" className="flex flex-col gap-2 rounded-xl border bg-card p-5">
        <span className="text-body-lg text-fg">text-fg · primary</span>
        <span className="text-body-lg text-fg-secondary">text-fg-secondary · secondary</span>
        <span className="text-body-lg text-fg-tertiary">text-fg-tertiary · tertiary</span>
        <span className="text-body-lg text-fg-disabled">text-fg-disabled · disabled</span>
        <span className="text-body-lg text-fg-accent">text-fg-accent · accent</span>
        <a href="#type" className="text-body-lg text-fg-link underline underline-offset-4">
          text-fg-link · link
        </a>
      </Section>
    </Page>
  );
}
