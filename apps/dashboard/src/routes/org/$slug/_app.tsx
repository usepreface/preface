import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppTopBar } from "#/components/shell/app-top-bar";
import { me } from "#/components/shell/me";
import { ShellLayout } from "#/components/shell/shell-layout";
import { organizationBySlug } from "#/lib/placeholder";

import { OrgSidebar } from "./-components/org-sidebar";

export const Route = createFileRoute("/org/$slug/_app")({
  component: OrganizationLayout,
});

/** Everything inside an organization: the top bar, the organization sidebar and the page. */
function OrganizationLayout() {
  const { slug } = Route.useParams();
  const organization = organizationBySlug(slug);
  const admin = organization.role === "Owner" || organization.role === "Admin";

  return (
    <ShellLayout
      topBar={(props) => (
        <AppTopBar
          {...props}
          workspace={organization.name}
          person={me}
          instanceOwner={me.instanceOwner}
        />
      )}
      sidebar={(props) => (
        <OrgSidebar {...props} slug={slug} name={organization.name} admin={admin} />
      )}
    >
      <Outlet />
    </ShellLayout>
  );
}
