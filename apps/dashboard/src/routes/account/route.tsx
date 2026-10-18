import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppTopBar } from "#/components/shell/app-top-bar";
import { me } from "#/components/shell/me";
import { ShellLayout } from "#/components/shell/shell-layout";
import { placeholder } from "#/lib/placeholder";

import { accountSidebar } from "./-components/account-sidebar";

export const Route = createFileRoute("/account")({
  component: AccountLayout,
});

/** Account pages belong to the person, not an organization, so the top bar shows the last one. */
function AccountLayout() {
  return (
    <ShellLayout
      topBar={(props) => (
        <AppTopBar
          {...props}
          workspace={placeholder.organization.name}
          person={me}
          instanceOwner={me.instanceOwner}
        />
      )}
      sidebar={accountSidebar}
    >
      <Outlet />
    </ShellLayout>
  );
}
