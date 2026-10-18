import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { OrganizationId } from "@usepreface/protocol";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { PlusIcon, RefreshIcon, LogoutIcon } from "@usepreface/ui/icons";
import { NoOrganizationsIllustration } from "@usepreface/ui/illustrations";

import { organizationsAtom } from "#/atoms/organizations";
import { prefetchQuery } from "#/atoms/prefetch";
import { QueryState } from "#/components/api/query-state";
import { EmptyState } from "#/components/feedback/empty-state";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { PageContent, PageTitle } from "#/components/shell/page";
import { ShellLayout } from "#/components/shell/shell-layout";
import { useOrganizations } from "#/hooks/organizations";
import { usePerson, useSignOut } from "#/hooks/session";

import { OrganizationCard } from "./-components/organization-card";

export const Route = createFileRoute("/organizations/")({
  loader: ({ context, abortController }) =>
    prefetchQuery(context.atomRegistry, organizationsAtom(), abortController.signal),
  component: Organizations,
});
function Organizations() {
  const [cursor, setCursor] = useState<OrganizationId>();
  const organizations = useOrganizations(cursor);
  const person = usePerson();
  const signOut = useSignOut();
  return (
    <ShellLayout
      topBar={(props) => (
        <AppTopBar
          {...props}
          workspace={null}
          person={person}
          instanceOwner={person.instanceOwner}
          search={false}
        />
      )}
    >
      <PageContent width="md" className="gap-6 py-10 sm:py-12">
        <PageTitle
          title="Choose an organization"
          description={`Signed in as ${person.email}. Pick where you want to work.`}
          actions={
            person.instanceOwner ? (
              <Link to="/organizations/new" className={buttonVariants()}>
                <PlusIcon data-icon="inline-start" />
                New organization
              </Link>
            ) : null
          }
        />
        <QueryState query={organizations}>
          {organizations.data?.organizations.length === 0 ? (
            <EmptyState
              art={<NoOrganizationsIllustration />}
              title="You’re not in any organizations yet"
              description={`Organizations are invitation-only. Ask an admin to invite ${person.email}, then open the link in the email.`}
              actions={
                <>
                  <Button variant="outline" onClick={organizations.refetch}>
                    <RefreshIcon data-icon="inline-start" />
                    Check again
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={signOut.pending}
                    onClick={() => void signOut.run()}
                  >
                    <LogoutIcon data-icon="inline-start" />
                    Sign out
                  </Button>
                </>
              }
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {organizations.data?.organizations.map((organization) => (
                <OrganizationCard key={organization.id} organization={organization} />
              ))}
            </div>
          )}
        </QueryState>
        <div className="flex gap-3">
          {cursor ? (
            <Button variant="outline" onClick={() => setCursor(undefined)}>
              First page
            </Button>
          ) : null}
          {organizations.data?.nextCursor ? (
            <Button
              variant="outline"
              onClick={() => setCursor(organizations.data?.nextCursor ?? undefined)}
            >
              Next page
            </Button>
          ) : null}
        </div>
      </PageContent>
    </ShellLayout>
  );
}
