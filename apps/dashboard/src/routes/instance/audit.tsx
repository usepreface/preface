import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { DownloadIcon } from "@usepreface/ui/icons";

import { ActivityLog } from "#/components/activity/activity-log";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { instanceActivity } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { InstancePage } from "./-components/instance-page";

export const Route = createFileRoute("/instance/audit")({
  head: () => ({ meta: [{ title: "Instance activity · Preface" }] }),
  validateSearch: previewSearch,
  component: InstanceActivity,
});

/** `?state=no-results` shows filters that match nothing. */
function InstanceActivity() {
  const state = previewState(["no-results"], Route.useSearch().state);
  return (
    <InstancePage
      crumbs={[{ label: "Activity" }]}
      actions={
        <Button variant="outline" onClick={feedback.notConnected}>
          <DownloadIcon data-icon="inline-start" />
          Export CSV
        </Button>
      }
    >
      <PageTitle
        title="Instance activity"
        description="Instance-level changes: Google sign-in, domain decisions and organizations."
      />
      <ActivityLog
        events={instanceActivity}
        total={212}
        typeLabel="All instance events"
        narrow={state === "no-results"}
      />
    </InstancePage>
  );
}
