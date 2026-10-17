import type * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { DotGrid } from "@usepreface/ui/patterns";
import { SetupSteps } from "@usepreface/ui/preface/account-fields";

import { ThemeSwitch } from "../../../components/theme-switch";
import { placeholder } from "../../../lib/placeholder";

/*
 * Figma 56–57 setup frame: the form on the left, a dotted aside on the right with the step's
 * illustration. The aside drops away below 1024 px.
 */
export function SetupLayout({
  step,
  aside,
  children,
}: {
  step: 1 | 2;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-surface-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <header className="flex items-center justify-between">
          <PrefaceLogo size={22} />
          <span className="text-xs font-medium text-fg-tertiary">Step {step} of 2</span>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-105 animate-in flex-col gap-5 duration-500 fade-in-0 slide-in-from-bottom-2">
            <SetupSteps steps={["Instance", "Organization"]} current={step} />
            {children}
          </div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-fg-tertiary">
            Preface {placeholder.instance.version} · self-hosted at {placeholder.instance.host}
          </span>
          <span className="flex items-center gap-4 font-medium text-fg-secondary">
            <a href={placeholder.links.docs} className="hover:text-foreground">
              Docs
            </a>
            <a href={placeholder.links.github} className="hover:text-foreground">
              GitHub
            </a>
            <ThemeSwitch />
          </span>
        </footer>
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

export function SetupHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-heading-1 text-foreground">{title}</h1>
      <p className="text-sm text-fg-secondary">{children}</p>
    </div>
  );
}

/** Label, control and hints, stacked. */
export function SetupField({
  id,
  label,
  hints,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hints?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hints}
    </div>
  );
}

/** Inputs on these screens use the L size from Figma: 40 px tall, 16 px text. */
export const largeInput = "h-10 rounded-lg bg-surface-1 px-3 text-base md:text-base";
