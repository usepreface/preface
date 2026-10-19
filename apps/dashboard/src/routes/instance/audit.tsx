import { createFileRoute } from "@tanstack/react-router";

import { ActivityLog } from "#/components/activity/activity-log";
import { PageTitle } from "#/components/shell/page";

import { InstancePage } from "./-components/instance-page";
export const Route = createFileRoute("/instance/audit")({ component: Activity });
function Activity() {
  return (
    <InstancePage crumbs={[{ label: "Activity" }]}>
      <PageTitle
        title="Instance activity"
        description="Instance administration and operator domain decisions. Organization history remains separate."
      />
      <ActivityLog />
    </InstancePage>
  );
}
