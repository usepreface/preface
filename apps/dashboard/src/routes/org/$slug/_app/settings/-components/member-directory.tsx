import { useState } from "react";

import type { OrganizationMemberId } from "@usepreface/protocol";
import type { PublicOrganizationMember } from "@usepreface/protocol/dto";
import { Badge, BadgeDot } from "@usepreface/ui/components/badge";
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
import { TrashIcon } from "@usepreface/ui/icons";
import { NoResultsIllustration } from "@usepreface/ui/illustrations";

import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { Person, RoleBadge } from "#/components/data-display/identity";
import { RowActions } from "#/components/data-display/row-actions";
import { TableCard } from "#/components/data-display/table-card";
import { TableToolbar, matches } from "#/components/data-display/table-toolbar";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { EmptyState } from "#/components/feedback/empty-state";
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
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const rows = members.data?.members.filter(
    (member) =>
      matches(search, member.metadata.name, member.metadata.title ?? "") &&
      (role === "all" || member.roles.some((assigned) => assigned.id === role)) &&
      (status === "all" ||
        status === (member.removedAt ? "removed" : member.suspendedAt ? "suspended" : "active")),
  );
  const roleOptions = [
    ...new Map(
      members.data?.members.flatMap((member) =>
        member.roles.map(
          (assigned) => [assigned.id, { value: assigned.id, label: assigned.name }] as const,
        ),
      ),
    ).values(),
  ];

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
      <TableToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search members on this page"
        filters={[
          {
            label: "Role",
            value: role,
            onChange: setRole,
            options: [{ value: "all", label: "All roles" }, ...roleOptions],
          },
          {
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
              { value: "removed", label: "Removed" },
            ],
          },
        ]}
      />
      <QueryState query={members}>
        {rows?.length === 0 ? (
          <EmptyState
            bordered
            art={<NoResultsIllustration />}
            title="No members match"
            description="Try another name, or clear the filters."
            actions={
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRole("all");
                  setStatus("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-0">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Person
                        name={member.metadata.name}
                        detail={member.metadata.title}
                        muted={Boolean(member.removedAt)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {member.roles.map((assigned) => (
                          <RoleBadge
                            key={assigned.id}
                            role={assigned.name}
                            custom={assigned.kind === "custom"}
                          />
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          member.removedAt ? "neutral" : member.suspendedAt ? "warning" : "success"
                        }
                      >
                        <BadgeDot />
                        {member.removedAt ? "Removed" : member.suspendedAt ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(member.joinedAt)}</TableCell>
                    <TableCell>
                      {!member.removedAt &&
                      (access.isOwner ||
                        access.permissions.includes("members.manage") ||
                        (access.permissions.includes("roles.assign") &&
                          access.permissions.includes("roles.read"))) ? (
                        <RowActions label={`Actions for ${member.metadata.name}`}>
                          {!member.removedAt &&
                          !member.suspendedAt &&
                          access.permissions.includes("roles.assign") &&
                          access.permissions.includes("roles.read") ? (
                            <DropdownMenuItem onClick={() => setEditing(member)}>
                              Manage roles
                            </DropdownMenuItem>
                          ) : null}
                          {!member.removedAt && access.permissions.includes("members.manage") ? (
                            <>
                              {member.suspendedAt ? (
                                <DropdownMenuItem
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
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setAction({ member, kind: "suspend" })}
                                >
                                  Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setAction({ member, kind: "remove" })}
                              >
                                Remove
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {access.isOwner && !member.removedAt && !member.suspendedAt ? (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setAction({
                                    member,
                                    kind: member.roles.some(
                                      (assigned) =>
                                        assigned.key === "owner" && assigned.kind === "builtin",
                                    )
                                      ? "revokeOwner"
                                      : "grantOwner",
                                  })
                                }
                              >
                                {member.roles.some(
                                  (assigned) =>
                                    assigned.key === "owner" && assigned.kind === "builtin",
                                )
                                  ? "Revoke ownership"
                                  : "Make owner"}
                              </DropdownMenuItem>
                              {member.id !== access.memberId ? (
                                <DropdownMenuItem
                                  onClick={() => setAction({ member, kind: "transfer" })}
                                >
                                  Transfer ownership
                                </DropdownMenuItem>
                              ) : null}
                            </>
                          ) : null}
                        </RowActions>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        )}
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
