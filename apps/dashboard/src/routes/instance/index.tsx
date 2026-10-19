import { createFileRoute } from "@tanstack/react-router";

import { PrefaceMark } from "@usepreface/ui/brand";
import { ActivityIcon, SettingsIcon } from "@usepreface/ui/icons";

import { IconTile } from "#/components/data-display/icon-tile";
import { Person } from "#/components/data-display/identity";
import { PageTitle } from "#/components/shell/page";

import { InstancePage } from "./-components/instance-page";
import { OverviewCard } from "./-components/overview-card";
export const Route = createFileRoute("/instance/")({ component: Overview });
function Overview() {
  const { instance, actor } = Route.useRouteContext();
  return (
    <InstancePage crumbs={[{ label: "Overview" }]}>
      <PageTitle
        title={instance.organizationName}
        leading={
          <span className="flex size-13 items-center justify-center rounded-[14px] bg-brand-slate">
            <PrefaceMark tone="ice" size={30} title="" />
          </span>
        }
        description={`${window.location.host} · self-hosted`}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <section className="flex flex-col gap-3 rounded-xl border bg-surface-1 p-5">
          <h2 className="text-sm font-semibold text-foreground">Instance operator</h2>
          <Person name={actor?.user.metadata.name ?? ""} detail={actor?.user.email} />
          <p className="text-caption text-fg-tertiary">
            Deployment administration and manual domain approvals.
          </p>
        </section>
        <OverviewCard
          media={<IconTile icon={SettingsIcon} size={32} />}
          title="Organization settings"
          detail="Manage the organization created during installation."
          action="Open"
          link={{ to: "/settings/general" }}
        />
        <OverviewCard
          media={<IconTile icon={ActivityIcon} size={32} />}
          title="Instance activity"
          detail="Review installation events and operator actions."
          action="Open"
          link={{ to: "/instance/audit" }}
        />
      </div>
    </InstancePage>
  );
}
