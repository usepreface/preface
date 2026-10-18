import {
  ActivityIcon,
  BuildingIcon,
  DashboardIcon,
  GlobeIcon,
  KeyIcon,
} from "@usepreface/ui/icons";

import { NavSidebar, SidebarCard } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { domainClaims, placeholder } from "#/lib/placeholder";

const waiting = domainClaims.filter((claim) => !claim.approved);
const nextClaim = waiting[0] ?? domainClaims[0];

/** Instance administration: overview, sign-in for every organization, and the record. */
export const instanceSidebar: SidebarRender = (props) => (
  <NavSidebar
    {...props}
    title="Instance"
    groups={[
      {
        items: [
          {
            label: "Overview",
            icon: DashboardIcon,
            link: { to: "/instance", activeOptions: { exact: true } },
          },
          { label: "Organizations", icon: BuildingIcon, link: { to: "/organizations" } },
        ],
      },
      {
        section: "Sign-in",
        items: [
          { label: "Google sign-in", icon: KeyIcon, link: { to: "/instance/authentication" } },
          {
            label: "Domain claims",
            icon: GlobeIcon,
            count: waiting.length,
            link: {
              to: "/instance/domains/$organizationId/$domainId",
              params: { organizationId: nextClaim.organization, domainId: nextClaim.domain },
            },
          },
        ],
      },
      {
        section: "Records",
        items: [{ label: "Activity", icon: ActivityIcon, link: { to: "/instance/audit" } }],
      },
    ]}
    footer={
      <SidebarCard
        title={`${placeholder.instance.name} · ${placeholder.instance.version}`}
        detail={`${placeholder.instance.host} · instance owner`}
      />
    }
  />
);
