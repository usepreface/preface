import { BuildingIcon, ShieldIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { Person } from "#/components/data-display/identity";
import { NavSidebar } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { useOrganizations } from "#/hooks/organizations";
import { usePerson } from "#/hooks/session";

export const accountSidebar: SidebarRender = (props) => <AccountSidebar {...props} />;
function AccountSidebar(props: Parameters<SidebarRender>[0]) {
  const person = usePerson();
  const organizations = useOrganizations();
  return (
    <NavSidebar
      {...props}
      title="Account"
      groups={[
        {
          items: [
            { label: "Profile", icon: UserCircleIcon, link: { to: "/account/profile" } },
            { label: "Security", icon: ShieldIcon, link: { to: "/account/security" } },
          ],
        },
        {
          section: "Organizations",
          items: [
            ...(organizations.data?.organizations
              .filter((organization) => !organization.archivedAt)
              .map((organization) => ({
                label: organization.metadata.name,
                icon: BuildingIcon,
                link: { to: "/org/$slug" as const, params: { slug: organization.slug } },
              })) ?? []),
            { label: "All organizations", icon: BuildingIcon, link: { to: "/organizations" } },
          ],
        },
      ]}
      footer={
        <div className="rounded-lg border bg-surface-2 p-3">
          <Person
            name={person.name}
            detail={person.email + (person.instanceOwner ? " · instance owner" : "")}
            size="sm"
          />
        </div>
      }
    />
  );
}
