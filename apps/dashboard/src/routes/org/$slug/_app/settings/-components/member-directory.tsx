import { useState } from "react";

import type { OrganizationMemberId } from "@usepreface/protocol";
import type { PublicOrganizationMember } from "@usepreface/protocol/dto";
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

import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import {
  useAllRoles,
  useOrganizationMembersSuspend,
  useOrganizationMembersReinstate,
  useOrganizationMembersRemove,
  useOrganizationOwnershipGrant,
  useOrganizationOwnershipRevoke,
  useOrganizationOwnershipTransfer,
} from "#/hooks/membership";
import { useMembers, useOrganization } from "#/hooks/organizations";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";

import { MemberRolesDialog } from "./member-roles-dialog";

type Action = {
  member: PublicOrganizationMember;
  kind: "suspend" | "remove" | "grantOwner" | "revokeOwner" | "transfer";
};
export function MemberDirectory() {
  const { organization, access } = useOrganization();
  const [cursor, setCursor] = useState<OrganizationMemberId>();
  const members = useMembers(organization.id, cursor);
  const [editing, setEditing] = useState<PublicOrganizationMember>();
  const [action, setAction] = useState<Action>();
  const suspend = useOrganizationMembersSuspend();
  const reinstate = useOrganizationMembersReinstate();
  const remove = useOrganizationMembersRemove();
  const grantOwner = useOrganizationOwnershipGrant();
  const revokeOwner = useOrganizationOwnershipRevoke();
  const transfer = useOrganizationOwnershipTransfer();
  const pending =
    suspend.pending ||
    remove.pending ||
    grantOwner.pending ||
    revokeOwner.pending ||
    transfer.pending;
  return (
    <div className="flex flex-col gap-4">
      <QueryState query={members}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data?.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.metadata.name}</TableCell>
                  <TableCell>
                    {member.roles.map((role) => role.name).join(", ") || "No roles"}
                  </TableCell>
                  <TableCell>
                    {member.removedAt ? "Removed" : member.suspendedAt ? "Suspended" : "Active"}
                  </TableCell>
                  <TableCell>{formatDate(member.joinedAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {!member.removedAt &&
                      !member.suspendedAt &&
                      access.permissions.includes("roles.assign") &&
                      access.permissions.includes("roles.read") ? (
                        <Button size="sm" variant="ghost" onClick={() => setEditing(member)}>
                          Manage roles
                        </Button>
                      ) : null}
                      {!member.removedAt && access.permissions.includes("members.manage") ? (
                        <>
                          {member.suspendedAt ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={reinstate.pending}
                              onClick={async () => {
                                if (
                                  await reinstate.run({
                                    params: {
                                      organizationId: organization.id,
                                      memberId: member.id,
                                    },
                                    payload: {},
                                  })
                                )
                                  feedback.done("Member reinstated");
                              }}
                            >
                              Reinstate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAction({ member, kind: "suspend" })}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAction({ member, kind: "remove" })}
                          >
                            Remove
                          </Button>
                        </>
                      ) : null}
                      {access.isOwner && !member.removedAt && !member.suspendedAt ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setAction({
                                member,
                                kind: member.roles.some(
                                  (role) => role.key === "owner" && role.kind === "builtin",
                                )
                                  ? "revokeOwner"
                                  : "grantOwner",
                              })
                            }
                          >
                            {member.roles.some(
                              (role) => role.key === "owner" && role.kind === "builtin",
                            )
                              ? "Revoke ownership"
                              : "Make owner"}
                          </Button>
                          {member.id !== access.memberId ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAction({ member, kind: "transfer" })}
                            >
                              Transfer ownership
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
        {members.data?.members.length === 0 ? (
          <p className="p-4 text-sm text-fg-secondary">No members on this page.</p>
        ) : null}
      </QueryState>
      <Pagination
        cursor={cursor}
        nextCursor={members.data?.nextCursor}
        onChange={setCursor}
        pending={members.isFetching}
      />
      {editing ? <MemberRoleEditor member={editing} onClose={() => setEditing(undefined)} /> : null}
      <ConfirmDialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(undefined);
        }}
        icon={TrashIcon}
        title={`${action?.kind === "grantOwner" ? "Grant ownership to" : action?.kind === "revokeOwner" ? "Revoke ownership from" : action?.kind === "transfer" ? "Transfer ownership to" : action?.kind === "suspend" ? "Suspend" : "Remove"} ${action?.member.metadata.name ?? "member"}?`}
        description="This changes the member’s authority immediately. The server protects the last usable owner."
        confirmLabel="Confirm change"
        pending={pending}
        onConfirm={async () => {
          if (!action) return;
          const input = {
            params: { organizationId: organization.id, memberId: action.member.id },
            payload: {},
          };
          const response =
            action.kind === "suspend"
              ? await suspend.run(input)
              : action.kind === "remove"
                ? await remove.run(input)
                : action.kind === "grantOwner"
                  ? await grantOwner.run(input)
                  : action.kind === "revokeOwner"
                    ? await revokeOwner.run(input)
                    : await transfer.run({
                        params: { organizationId: organization.id },
                        payload: { targetMemberId: action.member.id },
                      });
          if (response) {
            feedback.done("Membership updated");
            setAction(undefined);
          }
        }}
      />
    </div>
  );
}
function MemberRoleEditor({
  member,
  onClose,
}: {
  member: PublicOrganizationMember;
  onClose: () => void;
}) {
  const { organization } = useOrganization();
  const roles = useAllRoles(organization.id);
  return (
    <QueryState query={roles}>
      {roles.data ? (
        <MemberRolesDialog
          memberId={member.id}
          name={member.metadata.name}
          roles={roles.data.filter((role) => role.scopeKind === "organization")}
          onClose={onClose}
        />
      ) : null}
    </QueryState>
  );
}
