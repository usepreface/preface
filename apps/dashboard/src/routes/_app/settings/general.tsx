import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { LogoutIcon } from "@usepreface/ui/icons";
import { SettingsCard } from "@usepreface/ui/preface/cards";

import { Permission } from "#/components/api/permission";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle } from "#/components/shell/page";
import { useOrganization, useLeaveOrganization } from "#/hooks/organizations";

import { OrganizationDetails } from "./-components/organization-details";
import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/_app/settings/general")({
  component: () => (
    <Permission permission="organization.read">
      <General />
    </Permission>
  ),
});

function General() {
  const { organization } = useOrganization();
  const leave = useLeaveOrganization();
  const navigate = useNavigate();
  const [action, setAction] = useState<"leave">();
  const pending = leave.pending;

  return (
    <SettingsFrame crumbs={[{ label: "General" }]}>
      <PageTitle title="General" description="Your organization’s name and description." />
      <OrganizationDetails />
      <SettingsCard
        title="Leave organization"
        description={`You’ll lose access to ${organization.metadata.name} and its teams. The last owner must add another owner before leaving.`}
        action={
          <Button variant="outline" onClick={() => setAction("leave")}>
            <LogoutIcon data-icon="inline-start" />
            Leave organization
          </Button>
        }
      />
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(undefined);
        }}
        pending={pending}
        icon={LogoutIcon}
        tone="warning"
        title={`Leave ${organization.metadata.name}?`}
        description="You lose your membership and team access immediately. Rejoining requires an invitation."
        confirmLabel="Leave organization"
        onConfirm={async () => {
          const input = { payload: {} };
          const response = await leave.run(input);
          if (response) await navigate({ to: "/" });
        }}
      />
    </SettingsFrame>
  );
}
