import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { DownloadIcon } from "@usepreface/ui/icons";

import { ActivityLog } from "#/components/activity/activity-log";
import { PageTitle } from "#/components/shell/page";
import { feedback } from "#/lib/feedback";
import { organizationActivity, organizationBySlug } from "#/lib/placeholder";
import { previewSearch, previewState } from "#/lib/preview";

import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/org/$slug/_app/settings/audit")({
  head: () => ({ meta: [{ title: "Activity · Settings · Preface" }] }),
  validateSearch: previewSearch,
  component: Activity,
});

/** `?state=detail` opens an event; `?state=no-results` shows filters that match nothing. */
function Activity() {
  const { slug } = Route.useParams();
  const state = previewState(["detail", "no-results"], Route.useSearch().state);
  const organization = organizationBySlug(slug);

  return (
    <SettingsFrame
      crumbs={[{ label: "Activity" }]}
      width="full"
      actions={
        <Button variant="outline" onClick={feedback.notConnected}>
          <DownloadIcon data-icon="inline-start" />
          Export CSV
        </Button>
      }
    >
      <PageTitle
        title="Activity"
        description={`Every sign-in, permission and policy change in ${organization.name}. Kept for 400 days.`}
      />
      <ActivityLog
        events={organizationActivity}
        total={1284}
        narrow={state === "no-results"}
        selected={state === "detail" ? "member.role_changed" : undefined}
      />
    </SettingsFrame>
  );
}
