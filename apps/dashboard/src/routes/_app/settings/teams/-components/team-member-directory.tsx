import { useState } from "react";

import { Effect } from "effect";
import { Atom } from "effect/reactivity";

import type {
  TeamId,
  TeamMemberId,
  TeamPermission,
  OrganizationRoleId,
} from "@usepreface/protocol";
import type { PublicTeamMember } from "@usepreface/protocol/dto";
import { Button } from "@usepreface/ui/components/button";
import { DropdownMenuItem } from "@usepreface/ui/components/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@usepreface/ui/components/table";
import { PlusIcon, TrashIcon } from "@usepreface/ui/icons";

import { ApiClient } from "#/atoms/client";
import { collectPages } from "#/atoms/pagination";
import { QueryKeys } from "#/atoms/query-keys";
import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { Person, RoleBadge } from "#/components/data-display/identity";
import { RowActions } from "#/components/data-display/row-actions";
import { TableCard } from "#/components/data-display/table-card";
import { TableToolbar, matches } from "#/components/data-display/table-toolbar";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { useTeamMembers, useTeamsRemoveMember } from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";

import { MemberRolesDialog } from "../../-components/member-roles-dialog";
import { AddMembersDialog } from "./add-members-dialog";

const teamRolesAtom = Atom.family((teamId: TeamId) => {
  return ApiClient.runtime
    .atom(
      Effect.gen(function* () {
        const client = yield* ApiClient;
        return yield* collectPages((cursor?: OrganizationRoleId) =>
          client.teams
            .roles({
              params: { teamId },
              query: { limit: 100, ...(cursor ? { cursor } : {}) },
            })
            .pipe(Effect.map((page) => ({ values: page.roles, nextCursor: page.nextCursor }))),
        );
      }),
    )
    .pipe(ApiClient.runtime.factory.withReactivity([QueryKeys.authority, QueryKeys.organization]));
});
const useTeamRoles = toQuery((teamId: TeamId) => teamRolesAtom(teamId));
export function TeamMemberDirectory({
  teamId,
  permissions,
}: {
  teamId: TeamId;
  permissions: readonly TeamPermission[];
}) {
  const { access } = useOrganization();
  const [cursor, setCursor] = useState<TeamMemberId>();
  const members = useTeamMembers(teamId, cursor);
  const [search, setSearch] = useState("");
  const remove = useTeamsRemoveMember();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<typeof PublicTeamMember.Type>();
  const [removing, setRemoving] = useState<typeof PublicTeamMember.Type>();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <TableToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search team members on this page"
        />
        {permissions.includes("team.members.manage") &&
        access.permissions.includes("members.read") ? (
          <Button className="self-start" onClick={() => setAdding(true)}>
            <PlusIcon data-icon="inline-start" />
            Add members
          </Button>
        ) : null}
      </div>
      <QueryState query={members}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Team roles</TableHead>
                <TableHead className="w-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data?.members
                .filter((member) => matches(search, member.metadata.name))
                .map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Person name={member.metadata.name} detail={member.metadata.title} />
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {member.roles.map((role) => (
                          <RoleBadge
                            key={role.id}
                            role={role.name}
                            custom={role.kind === "custom"}
                          />
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      {permissions.includes("team.members.manage") ||
                      (permissions.includes("team.roles.assign") &&
                        permissions.includes("team.roles.read")) ? (
                        <RowActions label={`Actions for ${member.metadata.name}`}>
                          {permissions.includes("team.roles.assign") &&
                          permissions.includes("team.roles.read") ? (
                            <DropdownMenuItem onClick={() => setEditing(member)}>
                              Manage roles
                            </DropdownMenuItem>
                          ) : null}
                          {permissions.includes("team.members.manage") ? (
                            <DropdownMenuItem onClick={() => setRemoving(member)}>
                              Remove
                            </DropdownMenuItem>
                          ) : null}
                        </RowActions>
                      ) : null}
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
              params: { teamId, memberId: removing.memberId },
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
  const roles = useTeamRoles(teamId);
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
