import { ActivityIcon, BuildingIcon, DashboardIcon, KeyIcon } from "@usepreface/ui/icons";

import { NavSidebar, SidebarCard } from "#/components/shell/nav-sidebar";
import type { SidebarRender } from "#/components/shell/shell-layout";
import { Route as RootRoute } from "#/routes/__root";

export const instanceSidebar: SidebarRender = (props) => <InstanceSidebar {...props} />;
function InstanceSidebar(props: Parameters<SidebarRender>[0]) {
  const { instance } = RootRoute.useRouteContext();
  return (
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
            { label: "Your organizations", icon: BuildingIcon, link: { to: "/organizations" } },
          ],
        },
        {
          section: "Sign-in",
          items: [
            { label: "Google sign-in", icon: KeyIcon, link: { to: "/instance/authentication" } },
          ],
        },
        {
          section: "Records",
          items: [{ label: "Activity", icon: ActivityIcon, link: { to: "/instance/audit" } }],
        },
      ]}
      footer={
        <SidebarCard
          title={instance.instanceName}
          detail={`${window.location.host} · instance owner`}
        />
      }
    />
  );
}
