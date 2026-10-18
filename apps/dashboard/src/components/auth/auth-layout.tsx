import type * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { DotGrid } from "@usepreface/ui/patterns";
import { SetupSteps } from "@usepreface/ui/preface/account-fields";

import { ThemeSwitch } from "#/components/theme-switch";
import { placeholder } from "#/lib/placeholder";

/*
 * The split layout from the onboarding designs, shared by setup, sign-in, invitations and SSO
 * recovery: the form on the left, a dotted aside on the right. The aside drops away below 1024 px.
 */
export function AuthLayout({
  steps,
  topRight,
  aside,
  children,
}: {
  steps?: { labels: string[]; current: number };
  topRight?: React.ReactNode;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-surface-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <header className="flex items-center justify-between gap-4">
          <PrefaceLogo size={22} />
          <div className="text-xs font-medium text-fg-tertiary">{topRight}</div>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-105 animate-in flex-col gap-5 duration-500 fade-in-0 slide-in-from-bottom-2">
            {steps ? <SetupSteps steps={steps.labels} current={steps.current} /> : null}
            {children}
          </div>
        </main>
        <AuthFooter />
      </div>
      <aside className="relative hidden flex-col items-center justify-center gap-7 overflow-hidden border-l border-border-subtle bg-surface-2 p-16 lg:flex">
        <DotGrid color="#98A1B0" opacity={0.18} gap={24} radius={1} />
        <div className="relative flex animate-in flex-col items-center gap-7 duration-700 fade-in-0">
          {aside}
        </div>
      </aside>
    </div>
  );
}

export function AuthFooter({ className }: { className?: string }) {
  const { instance, links } = placeholder;
  return (
    <footer className={className ?? "flex flex-wrap items-center justify-between gap-4 text-xs"}>
      <span className="text-fg-tertiary">
        {instance.name} · Preface {instance.version} · self-hosted at {instance.host}
      </span>
      <span className="flex items-center gap-4 font-medium text-fg-secondary">
        <a href={links.docs} className="hover:text-foreground">
          Help
        </a>
        <a href={links.github} className="hover:text-foreground">
          GitHub
        </a>
        <ThemeSwitch />
      </span>
    </footer>
  );
}

/** Page title and the sentence under it. */
export function AuthHeading({
  title,
  children,
  align = "start",
}: {
  title: string;
  children?: React.ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={
        align === "center" ? "flex flex-col items-center gap-2 text-center" : "flex flex-col gap-2"
      }
    >
      <h1
        className={
          align === "center" ? "text-heading-2 text-foreground" : "text-heading-1 text-foreground"
        }
      >
        {title}
      </h1>
      {children ? <p className="text-sm text-fg-secondary">{children}</p> : null}
    </div>
  );
}
