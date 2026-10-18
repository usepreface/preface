import { useState } from "react";

import { DateTime } from "effect";

import type { OrganizationInvitationId, OrganizationId } from "@usepreface/protocol";
import type { PublicInvitation } from "@usepreface/protocol/dto";
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
import { QueryKeys } from "#/atoms/query-keys";
import { Pagination } from "#/components/api/pagination";
import { QueryState } from "#/components/api/query-state";
import { TableCard } from "#/components/data-display/table-card";
import { ConfirmDialog } from "#/components/feedback/confirm-dialog";
import { Notice } from "#/components/feedback/notice";
import {
  useInvitations,
  useOrganizationInvitationsResend,
  useOrganizationInvitationsRevoke,
} from "#/hooks/membership";
import { useOrganization } from "#/hooks/organizations";
import { toQuery } from "#/hooks/query";
import { formatDate } from "#/lib/dates";
import { feedback } from "#/lib/feedback";
import { requestFields } from "#/lib/request-fields";

const useDelivery = toQuery(
  (organizationId: OrganizationId, invitationId: OrganizationInvitationId) =>
    ApiClient.query(
      "organizationInvitations",
      "delivery",
      requestFields({
        params: { organizationId, invitationId },
        reactivityKeys: [QueryKeys.organization(organizationId)],
      }),
    ),
);
export function InvitationDirectory() {
  const { organization, access } = useOrganization();
  const [cursor, setCursor] = useState<OrganizationInvitationId>();
  const invitations = useInvitations(organization.id, cursor);
  const resend = useOrganizationInvitationsResend();
  const revoke = useOrganizationInvitationsRevoke();
  const [revoking, setRevoking] = useState<PublicInvitation>();
  const [delivery, setDelivery] = useState<OrganizationInvitationId>();
  return (
    <div className="flex flex-col gap-4">
      <QueryState query={invitations}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.data?.invitations.map((invitation) => {
                const status = invitation.revokedAt
                  ? "Revoked"
                  : invitation.acceptedAt
                    ? "Accepted"
                    : DateTime.toEpochMillis(invitation.expiresAt) < Date.now()
                      ? "Expired"
                      : "Pending";
                return (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{status}</TableCell>
                    <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!invitation.acceptedAt && !invitation.revokedAt ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={
                                resend.pending || !access.permissions.includes("roles.assign")
                              }
                              onClick={async () => {
                                if (
                                  await resend.run({
                                    params: {
                                      organizationId: organization.id,
                                      invitationId: invitation.id,
                                    },
                                    payload: {},
                                  })
                                )
                                  feedback.done("Replacement invitation queued");
                              }}
                            >
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRevoking(invitation)}
                            >
                              Revoke
                            </Button>
                          </>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDelivery(invitation.id)}
                        >
                          Delivery
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
        {invitations.data?.invitations.length === 0 ? <p>No invitations yet.</p> : null}
      </QueryState>
      <Pagination cursor={cursor} nextCursor={invitations.data?.nextCursor} onChange={setCursor} />
      {delivery ? <Delivery organizationId={organization.id} invitationId={delivery} /> : null}
      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => {
          if (!open && !revoke.pending) setRevoking(undefined);
        }}
        pending={revoke.pending}
        icon={TrashIcon}
        title="Revoke invitation?"
        description={revoking?.email}
        confirmLabel="Revoke invitation"
        onConfirm={async () => {
          if (!revoking) return;
          if (
            await revoke.run({
              params: { organizationId: organization.id, invitationId: revoking.id },
            })
          ) {
            setRevoking(undefined);
            feedback.done("Invitation revoked");
          }
        }}
      />
    </div>
  );
}
function Delivery({
  organizationId,
  invitationId,
}: {
  organizationId: OrganizationId;
  invitationId: OrganizationInvitationId;
}) {
  const query = useDelivery(organizationId, invitationId);
  return (
    <QueryState query={query}>
      <Notice title="Invitation delivery">
        {query.data ? (
          <dl className="grid gap-2 text-sm">
            <div>
              <dt>Status</dt>
              <dd>
                {query.data.status} · {query.data.attempts} delivery attempts
              </dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{query.data.provider ?? "Not selected"}</dd>
            </div>
            <div>
              <dt>Last error</dt>
              <dd>{query.data.lastErrorCode?.replaceAll("_", " ").toLowerCase() ?? "None"}</dd>
            </div>
            <div>
              <dt>Sent</dt>
              <dd>{formatDate(query.data.sentAt)}</dd>
            </div>
            <div>
              <dt>Next available attempt</dt>
              <dd>{formatDate(query.data.availableAt)}</dd>
            </div>
          </dl>
        ) : null}
        <Button size="sm" variant="outline" onClick={query.refetch}>
          Refresh delivery
        </Button>
      </Notice>
    </QueryState>
  );
}
