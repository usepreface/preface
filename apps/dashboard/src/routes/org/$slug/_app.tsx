import { useEffect } from "react";

import { createFileRoute, Outlet, notFound } from "@tanstack/react-router";

import { organizationBySlugAtom, selectionAtom, organizationAtom } from "#/atoms/organizations";
import { prefetchQuery } from "#/atoms/prefetch";
import { QueryState } from "#/components/api/query-state";
import { AuthenticationGate } from "#/components/organization/authentication-gate";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { ShellLayout } from "#/components/shell/shell-layout";
import { useAuthorityReset } from "#/hooks/authority";
import { OrganizationContext, useOrganizationDetail } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";
import { usePerson } from "#/hooks/session";

import { OrgSidebar } from "./-components/org-sidebar";

export const Route = createFileRoute("/org/$slug/_app")({
  beforeLoad: async ({ context, params, abortController }) => {
    const organization = await prefetchQuery(
      context.atomRegistry,
      organizationBySlugAtom(params.slug),
      abortController.signal,
    );
    if (!organization) throw notFound();
    context.atomRegistry.refresh(selectionAtom(organization.id));
    const selected = await prefetchQuery(
      context.atomRegistry,
      selectionAtom(organization.id),
      abortController.signal,
    );
    if (selected.authentication.authenticationSatisfied) {
      context.atomRegistry.refresh(organizationAtom(organization.id));
      await prefetchQuery(
        context.atomRegistry,
        organizationAtom(organization.id),
        abortController.signal,
      );
    }
    return { organization };
  },
  component: OrganizationLayout,
});
const useSelection = toQuery(selectionAtom);
function OrganizationLayout() {
  const { organization } = Route.useRouteContext();
  const selection = useSelection(organization.id);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") selection.refetch();
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [selection.refetch]);
  return (
    <QueryState query={selection}>
      {selection.data?.authentication.authenticationSatisfied ? (
        <AuthorizedOrganization />
      ) : selection.data ? (
        <AuthenticationGate
          organizationId={organization.id}
          slug={organization.slug}
          methods={selection.data.authentication}
        />
      ) : null}
    </QueryState>
  );
}
function AuthorizedOrganization() {
  const { organization } = Route.useRouteContext();
  const detail = useOrganizationDetail(organization.id);
  const person = usePerson();
  const current = detail.data;
  const fingerprint = current
    ? `${organization.id}:${current.access.memberId}:${current.access.isOwner}:${current.access.permissions.toSorted().join(",")}`
    : undefined;
  const blocked = useAuthorityReset(fingerprint);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") detail.refetch();
    };
    const interval = window.setInterval(refresh, 30_000);
    return () => {
      window.clearInterval(interval);
    };
  }, [detail.refetch]);
  if (blocked)
    return (
      <p role="status" className="p-6">
        Checking organization access…
      </p>
    );
  return (
    <QueryState query={detail}>
      {detail.data ? (
        <OrganizationContext.Provider value={detail.data}>
          <ShellLayout
            topBar={(props) => (
              <AppTopBar
                {...props}
                workspace={current?.organization.metadata.name ?? organization.metadata.name}
                person={person}
                instanceOwner={person.instanceOwner}
                search={false}
              />
            )}
            sidebar={(props) => (
              <OrgSidebar
                {...props}
                slug={organization.slug}
                name={current?.organization.metadata.name ?? organization.metadata.name}
              />
            )}
          >
            <Outlet />
          </ShellLayout>
        </OrganizationContext.Provider>
      ) : null}
    </QueryState>
  );
}
