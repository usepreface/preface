import { BuildingIcon, ShieldIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { Person } from "#/components/data-display/identity";
import { NavSidebar } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { usePerson } from "#/hooks/session";

export const accountSidebar: SidebarRender = (props) => <AccountSidebar {...props} />;
function AccountSidebar(props: Parameters<SidebarRender>[0]) {
  const person = usePerson();
  return (
    <NavSidebar
      {...props}
      title="Account"
      groups={[
        {
          items: [
            { label: "Profile", icon: UserCircleIcon, link: { to: "/account/profile" } },
            { label: "Security", icon: ShieldIcon, link: { to: "/account/security" } },
            { label: "Organizations", icon: BuildingIcon, link: { to: "/organizations" } },
          ],
        },
      ]}
      footer={
        <div className="rounded-lg border bg-surface-2 p-3">
          <Person name={person.name} detail={person.email} size="sm" />
        </div>
      }
    />
  );
}
