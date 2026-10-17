import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Progress } from "@usepreface/ui/components/progress";
import { AiChatIcon, PlusIcon, type IconComponent } from "@usepreface/ui/icons";
import {
  NoAIProviderIllustration,
  NoConnectorsIllustration,
  NoConversationsIllustration,
} from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";

type Step = {
  title: string;
  art: React.ComponentType<{ className?: string }>;
  text: string;
  cta: string;
  icon?: IconComponent;
};

const steps: Step[] = [
  {
    title: "Connect a source",
    art: NoConnectorsIllustration,
    text: "GitHub, Slack, Notion, Drive, websites or files. Preface indexes and keeps them fresh.",
    cta: "Connect source",
    icon: PlusIcon,
  },
  {
    title: "Choose an AI provider",
    art: NoAIProviderIllustration,
    text: "Use OpenAI, Anthropic, Azure or Bedrock, or a local model through Ollama.",
    cta: "Add provider",
  },
  {
    title: "Ask your first question",
    art: NoConversationsIllustration,
    text: "Try the playground once a source has synced. Every answer cites where it came from.",
    cta: "Open playground",
    icon: AiChatIcon,
  },
];

export function SetupProgress({ done }: { done: number }) {
  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-55">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-fg-secondary">Setup</span>
        <span className="text-fg-tertiary">
          {done} of {steps.length}
        </span>
      </div>
      <Progress value={(done / steps.length) * 100} aria-label="Setup progress" />
    </div>
  );
}

/** Figma "Empty organization": three numbered cards, the first one is the next step. */
export function SetupChecklist() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map(({ title, art: Art, text, cta, icon: Icon }, i) => (
        <li
          key={title}
          className="group/step flex animate-in flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-1 fill-mode-both duration-500 fade-in-0 slide-in-from-bottom-2 transition-[border-color,box-shadow] hover:border-border-default hover:shadow-sm"
          style={{ animationDelay: `${120 + i * 80}ms` }}
        >
          <div className="flex h-37.5 items-center justify-center border-b border-border-subtle bg-surface-2">
            <Art className="h-30 w-auto transition-transform duration-500 group-hover/step:-translate-y-0.5 group-hover/step:scale-[1.03] motion-reduce:transition-none" />
          </div>
          <div className="flex flex-1 flex-col items-start gap-2 p-4.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-surface-3 text-fg-secondary",
                )}
              >
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            </div>
            <p className="flex-1 text-13 text-fg-secondary">{text}</p>
            <Button variant={i === 0 ? "default" : "outline"} className="mt-1">
              {Icon ? <Icon data-icon="inline-start" /> : null}
              {cta}
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
