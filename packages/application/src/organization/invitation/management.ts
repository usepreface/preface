import { DateTime, Effect, Schema } from "effect";

import { cryptoPurpose, TokenCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import {
  InvitationError,
  OrganizationInvitationId,
  type OrganizationId,
} from "@usepreface/protocol";
import type {
  ListInvitationsQuery,
  PublicInvitation,
  SessionActor,
} from "@usepreface/protocol/dto";
import { CreateInvitationInput, InvitationTokenInput } from "@usepreface/protocol/input";
import type { OrganizationInvitation } from "@usepreface/protocol/model";

import { OrganizationAccess } from "#/organization/access";
import { makeInvitationAudit } from "#/organization/invitation/audit";
import { makeInvitationAuthority } from "#/organization/invitation/authority";
import { makeInvitationDelivery } from "#/organization/invitation/delivery";

export const makeInvitationManagement = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const random = yield* TokenCrypto;
  const emails = yield* EmailJobs;
  const authority = yield* makeInvitationAuthority;
  const audit = yield* makeInvitationAudit;
  const deliver = yield* makeInvitationDelivery;
  const view = Effect.fn("InvitationManagement.view")(function* (
    invitation: OrganizationInvitation,
  ) {
    const assignments = yield* repository.organization.invitation.assignments(
      invitation.organizationId,
      invitation.id,
    );
    const {
      id,
      email,
      invitedByMemberId,
      expiresAt,
      acceptedAt,
      acceptedByUserId,
      revokedAt,
      createdAt,
      updatedAt,
    } = invitation;
    return {
      id,
      email,
      invitedByMemberId,
      roleIds: assignments.map((assignment) => assignment.roleId),
      expiresAt,
      acceptedAt,
      acceptedByUserId,
      revokedAt,
      createdAt,
      updatedAt,
    } satisfies PublicInvitation;
  });
  const retireProofs = Effect.fn("InvitationManagement.retireProofs")(function* (
    invitation: OrganizationInvitation,
  ) {
    const proofs = yield* repository.auth.verification.retirePendingBySubject(
      yield* authority.subjectKey(invitation),
      "invitation_email",
    );
    for (const proof of proofs)
      if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);
  });
  const revokeStored = Effect.fn("InvitationManagement.revokeStored")(function* (
    invitation: OrganizationInvitation,
    actor: SessionActor,
  ) {
    const revoked = yield* repository.organization.invitation.revoke(
      invitation.organizationId,
      invitation.id,
    );
    if (revoked === undefined) return;
    yield* emails.cancel(invitation.emailJobId);
    yield* retireProofs(invitation);
    yield* audit.record(invitation, "organization.invitation_revoked", actor);
  });
  const create = Effect.fn("Application.organization.invitation.create")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: CreateInvitationInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CreateInvitationInput))(
      input,
    ).pipe(Effect.mapError(() => new InvitationError({ code: "INVALID_INPUT" })));
    const id = Schema.decodeSync(OrganizationInvitationId)(generateUuid7());
    const token = yield* random.randomToken();
    const tokenHash = yield* random.digestToken({ purpose: cryptoPurpose.invitationToken, token });
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          ["members.manage", "roles.assign"],
          { lock: true },
        );
        const roles = yield* authority.requireRoles(
          organizationId,
          decoded.roleIds,
          resolved.permissions,
        );
        const previous = yield* repository.organization.invitation.findPendingByEmail(
          organizationId,
          decoded.email,
        );
        if (previous !== undefined) yield* revokeStored(previous, actor);
        const expiresAt = DateTime.addDuration(yield* DateTime.now, "7 days");
        const emailJobId = yield* deliver({
          id,
          organization: resolved.organization,
          email: decoded.email,
          inviterName: resolved.user.displayName,
          roles,
          token,
          tokenHash,
          expiresAt,
        });
        const invitation = yield* repository.organization.invitation.create(
          {
            id,
            organizationId,
            email: decoded.email,
            invitedByMemberId: resolved.member.id,
            tokenHash,
            emailJobId,
            expiresAt,
          },
          decoded.roleIds,
        );
        yield* audit.record(invitation, "organization.invitation_created", actor);
        return yield* view(invitation);
      }),
    );
  });
  const list = Effect.fn("Application.organization.invitation.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: ListInvitationsQuery = {},
  ) {
    yield* access.requirePermissions(actor, organizationId, ["members.manage"]);
    const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
    const rows = yield* repository.organization.invitation.list(organizationId, {
      ...input,
      limit: limit + 1,
    });
    const invitations = yield* Effect.forEach(rows.slice(0, limit), view);
    return {
      invitations,
      nextCursor: rows.length > limit ? (invitations.at(-1)?.id ?? null) : null,
    };
  });
  const resend = Effect.fn("Application.organization.invitation.resend")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
  ) {
    const token = yield* random.randomToken();
    const tokenHash = yield* random.digestToken({ purpose: cryptoPurpose.invitationToken, token });
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          ["members.manage", "roles.assign"],
          { lock: true },
        );
        const invitation = yield* repository.organization.invitation.findById(organizationId, id);
        if (
          invitation === undefined ||
          invitation.acceptedAt !== null ||
          invitation.revokedAt !== null
        )
          return yield* new InvitationError({ code: "INVITATION_NOT_FOUND" });
        const inviter = yield* authority.requireInviter(invitation);
        yield* authority.requireRoles(
          organizationId,
          inviter.roles.map((role) => role.id),
          resolved.permissions,
        );
        yield* emails.cancel(invitation.emailJobId);
        yield* retireProofs(invitation);
        const expiresAt = DateTime.addDuration(yield* DateTime.now, "7 days");
        const emailJobId = yield* deliver({
          id,
          organization: resolved.organization,
          email: invitation.email,
          inviterName: inviter.user.displayName,
          roles: inviter.roles,
          token,
          tokenHash,
          expiresAt,
        });
        const replaced = yield* repository.organization.invitation.replaceCredential(
          organizationId,
          id,
          { tokenHash, emailJobId, expiresAt },
        );
        if (replaced === undefined)
          return yield* new InvitationError({ code: "INVITATION_NOT_FOUND" });
        yield* audit.record(replaced, "organization.invitation_resent", actor);
        return yield* view(replaced);
      }),
    );
  });
  const revoke = Effect.fn("Application.organization.invitation.revoke")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: OrganizationInvitationId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requirePermissions(actor, organizationId, ["members.manage"], { lock: true });
        const invitation = yield* repository.organization.invitation.findById(organizationId, id);
        if (invitation === undefined)
          return yield* new InvitationError({ code: "INVITATION_NOT_FOUND" });
        yield* revokeStored(invitation, actor);
      }),
    );
  });
  const inspect = Effect.fn("Application.organization.invitation.inspect")(function* (
    input: InvitationTokenInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(InvitationTokenInput))(
      input,
    ).pipe(Effect.mapError(() => new InvitationError({ code: "INVALID_INPUT" })));
    const { invitation, organization } = yield* authority.requireToken(decoded);
    yield* authority.requireInviter(invitation);
    return {
      organization: { id: organization.id, name: organization.name },
      expiresAt: invitation.expiresAt,
    };
  });
  return { create, list, resend, revoke, inspect } as const;
});
