import { createFileRoute, Outlet } from "@tanstack/react-router";

import { QueryState } from "#/components/api/query-state";
import { AccessDenied } from "#/components/feedback/access-denied";
import { AppTopBar } from "#/components/shell/app-top-bar";
import { ShellLayout } from "#/components/shell/shell-layout";
import { usePerson, useCapabilities } from "#/hooks/session";

import { instanceSidebar } from "./-components/instance-sidebar";

export const Route = createFileRoute("/instance")({
  component: InstanceLayout,
});

/** Instance administration. The top bar shows the instance instead of an organization. */
function InstanceLayout() {
  const me = usePerson();
  const capabilities = useCapabilities();
  return (
    <QueryState query={capabilities}>
      {capabilities.data?.canCreateOrganization ? (
        <ShellLayout
          topBar={(props) => (
            <AppTopBar
              {...props}
              workspace={null}
              person={me}
              instanceOwner={me.instanceOwner}
              search={false}
            />
          )}
          sidebar={me.instanceOwner ? instanceSidebar : undefined}
        >
          <Outlet />
        </ShellLayout>
      ) : (
        <AccessDenied description="Only instance owners can access instance settings." />
      )}
    </QueryState>
  );
}
