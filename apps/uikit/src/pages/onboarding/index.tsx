import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@usepreface/ui/components/tabs";

import { EmptyOrgScreen } from "./empty-organization-screen";
import { InstanceScreen, type Owner } from "./instance-screen";
import { OrgScreen } from "./organization-screen";

// Interactive Figma specimens use local state; these screens do not call the API.
type Screen = "instance" | "instance-error" | "org" | "org-taken" | "empty";

const screens: [Screen, string][] = [
  ["instance", "Set up instance"],
  ["instance-error", "Instance · error"],
  ["org", "Create organization"],
  ["org-taken", "Slug taken"],
  ["empty", "Empty organization"],
];

export function OnboardingPage() {
  const [screen, setScreen] = React.useState<Screen>("instance");
  const [owner, setOwner] = React.useState<Owner>({
    instance: "Acme Knowledge",
    name: "Aisha Khan",
    email: "aisha@acme.dev",
  });
  const [org, setOrg] = React.useState({ name: "Acme", slug: "acme" });

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b bg-background px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 font-mono text-2xs text-fg-secondary">
          <span className="size-1.5 rounded-full bg-primary" />
          Figma · 56–57 Onboarding
        </span>
        <Tabs value={screen} onValueChange={(v) => setScreen(v as Screen)}>
          <TabsList aria-label="Onboarding screen" className="flex-wrap">
            {screens.map(([v, label]) => (
              <TabsTrigger key={v} value={v}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div key={screen} className="animate-in duration-300 fade-in-0">
        {screen === "instance" || screen === "instance-error" ? (
          <InstanceScreen
            key={screen}
            owner={owner}
            mismatch={screen === "instance-error"}
            onDone={(o) => {
              setOwner(o);
              setScreen("org");
            }}
          />
        ) : screen === "org" || screen === "org-taken" ? (
          <OrgScreen
            key={screen}
            email={owner.email}
            taken={screen === "org-taken"}
            onDone={(o) => {
              setOrg(o);
              setScreen("empty");
            }}
          />
        ) : (
          <EmptyOrgScreen owner={owner} org={org} />
        )}
      </div>
    </div>
  );
}
