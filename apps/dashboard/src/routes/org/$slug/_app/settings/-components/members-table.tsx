import { Button } from "@usepreface/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@usepreface/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { AlertIcon, KeyIcon, MoreHorizontalIcon, TrashIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";

import { Person, RoleBadge, TeamBadge } from "#/components/data-display/identity";
import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { me } from "#/components/shell/me";
import type { Member } from "#/lib/placeholder";
import { isCustomRole } from "#/lib/roles";
import { memberStatus } from "#/lib/status";

export type MemberAction = "roles" | "suspend" | "remove";

/** Everyone in the organization. Without `onAction` the table is read-only. */
export function MembersTable({
  members,
  selected,
  onAction,
}: {
  members: readonly Member[];
  selected?: string;
  onAction?: (member: Member, action: MemberAction) => void;
}) {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="max-lg:hidden">Teams</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-md:hidden">Last active</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const removed = member.status === "removed";
            return (
              <TableRow
                key={member.email}
                data-state={member.name === selected ? "selected" : undefined}
              >
                <TableCell>
                  <Person name={member.name} detail={member.email} muted={removed} />
                </TableCell>
                <TableCell>
                  <span className="flex flex-wrap gap-1">
                    {member.roles.map((role) => (
                      <RoleBadge key={role} role={role} custom={isCustomRole(role)} />
                    ))}
                  </span>
                </TableCell>
                <TableCell className="max-lg:hidden">
                  {member.teams.length ? (
                    <span className="flex flex-wrap gap-1">
                      {member.teams.map((team) => (
                        <TeamBadge key={team} team={team} />
                      ))}
                    </span>
                  ) : (
                    <span className="text-fg-tertiary">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={memberStatus[member.status]} />
                </TableCell>
                <TableCell
                  className={cn(
                    "max-md:hidden",
                    removed ? "text-fg-tertiary" : "text-fg-secondary",
                  )}
                >
                  {member.lastActive}
                </TableCell>
                <TableCell className="text-right">
                  {member.email === me.email ? (
                    <span className="pr-2 text-caption text-fg-tertiary">You</span>
                  ) : onAction && !removed ? (
                    <MemberMenu member={member} onAction={onAction} />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}

function MemberMenu({
  member,
  onAction,
}: {
  member: Member;
  onAction: (member: Member, action: MemberAction) => void;
}) {
  const suspended = member.status === "suspended";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`} />}
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onAction(member, "roles")}>
          <KeyIcon />
          Manage roles
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction(member, "suspend")}>
          <AlertIcon />
          {suspended ? "Reinstate" : "Suspend"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAction(member, "remove")}>
          <TrashIcon />
          Remove from organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
