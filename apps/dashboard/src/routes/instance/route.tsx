import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppTopBar } from "#/components/shell/app-top-bar";
import { me } from "#/components/shell/me";
import { ShellLayout } from "#/components/shell/shell-layout";

import { instanceSidebar } from "./-components/instance-sidebar";

export const Route = createFileRoute("/instance")({
  component: InstanceLayout,
});

/** Instance administration. The top bar shows the instance instead of an organization. */
function InstanceLayout() {
  return (
    <ShellLayout
      topBar={(props) => (
        <AppTopBar {...props} workspace={null} person={me} instanceOwner={me.instanceOwner} />
      )}
      sidebar={me.instanceOwner ? instanceSidebar : undefined}
    >
      <Outlet />
    </ShellLayout>
  );
}
