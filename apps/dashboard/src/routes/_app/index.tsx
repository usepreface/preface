import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { DatabaseIcon, HomeIcon, UsersIcon } from "@usepreface/ui/icons";

import { Person, RoleBadge } from "#/components/data-display/identity";
import { PageBar, PageContent } from "#/components/shell/page";
import { useOrganization } from "#/hooks/organizations";
import { usePerson } from "#/hooks/session";

import { HomeCard, HomeCardEmpty, SetupProgress, SetupSteps } from "./-components/home-parts";
import { InviteCard } from "./-components/invite-card";
import { InviteMembersDialog } from "./settings/-components/invite-members-dialog";

export const Route = createFileRoute("/_app/")({ component: OrganizationHome });

function OrganizationHome() {
  const { organization, access } = useOrganization();
  const person = usePerson();
  const [inviting, setInviting] = useState(false);
  const canInvite =
    access.permissions.includes("members.manage") &&
    access.permissions.includes("roles.assign") &&
    access.permissions.includes("roles.read");

  return (
    <>
      <PageBar
        crumbs={[{ label: "Home", icon: HomeIcon }]}
        actions={
          canInvite ? (
            <Button onClick={() => setInviting(true)}>
              <UsersIcon data-icon="inline-start" />
              Invite members
            </Button>
          ) : null
        }
      />
      <PageContent width="full" className="max-w-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-heading-2 text-foreground">
              {`Welcome to ${organization.metadata.name}, ${person.name.split(" ")[0]}`}
            </h1>
            <p className="text-sm text-fg-secondary">
              Your organization is ready. Manage your team while knowledge features are being built.
            </p>
          </div>
          {access.isOwner ? <SetupProgress done={0} total={3} /> : null}
        </div>
        {access.isOwner ? <SetupSteps /> : null}
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <HomeCard title="Sources" className="min-h-55">
            <HomeCardEmpty
              icon={DatabaseIcon}
              title="No sources yet"
              description="Knowledge sources and AI features are not available yet."
            />
          </HomeCard>
          {canInvite ? (
            <InviteCard onChooseRoles={() => setInviting(true)} />
          ) : (
            <HomeCard title="Your account" className="lg:w-90">
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <Person name={person.name} detail={person.email} />
                  </div>
                  {access.isOwner ? <RoleBadge role="Owner" /> : null}
                </div>
                {access.permissions.includes("teams.read") ? (
                  <Link to="/settings/teams" className={buttonVariants({ variant: "ghost" })}>
                    Your teams
                  </Link>
                ) : null}
              </div>
            </HomeCard>
          )}
        </div>
        {inviting && canInvite ? <InviteMembersDialog open onOpenChange={setInviting} /> : null}
      </PageContent>
    </>
  );
}
