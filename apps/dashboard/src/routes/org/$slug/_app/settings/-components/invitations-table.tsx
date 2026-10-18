import { Button } from "@usepreface/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@usepreface/ui/components/table";
import { cn } from "@usepreface/ui/lib/utils";

import { RoleBadge, TeamBadge } from "#/components/data-display/identity";
import { StatusBadge } from "#/components/data-display/status-badge";
import { TableCard } from "#/components/data-display/table-card";
import { feedback } from "#/lib/feedback";
import type { Invitation } from "#/lib/placeholder";
import { deliveryStatus, invitationStatus } from "#/lib/status";

/** Sent invitations, with what happened to the email and what can still be done. */
export function InvitationsTable({ invitations }: { invitations: readonly Invitation[] }) {
  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invitation</TableHead>
            <TableHead className="max-lg:hidden">Roles and teams</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-md:hidden">Expires</TableHead>
            <TableHead className="max-md:hidden">Delivery</TableHead>
            <TableHead className="w-0">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const closed = invitation.status === "expired" || invitation.status === "revoked";
            return (
              <TableRow key={invitation.email} className={closed ? "opacity-70" : undefined}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{invitation.email}</span>
                    <span className="text-caption text-fg-tertiary">
                      Invited by {invitation.invitedBy} · {invitation.sentOn}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="max-lg:hidden">
                  <span className="flex flex-wrap gap-1">
                    {invitation.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                    {invitation.teams.map((team) => (
                      <TeamBadge key={team} team={team} />
                    ))}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={invitationStatus[invitation.status]} />
                </TableCell>
                <TableCell
                  className={cn("max-md:hidden", closed ? "text-fg-tertiary" : "text-fg-secondary")}
                >
                  {invitation.expires}
                </TableCell>
                <TableCell className="max-md:hidden">
                  <StatusBadge status={deliveryStatus[invitation.delivery]} />
                </TableCell>
                <TableCell>
                  <InvitationActions invitation={invitation} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableCard>
  );
}

function InvitationActions({ invitation }: { invitation: Invitation }) {
  const actions: string[] = [];
  if (invitation.status === "pending") {
    if (invitation.delivery === "sent") actions.push("Resend");
    if (invitation.delivery === "failed") actions.push("Edit email");
    actions.push("Revoke");
  } else if (invitation.status === "expired") {
    actions.push("Resend");
  }
  return (
    <span className="flex justify-end gap-0.5">
      {actions.map((action) => (
        <Button
          key={action}
          variant="ghost"
          size="sm"
          onClick={() =>
            action === "Resend"
              ? feedback.sent("Invitation resent", invitation.email)
              : action === "Revoke"
                ? feedback.done(
                    "Invitation revoked",
                    `${invitation.email} can no longer join with it.`,
                  )
                : feedback.notConnected()
          }
        >
          {action}
        </Button>
      ))}
    </span>
  );
}
