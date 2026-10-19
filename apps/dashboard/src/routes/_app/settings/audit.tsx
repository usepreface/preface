import { createFileRoute } from "@tanstack/react-router";

import { ActivityLog } from "#/components/activity/activity-log";
import { Permission } from "#/components/api/permission";
import { PageTitle } from "#/components/shell/page";
import { useOrganization } from "#/hooks/organizations";

import { SettingsFrame } from "./-components/settings-frame";
export const Route = createFileRoute("/_app/settings/audit")({
  component: () => (
    <Permission permission="audit.read">
      <Activity />
    </Permission>
  ),
});
function Activity() {
  const { organization } = useOrganization();
  return (
    <SettingsFrame crumbs={[{ label: "Activity" }]} width="full">
      <PageTitle
        title="Activity"
        description="Organization administration, membership and authentication events."
      />
      <ActivityLog organizationId={organization.id} />
    </SettingsFrame>
  );
}
