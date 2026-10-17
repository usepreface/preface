import type * as React from "react";

import { AssistantMessage } from "@usepreface/ui/ai/chat";
import {
  CitationChip,
  CitationList,
  InlineCitation,
  type CitationSource,
} from "@usepreface/ui/ai/citation";
import {
  BotIcon,
  CheckCircleIcon,
  LinkIcon,
  LockIcon,
  McpIcon,
  ServerIcon,
  type IconComponent,
} from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { BrandLogo, type BrandName } from "@usepreface/ui/logos/registry";
import { MeshGradient } from "@usepreface/ui/patterns";
import { InstallCommand } from "@usepreface/ui/preface/developer";

import { GlassTile, Section, SectionHeading } from "./primitives";

/* Figma "Features": a five-card bento under "Built for answers you can check." */

const rotating: CitationSource = {
  index: 1,
  title: "Rotating staging credentials",
  source: "notion",
  path: "Engineering / Runbooks",
};
const deployYml: CitationSource = {
  index: 2,
  title: "deploy.yml · acme/platform",
  source: "github",
  path: "acme/platform / .github",
};
const citations: CitationSource[] = [
  rotating,
  deployYml,
  { index: 3, title: "#infra · Mar 12", source: "slack", path: "Slack · thread, 14 replies" },
];

const permissions: [string, BrandName, boolean][] = [
  ["runbooks/staging.md", "github", true],
  ["Security policy", "notion", true],
  ["#exec-only", "slack", false],
  ["payroll.xlsx", "google-drive", false],
];

/** Bento card. Phones get the compact version from the mobile design: icon, title, text. */
function Card({
  title,
  description,
  icon: Icon,
  className,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  icon: IconComponent;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  return (
    <article
      data-reveal=""
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
      className={cn(
        "group/card relative isolate flex flex-col overflow-hidden rounded-3xl border border-(--landing-card-border) bg-(--landing-card) transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-[0_20px_50px_rgb(23_71_201/0.08)]",
        className,
      )}
    >
      <div className="flex flex-col gap-2 p-5 md:p-7">
        <Icon size={22} className="mb-1 text-fg-accent md:hidden" />
        <h3 className="text-heading-3 text-foreground">{title}</h3>
        <p className="max-w-110 text-sm text-fg-secondary">{description}</p>
      </div>
      <div className="contents max-md:hidden">{children}</div>
    </article>
  );
}

export function Features() {
  return (
    <Section id="features" aria-labelledby="features-title" inner="gap-12">
      <SectionHeading
        id="features-title"
        eyebrow="Why teams switch"
        title="Built for answers you can check."
      />
      <div className="grid gap-4 lg:grid-cols-[712fr_472fr]">
        <Card
          title="Citations to the passage"
          icon={LinkIcon}
          description="Every claim links to a file and line range, a message, or a heading."
          className="md:min-h-105"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <MeshGradient
              colors={["#DCE8FF", "#C9DCFF"]}
              seed={1132}
              blur={120}
              className="dark:hidden"
            />
            <MeshGradient
              colors={["#0E1D4A", "#1747C9"]}
              seed={1132}
              blur={120}
              className="hidden opacity-70 dark:block"
            />
          </div>
          <div className="px-7 pb-8 sm:px-15 sm:pt-6">
            <AssistantMessage meta="3 sources · 1.4s" className="max-w-140">
              <p>
                Staging credentials live in Vault under <code>secret/staging/db</code>. Rotate them
                with the ops CLI, then restart the API pods so they pick up the new secret
                <InlineCitation citation={rotating} />.
              </p>
              <p>
                Rotation takes about two minutes. If a deploy is running, wait for it to finish -
                the pipeline pins the old secret until it completes
                <InlineCitation citation={deployYml} />.
              </p>
              <CitationList>
                {citations.map((c) => (
                  <CitationChip key={c.index} citation={c} />
                ))}
              </CitationList>
            </AssistantMessage>
          </div>
        </Card>
        <Card
          title="Self-hosted"
          icon={ServerIcon}
          description="Docker Compose or Helm. Your models, your network."
          className="md:min-h-105"
          delay={80}
        >
          <div className="flex flex-col gap-10 px-7 pt-4 pb-10 lg:pt-16">
            <InstallCommand command="docker compose up -d" className="w-fit max-w-full" />
            <div aria-hidden="true" className="flex gap-4">
              {(["docker", "kubernetes", "postgresql", "ollama"] as const).map((brand, i) => (
                <GlassTile
                  key={brand}
                  brand={brand}
                  size={64}
                  className="landing-float"
                  style={{ "--delay": `${-i * 1.3}s` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="-mt-8 grid gap-4 md:grid-cols-3">
        <Card
          title="Permissions travel"
          icon={LockIcon}
          description="Answers only cite what the asker can read."
          className="md:min-h-95"
        >
          <ul className="mt-auto flex flex-col gap-2 px-7 pb-7">
            {permissions.map(([file, brand, allowed]) => (
              <li
                key={file}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-13 font-medium",
                  allowed ? "bg-surface-2 text-foreground" : "bg-danger-bg text-fg-tertiary",
                )}
              >
                <BrandLogo name={brand} size={16} aria-hidden="true" />
                <span className="flex-1 truncate">{file}</span>
                {allowed ? (
                  <CheckCircleIcon size={16} className="text-success-fg" aria-label="Readable" />
                ) : (
                  <LockIcon size={16} className="text-danger-fg" aria-label="Not readable" />
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="Bots in thread"
          icon={BotIcon}
          description="Slack, Discord and Telegram, with feedback buttons."
          className="md:min-h-95"
          delay={80}
        >
          <div aria-hidden="true" className="mt-auto flex gap-4 px-7 pb-20">
            {(["slack", "discord", "telegram"] as const).map((brand, i) => (
              <GlassTile
                key={brand}
                brand={brand}
                size={72}
                rotate={[-6, 0, 6][i]}
                className="landing-float"
                style={{ "--delay": `${-i * 1.5}s` } as React.CSSProperties}
              />
            ))}
          </div>
        </Card>
        <Card
          title="MCP & AI SDK"
          icon={McpIcon}
          description="Your company context in Claude, Cursor and your own agents."
          className="md:min-h-95"
          delay={160}
        >
          <div aria-hidden="true" className="mt-auto grid w-fit grid-cols-2 gap-4 px-7 pb-10">
            {(["model-context-protocol", "claude", "cursor", "vercel"] as const).map((brand, i) => (
              <GlassTile
                key={brand}
                brand={brand}
                size={72}
                className="landing-float"
                style={{ "--delay": `${-i * 1.2}s` } as React.CSSProperties}
              />
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
