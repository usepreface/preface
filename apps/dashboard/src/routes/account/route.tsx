import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppTopBar } from "#/components/shell/app-top-bar";
import { ShellLayout } from "#/components/shell/shell-layout";
import { usePerson } from "#/hooks/session";

import { accountSidebar } from "./-components/account-sidebar";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

/** Account pages belong to the person, not an organization, so the top bar shows the instance. */
function AccountLayout() {
  const me = usePerson();
  return (
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
      sidebar={accountSidebar}
    >
      <Outlet />
    </ShellLayout>
  );
}
