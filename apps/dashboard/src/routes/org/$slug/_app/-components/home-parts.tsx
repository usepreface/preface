import type * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { Progress } from "@usepreface/ui/components/progress";
import { AiChatIcon, LayersIcon, PlusIcon, type IconComponent } from "@usepreface/ui/icons";
import {
  NoAIProviderIllustration,
  NoConnectorsIllustration,
  NoConversationsIllustration,
} from "@usepreface/ui/illustrations";
import { cn } from "@usepreface/ui/lib/utils";

import { feedback } from "#/lib/feedback";

const steps = [
  {
    art: NoConnectorsIllustration,
    title: "Connect a source",
    description:
      "GitHub, Slack, Notion, Drive, websites or files. Preface indexes and keeps them fresh.",
    action: { label: "Connect source", icon: PlusIcon, primary: true },
  },
  {
    art: NoAIProviderIllustration,
    title: "Choose an AI provider",
    description: "OpenAI, Anthropic, Azure, Bedrock or a local model through Ollama.",
    action: { label: "Add provider" },
  },
  {
    art: NoConversationsIllustration,
    title: "Ask your first question",
    description:
      "Try the playground once a source has synced. Every answer cites where it came from.",
    action: { label: "Open playground", icon: AiChatIcon },
  },
] satisfies {
  art: React.ComponentType<{ width?: number; className?: string }>;
  title: string;
  description: string;
  action: { label: string; icon?: IconComponent; primary?: boolean };
}[];

/** The three steps to a first cited answer, with how many are done. */
export function SetupSteps({ done = 0 }: { done?: number }) {
  return (
    <ol className="grid gap-4 lg:grid-cols-3">
      {steps.map((step, index) => {
        const Art = step.art;
        const Icon = step.action.icon;
        return (
          <li
            key={step.title}
            className="flex flex-col overflow-hidden rounded-xl border bg-surface-1"
          >
            <div className="flex h-37.5 items-center justify-center border-b bg-surface-2">
              <Art width={170} />
            </div>
            <div className="flex flex-1 flex-col items-start gap-2 p-4.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs font-medium",
                    index === done
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-3 text-fg-secondary",
                  )}
                >
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="flex-1 text-13 text-fg-secondary">{step.description}</p>
              <Button
                variant={step.action.primary ? "default" : "outline"}
                className="mt-1"
                onClick={feedback.notConnected}
              >
                {Icon ? <Icon data-icon="inline-start" /> : null}
                {step.action.label}
              </Button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function SetupProgress({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex w-55 flex-col gap-1.5">
      <div className="flex justify-between text-caption font-medium">
        <span className="text-fg-secondary">Setup</span>
        <span className="text-fg-tertiary">
          {done} of {total}
        </span>
      </div>
      <Progress value={(done / total) * 100} aria-label="Setup progress" />
    </div>
  );
}

/** A small card on the home page: a title, a count and its body. */
export function HomeCard({
  title,
  meta,
  className,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-surface-1", className)}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="flex-1 text-sm font-semibold text-foreground">{title}</h2>
        {meta}
      </div>
      {children}
    </section>
  );
}

/** The quiet empty body of a home card. */
export function HomeCardEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: IconComponent;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-6 py-8 text-center">
      <Icon className="size-5 text-icon-secondary" />
      <span className="text-sm font-medium text-foreground">{title}</span>
      {description ? <span className="text-caption text-fg-tertiary">{description}</span> : null}
    </div>
  );
}

/** One of the member's teams on the member home. */
export function TeamRow({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg border bg-surface-2">
        <LayersIcon className="size-4 text-icon-accent" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-caption text-fg-tertiary">{detail}</span>
      </span>
    </div>
  );
}
