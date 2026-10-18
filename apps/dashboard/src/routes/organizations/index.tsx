import { useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import type { OrganizationId } from "@usepreface/protocol";
import { Button, buttonVariants } from "@usepreface/ui/components/button";

import { organizationsAtom } from "#/atoms/organizations";
import { prefetchQuery } from "#/atoms/prefetch";
import { QueryState } from "#/components/api/query-state";
import { Notice } from "#/components/feedback/notice";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { PageContent, PageTitle } from "#/components/shell/page";
import { ShellLayout } from "#/components/shell/shell-layout";
import { useOrganizations } from "#/hooks/organizations";
import { usePerson } from "#/hooks/session";

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
      <PageContent width="md" className="py-10">
        <PageTitle
          title="Choose an organization"
          description={`Signed in as ${person.email}.`}
          actions={
            person.instanceOwner ? (
              <Link to="/organizations/new" className={buttonVariants()}>
                New organization
              </Link>
            ) : null
          }
        />
        <QueryState query={organizations}>
          {organizations.data?.organizations.length === 0 ? (
            <Notice>
              You’re not in an organization yet. Ask an administrator to invite your email.
            </Notice>
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
