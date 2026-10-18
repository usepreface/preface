import { BuildingIcon, ShieldIcon, UserCircleIcon } from "@usepreface/ui/icons";

import { Person } from "#/components/data-display/identity";
import { me } from "#/components/shell/me";
import { NavSidebar } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { organizations } from "#/lib/placeholder";

/** Profile and security, then shortcuts to every organization the person belongs to. */
export const accountSidebar: SidebarRender = (props) => (
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
        items: organizations
          .filter((organization) => organization.access !== "archived")
          .map((organization) => ({
            label: organization.name,
            icon: BuildingIcon,
            link: { to: "/org/$slug", params: { slug: organization.slug } },
          })),
      },
    ]}
    footer={
      <div className="rounded-lg border bg-surface-2 p-2.5">
        <Person
          name={me.name}
          detail={`${me.email}${me.instanceOwner ? " · instance owner" : ""}`}
          size="sm"
        />
      </div>
    }
  />
);
