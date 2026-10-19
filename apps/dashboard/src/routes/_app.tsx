import { useEffect } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { accessAtom, organizationAtom } from "#/atoms/organizations";
import { prefetchQuery } from "#/atoms/prefetch";
import { QueryState } from "#/components/api/query-state";
import { AuthenticationGate } from "#/components/organization/authentication-gate";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { ShellLayout } from "#/components/shell/shell-layout";
import { useAuthorityReset } from "#/hooks/authority";
import { OrganizationContext, useOrganizationDetail } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";
import { usePerson } from "#/hooks/session";

import { OrgSidebar } from "./_app/-components/org-sidebar";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, abortController }) => {
    context.atomRegistry.refresh(accessAtom);
    const access = await prefetchQuery(context.atomRegistry, accessAtom, abortController.signal);
    if (access.authentication.authenticationSatisfied) {
      await prefetchQuery(context.atomRegistry, organizationAtom(), abortController.signal);
    }
  },
  component: OrganizationLayout,
});
const useAccess = toQuery(() => accessAtom);
function OrganizationLayout() {
  const access = useAccess();
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") access.refetch();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [access.refetch]);
  return (
    <QueryState query={access}>
      {access.data?.authentication.authenticationSatisfied ? (
        <AuthorizedOrganization />
      ) : access.data ? (
        <AuthenticationGate methods={access.data.authentication} />
      ) : null}
    </QueryState>
  );
}
function AuthorizedOrganization() {
  const detail = useOrganizationDetail();
  const person = usePerson();
  const current = detail.data;
  const fingerprint = current
    ? `${current.organization.id}:${current.access.memberId}:${current.access.isOwner}:${current.access.permissions.toSorted().join(",")}`
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
                workspace={current?.organization.metadata.name ?? "Preface"}
                person={person}
                instanceOwner={person.instanceOwner}
                search={false}
              />
            )}
            sidebar={(props) => (
              <OrgSidebar {...props} name={current?.organization.metadata.name ?? "Preface"} />
            )}
          >
            <Outlet />
          </ShellLayout>
        </OrganizationContext.Provider>
      ) : null}
    </QueryState>
  );
}
