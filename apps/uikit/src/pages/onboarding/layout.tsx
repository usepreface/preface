import * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Label } from "@usepreface/ui/components/label";
import { DotGrid } from "@usepreface/ui/patterns";
import { SetupSteps } from "@usepreface/ui/preface/account-fields";

export const DEMO_HOST = "preface.acme.dev/";

export function AuthLayout({
  step,
  aside,
  children,
}: {
  step: number;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100svh-6.25rem)] bg-surface-1 lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <PrefaceLogo size={22} />
          <span className="text-xs font-medium text-fg-tertiary">Step {step} of 2</span>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-105 flex-col gap-5">
            <SetupSteps steps={["Instance", "Organization"]} current={step} />
            {children}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-fg-tertiary">
            Preface v1.4.0 · self-hosted at {DEMO_HOST.slice(0, -1)}
          </span>
          <span className="flex gap-4 font-medium text-fg-secondary">
            <a href="#" className="hover:text-foreground">
              Docs
            </a>
            <a href="#" className="hover:text-foreground">
              GitHub
            </a>
          </span>
        </div>
      </div>
      <aside className="relative hidden flex-col items-center justify-center gap-7 overflow-hidden border-l border-border-subtle bg-surface-2 p-16 lg:flex">
        <DotGrid color="#98A1B0" opacity={0.18} gap={24} radius={1} />
        <div className="relative flex flex-col items-center gap-7">{aside}</div>
      </aside>
    </div>
  );
}

export function FormHeading({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-heading-1 text-foreground">{title}</h1>
      <p className="text-sm text-fg-secondary">{children}</p>
    </div>
  );
}

export function FormField({
  id,
  label,
  children,
  hints,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
  hints?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hints}
    </div>
  );
}

export const formInputClassName = "h-10 rounded-lg bg-surface-1 px-3 text-base md:text-base";
