import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@usepreface/ui/components/button";
import { LogoutIcon, PackageIcon } from "@usepreface/ui/icons";
import { SettingsCard } from "@usepreface/ui/preface/cards";

import { Permission } from "#/components/api/permission";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle } from "#/components/shell/page";
import {
  useOrganization,
  useArchiveOrganization,
  useLeaveOrganization,
} from "#/hooks/organizations";

import { OrganizationDetails } from "./-components/organization-details";
import { SettingsFrame } from "./-components/settings-frame";

export const Route = createFileRoute("/org/$slug/_app/settings/general")({
  component: () => (
    <Permission permission="organization.read">
      <General />
    </Permission>
  ),
});

function General() {
  const { organization, access } = useOrganization();
  const archive = useArchiveOrganization();
  const leave = useLeaveOrganization();
  const navigate = useNavigate();
  const [action, setAction] = useState<"archive" | "leave">();
  const pending = archive.pending || leave.pending;

  return (
    <SettingsFrame crumbs={[{ label: "General" }]}>
      <PageTitle title="General" description="Your organization’s name, URL and description." />
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
      {access.permissions.includes("organization.archive") ? (
        <SettingsCard
          danger
          title="Archive organization"
          description={`Block access to ${organization.metadata.name} while keeping its data. An owner can restore it from the organization picker.`}
          action={
            <Button variant="destructive-outline" onClick={() => setAction("archive")}>
              <PackageIcon data-icon="inline-start" />
              Archive organization
            </Button>
          }
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(undefined);
        }}
        pending={pending}
        icon={action === "archive" ? PackageIcon : LogoutIcon}
        tone={action === "archive" ? "danger" : "warning"}
        title={
          action === "archive"
            ? `Archive ${organization.metadata.name}?`
            : `Leave ${organization.metadata.name}?`
        }
        description={
          action === "archive"
            ? "Organization access is blocked until an owner restores it. Nothing is deleted."
            : "You lose your membership and team access immediately. Rejoining requires an invitation."
        }
        confirmText={action === "archive" ? organization.slug : undefined}
        confirmLabel={action === "archive" ? "Archive organization" : "Leave organization"}
        onConfirm={async () => {
          const input = { params: { organizationId: organization.id }, payload: {} };
          const response = action === "archive" ? await archive.run(input) : await leave.run(input);
          if (response) await navigate({ to: "/organizations" });
        }}
      />
    </SettingsFrame>
  );
}
