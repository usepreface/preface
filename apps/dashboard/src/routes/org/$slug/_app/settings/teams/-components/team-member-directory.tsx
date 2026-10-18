import { useState } from "react";

import { Effect } from "effect";
import { Atom } from "effect/reactivity";

import type {
  OrganizationId,
  TeamId,
  TeamMemberId,
  TeamPermission,
  OrganizationRoleId,
} from "@usepreface/protocol";
import type { PublicTeamMember } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@usepreface/ui/components/table";
import { TrashIcon } from "@usepreface/ui/icons";

import { ApiClient } from "#/atoms/client";
import { collectPages } from "#/atoms/pagination";
import { QueryKeys } from "#/atoms/query-keys";
import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { useTeamMembers, useTeamsRemoveMember } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";

import { MemberRolesDialog } from "../../-components/member-roles-dialog";
import { AddMembersDialog } from "./add-members-dialog";

const teamRolesAtom = Atom.family((key: string) => {
  const [organizationId, teamId] = key.split(":") as [OrganizationId, TeamId];
  return ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* collectPages((cursor?: OrganizationRoleId) =>
          client.teams
            .roles({
              params: { organizationId, teamId },
              query: { limit: 100, ...(cursor ? { cursor } : {}) },
            })
            .pipe(Effect.map((page) => ({ values: page.roles, nextCursor: page.nextCursor }))),
        );
      }),
    )
    .pipe(
      ApiClient.runtime.factory.withReactivity([
        QueryKeys.authority,
        QueryKeys.organization(organizationId),
      ]),
    );
});
const useTeamRoles = toQuery((organizationId: OrganizationId, teamId: TeamId) =>
  teamRolesAtom(`${organizationId}:${teamId}`),
);
export function TeamMemberDirectory({
  teamId,
  permissions,
}: {
  teamId: TeamId;
  permissions: readonly TeamPermission[];
}) {
  const { organization, access } = useOrganization();
  const [cursor, setCursor] = useState<TeamMemberId>();
  const members = useTeamMembers(organization.id, teamId, cursor);
  const remove = useTeamsRemoveMember();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<typeof PublicTeamMember.Type>();
  const [removing, setRemoving] = useState<typeof PublicTeamMember.Type>();
  return (
    <div className="flex flex-col gap-4">
      {permissions.includes("team.members.manage") &&
      access.permissions.includes("members.read") ? (
        <Button className="self-start" onClick={() => setAdding(true)}>
          Add members
        </Button>
      ) : null}
      <QueryState query={members}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data?.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.metadata.name}</TableCell>
                  <TableCell>{member.roles.map((role) => role.name).join(", ")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {permissions.includes("team.roles.assign") &&
                      permissions.includes("team.roles.read") ? (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(member)}>
                          Manage roles
                        </Button>
                      ) : null}
                      {permissions.includes("team.members.manage") ? (
                        <Button size="sm" variant="ghost" onClick={() => setRemoving(member)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </QueryState>
      <Pagination cursor={cursor} nextCursor={members.data?.nextCursor} onChange={setCursor} />
      {adding ? <AddMembersDialog teamId={teamId} onClose={() => setAdding(false)} /> : null}
      {editing ? (
        <TeamRoleEditor teamId={teamId} member={editing} onClose={() => setEditing(undefined)} />
      ) : null}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(undefined);
        }}
        pending={remove.pending}
        icon={TrashIcon}
        title={`Remove ${removing?.metadata.name ?? "member"} from this team?`}
        description="Their organization membership remains active."
        confirmLabel="Remove from team"
        onConfirm={async () => {
          if (
            removing &&
            (await remove.run({
              params: { organizationId: organization.id, teamId, memberId: removing.memberId },
            }))
          )
            setRemoving(undefined);
        }}
      />
    </div>
  );
}
function TeamRoleEditor({
  teamId,
  member,
  onClose,
}: {
  teamId: TeamId;
  member: typeof PublicTeamMember.Type;
  onClose: () => void;
}) {
  const { organization } = useOrganization();
  const roles = useTeamRoles(organization.id, teamId);
  return (
    <QueryState query={roles}>
      {roles.data ? (
        <MemberRolesDialog
          teamId={teamId}
          memberId={member.memberId}
          name={member.metadata.name}
          roles={roles.data}
          onClose={onClose}
        />
      ) : null}
    </QueryState>
  );
}
