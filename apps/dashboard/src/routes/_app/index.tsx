import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { HomeIcon, UsersIcon } from "@usepreface/ui/icons";
import { PageHeader } from "@usepreface/ui/preface/layout";

import { placeholder } from "../../lib/placeholder";
import { InviteCard } from "./-components/invite-card";
import { SetupChecklist, SetupProgress } from "./-components/setup-checklist";
import { SourcesCard } from "./-components/sources-card";

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: `Home · ${placeholder.organization.name} · Preface` }] }),
  component: Home,
});

/* Figma "Empty organization": the home page of an organization with nothing connected yet. */
function Home() {
  const { organization, owner } = placeholder;
  const firstName = owner.name.split(/\s+/)[0] ?? owner.name;

  return (
    <>
      <PageHeader
        icon={<HomeIcon />}
        title="Home"
        actions={
          <Button>
            <UsersIcon data-icon="inline-start" />
            <span className="max-sm:sr-only">Invite members</span>
          </Button>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-8 sm:py-7">
        <div className="flex animate-in flex-wrap items-end gap-4 duration-500 fade-in-0 slide-in-from-bottom-1">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-heading-2 text-foreground">
              Welcome to {organization.name}, {firstName}
            </h2>
            <p className="text-sm text-fg-secondary">
              Your organization is ready. Three steps to the first cited answer.
            </p>
          </div>
          <SetupProgress done={0} />
        </div>
        <SetupChecklist />
        <div className="grid flex-1 animate-in gap-4 fill-mode-both delay-300 duration-500 fade-in-0 lg:grid-cols-[1fr_380px]">
          <SourcesCard />
          <InviteCard />
        </div>
      </div>
    </>
  );
}
