import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { toast } from "@usepreface/ui/components/sonner";
import {
  AlertIcon,
  CheckCircleIcon,
  InfoIcon,
  LoaderIcon,
  SparklesIcon,
  XCircleIcon,
  ZapIcon,
} from "@usepreface/ui/icons";
import { GitHubLogo } from "@usepreface/ui/logos";
import { CodeSnippet } from "@usepreface/ui/preface/code-snippet";

import { Page, Section } from "../components/bench";

const wait = (ms: number, fail = false) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error("timeout")) : resolve()), ms),
  );

const demos: {
  title: string;
  note: string;
  icon: React.ReactNode;
  code: string;
  run: () => void;
}[] = [
  {
    title: "Default",
    note: "A short confirmation.",
    icon: <SparklesIcon />,
    code: `toast("Answer copied")`,
    run: () => toast("Answer copied"),
  },
  {
    title: "With description",
    note: "Title says what happened; description adds the detail.",
    icon: <InfoIcon />,
    code: `toast("Collection created", {\n  description: "Engineering runbooks · 3 sources",\n})`,
    run: () => toast("Collection created", { description: "Engineering runbooks · 3 sources" }),
  },
  {
    title: "Success",
    note: "Something finished that the user started.",
    icon: <CheckCircleIcon className="text-success" />,
    code: `toast.success("Source connected", {\n  description: "Notion · 1,284 pages queued for indexing",\n})`,
    run: () =>
      toast.success("Source connected", {
        description: "Notion · 1,284 pages queued for indexing",
      }),
  },
  {
    title: "Info",
    note: "Neutral news the user didn't ask for.",
    icon: <InfoIcon className="text-info" />,
    code: `toast.info("Re-indexing tonight", {\n  description: "GitHub sync moves to 02:00 UTC",\n})`,
    run: () => toast.info("Re-indexing tonight", { description: "GitHub sync moves to 02:00 UTC" }),
  },
  {
    title: "Warning",
    note: "Worth attention, nothing broken yet.",
    icon: <AlertIcon className="text-warning" />,
    code: `toast.warning("Approaching rate limit", {\n  description: "92% of 10,000 queries used this month",\n})`,
    run: () =>
      toast.warning("Approaching rate limit", {
        description: "92% of 10,000 queries used this month",
      }),
  },
  {
    title: "Error with retry",
    note: "Say what failed and offer the fix.",
    icon: <XCircleIcon className="text-danger" />,
    code: `toast.error("Sync failed", {\n  description: "GitHub returned 401. Reconnect to continue.",\n  action: { label: "Retry", onClick: retry },\n})`,
    run: () =>
      toast.error("Sync failed", {
        description: "GitHub returned 401. Reconnect to continue.",
        action: { label: "Retry", onClick: () => toast.success("Sync restarted") },
      }),
  },
  {
    title: "Undo",
    note: "Destructive actions get a way back.",
    icon: <ZapIcon />,
    code: `toast("API key revoked", {\n  description: "pf_live_…3f9a",\n  action: { label: "Undo", onClick: restore },\n})`,
    run: () =>
      toast("API key revoked", {
        description: "pf_live_…3f9a",
        action: { label: "Undo", onClick: () => toast.success("Key restored") },
      }),
  },
  {
    title: "Promise",
    note: "Loading, then success or failure, in one toast.",
    icon: <LoaderIcon />,
    code: `toast.promise(sync(), {\n  loading: "Syncing GitHub…",\n  success: "Synced 2,481 documents",\n  error: "Sync failed",\n})`,
    run: () => {
      toast.promise(wait(1800), {
        loading: "Syncing GitHub…",
        success: "Synced 2,481 documents",
        error: "Sync failed",
      });
    },
  },
  {
    title: "Custom icon",
    note: "Pass any node, like a company logo.",
    icon: <GitHubLogo />,
    code: `toast("Connected to acme/platform", {\n  icon: <GitHubLogo size={18} />,\n})`,
    run: () => toast("Connected to acme/platform", { icon: <GitHubLogo size={18} /> }),
  },
];

export function ToastsPage() {
  return (
    <Page
      title="Toasts"
      description="sonner, styled with the overlay surface, Hugeicons status icons and Preface buttons. Mount one Toaster near the root and call toast() from anywhere."
      actions={
        <Button
          variant="outline"
          onClick={() => {
            for (const [i, d] of demos.slice(2, 5).entries()) {
              setTimeout(d.run, i * 250);
            }
          }}
        >
          Show a stack
        </Button>
      }
    >
      <Section
        title="Variants"
        description="Click a card to fire it. Toasts stack bottom right; hover the stack to expand it."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <button
              key={d.title}
              type="button"
              onClick={d.run}
              className="group/toast flex flex-col gap-3 rounded-xl border bg-card p-4 text-left outline-none transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-border-default hover:shadow-sm focus-visible:ring-3 focus-visible:ring-focus-ring active:translate-y-0 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-md border bg-surface-2 text-icon [&_svg]:size-4">
                  {d.icon}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{d.title}</span>
                  <span className="truncate text-xs text-fg-secondary">{d.note}</span>
                </div>
                <span className="ml-auto text-xs font-medium text-fg-accent opacity-0 transition-opacity group-hover/toast:opacity-100">
                  Fire
                </span>
              </div>
              <pre className="no-scrollbar overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[11.5px] leading-[18px] text-fg-secondary">
                {d.code}
              </pre>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Setup">
        <CodeSnippet
          samples={[
            {
              label: "App.tsx",
              language: "tsx",
              code: `import { Toaster } from "@usepreface/ui/components/sonner"\n\nexport function App() {\n  return (\n    <ThemeProvider>\n      <Routes />\n      <Toaster position="bottom-right" />\n    </ThemeProvider>\n  )\n}`,
            },
            {
              label: "anywhere.ts",
              language: "ts",
              code: `import { toast } from "@usepreface/ui/components/sonner"\n\ntoast.success("Source connected")`,
            },
          ]}
        />
      </Section>
    </Page>
  );
}
