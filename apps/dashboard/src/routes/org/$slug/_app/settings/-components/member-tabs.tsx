import * as React from "react";

import { Button } from "@usepreface/ui/components/button";
import { PlusIcon } from "@usepreface/ui/icons";
import { InviteSentIllustration, NoResultsIllustration } from "@usepreface/ui/illustrations";

import { TableSkeleton } from "#/components/data-display/table-card";
import { matches, TableToolbar } from "#/components/data-display/table-toolbar";
import { EmptyState } from "#/components/feedback/empty-state";
import { members, type Invitation, type Member } from "#/lib/placeholder";
import { organizationRoles } from "#/lib/roles";

import { InvitationsTable } from "./invitations-table";
import { MembersTable, type MemberAction } from "./members-table";

const statusFilter = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "removed", label: "Removed" },
];

const roleFilter = [
  { value: "all", label: "All roles" },
  ...organizationRoles.map((role) => ({ value: role.name, label: role.name })),
];

export function MembersTab({
  loading,
  selected,
  onAction,
}: {
  loading: boolean;
  selected?: string;
  onAction?: (member: Member, action: MemberAction) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const rows = members.filter(
    (member) =>
      matches(search, member.name, member.email) &&
      (role === "all" || member.roles.includes(role)) &&
      (status === "all" || member.status === status),
  );

  return (
    <>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search name or email"
        filters={[
          { label: "Role", value: role, onChange: setRole, options: roleFilter },
          { label: "Status", value: status, onChange: setStatus, options: statusFilter },
        ]}
      />
      {loading ? (
        <TableSkeleton />
      ) : rows.length ? (
        <MembersTable members={rows} selected={selected} onAction={onAction} />
      ) : (
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
      )}
    </>
  );
}

export function InvitationsTab({
  invitations: rows,
  onInvite,
}: {
  invitations: readonly Invitation[];
  onInvite: () => void;
}) {
  const [search, setSearch] = React.useState("");
  if (!rows.length) {
    return (
      <EmptyState
        bordered
        art={<InviteSentIllustration />}
        title="No pending invitations"
        description="Invite people by email. They can join with an email code, Google or your organization’s SSO."
        actions={
          <Button onClick={onInvite}>
            <PlusIcon data-icon="inline-start" />
            Invite members
          </Button>
        }
      />
    );
  }
  return (
    <>
      <TableToolbar search={search} onSearch={setSearch} placeholder="Search email" />
      <InvitationsTable
        invitations={rows.filter((invitation) => matches(search, invitation.email))}
      />
    </>
  );
}
