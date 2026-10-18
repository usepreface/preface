import { useEffect, useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Schema } from "effect";

import { TeamId, type TeamPermission } from "@usepreface/protocol";
import { Button } from "@usepreface/ui/components/button";
import { TrashIcon } from "@usepreface/ui/icons";

import { QueryState } from "#/components/api/query-state";
import { AccessDenied } from "#/components/feedback/access-denied";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { PageTitle } from "#/components/shell/page";
import { useAuthorityReset } from "#/hooks/authority";
import { useTeam, useTeamAccess, useTeamsArchive } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";

import { SettingsFrame } from "../-components/settings-frame";
import { TeamDialog } from "./-components/team-dialog";
import { TeamMemberDirectory } from "./-components/team-member-directory";

export const Route = createFileRoute("/org/$slug/_app/settings/teams/$teamId")({
  component: TeamPage,
});
function TeamPage() {
  const teamId = Schema.decodeUnknownSync(TeamId)(Route.useParams().teamId);
  const { organization } = useOrganization();
  const access = useTeamAccess(organization.id, teamId);
  const blocked = useAuthorityReset(
    access.data
      ? `${teamId}:${access.data.isMember}:${access.data.permissions.toSorted().join(",")}`
      : undefined,
  );
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") access.refetch();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [access.refetch]);
  if (blocked)
    return (
      <p role="status" className="p-6">
        Checking team access…
      </p>
    );
  return (
    <QueryState query={access}>
      {access.data?.permissions.includes("team.read") ? (
        <TeamContent teamId={teamId} permissions={access.data.permissions} />
      ) : (
        <AccessDenied description="Your team role does not grant access." />
      )}
    </QueryState>
  );
}
function TeamContent({
  teamId,
  permissions,
}: {
  teamId: TeamId;
  permissions: readonly TeamPermission[];
}) {
  const { organization } = useOrganization();
  const query = useTeam(organization.id, teamId);
  const archive = useTeamsArchive();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  return (
    <SettingsFrame
      crumbs={[
        {
          label: "Teams",
          link: { to: "/org/$slug/settings/teams", params: { slug: organization.slug } },
        },
        { label: query.data?.metadata.name ?? "Team" },
      ]}
      actions={
        <>
          {permissions.includes("team.update") ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit team
            </Button>
          ) : null}
          {permissions.includes("team.archive") ? (
            <Button variant="outline" onClick={() => setArchiving(true)}>
              Archive team
            </Button>
          ) : null}
        </>
      }
    >
      <QueryState query={query}>
        <PageTitle
          title={query.data?.metadata.name ?? "Team"}
          description={query.data?.metadata.description}
        />
        {permissions.includes("team.members.read") ? (
          <TeamMemberDirectory teamId={teamId} permissions={permissions} />
        ) : null}
        {editing && query.data ? (
          <TeamDialog team={query.data} onClose={() => setEditing(false)} />
        ) : null}
      </QueryState>
      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        pending={archive.pending}
        icon={TrashIcon}
        title="Archive this team?"
        description="Members lose team access. There is no restore operation."
        confirmLabel="Archive team"
        confirmText={query.data?.slug}
        onConfirm={async () => {
          if (
            await archive.run({ params: { organizationId: organization.id, teamId }, payload: {} })
          )
            await navigate({
              to: "/org/$slug/settings/teams",
              params: { slug: organization.slug },
            });
        }}
      />
    </SettingsFrame>
  );
}
