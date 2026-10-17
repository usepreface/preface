import { DateTime, Effect, Redacted } from "effect";

import { cryptoPurpose, TokenCrypto, SecretCrypto } from "@usepreface/crypto";
import { DatabaseRepository } from "@usepreface/database";
import {
  InvitationError,
  type OrganizationId,
  type OrganizationRoleId,
} from "@usepreface/protocol";
import type { InvitationTokenInput } from "@usepreface/protocol/input";
import type { OrganizationInvitation, OrganizationRole } from "@usepreface/protocol/model";

import { requireDelegablePermissions } from "#/organization/delegation";
import {
  invitationTeams,
  makeInvitationTeamAssignments,
} from "#/organization/invitation/assignments";

export const makeInvitationAuthority = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const requireTeams = yield* makeInvitationTeamAssignments;
  const tokens = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const requireToken = Effect.fn("InvitationAuthority.requireToken")(function* (
    input: InvitationTokenInput,
    lock = false,
  ) {
    const located = yield* repository.organization.invitation.locate(input.invitationId);
    if (
      located === undefined ||
      !(yield* tokens.verifyToken({
        purpose: cryptoPurpose.invitationToken,
        token: input.token,
        expectedDigest: located.tokenHash,
      }))
    )
      return yield* new InvitationError({ code: "INVALID_INVITATION" });
    const organization = lock
      ? yield* repository.organization.organization.lockById(located.organizationId)
      : yield* repository.organization.organization.findById(located.organizationId);
    const invitation = yield* repository.organization.invitation.findById(
      located.organizationId,
      located.id,
    );
    if (
      organization === undefined ||
      organization.archivedAt !== null ||
      invitation === undefined ||
      invitation.acceptedAt !== null ||
      invitation.revokedAt !== null ||
      DateTime.toEpochMillis(invitation.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now) ||
      !(yield* tokens.verifyToken({
        purpose: cryptoPurpose.invitationToken,
        token: input.token,
        expectedDigest: invitation.tokenHash,
      }))
    )
      return yield* new InvitationError({ code: "INVALID_INVITATION" });
    return { invitation, organization };
  });
  const requireRoles = Effect.fn("InvitationAuthority.requireRoles")(function* (
    organizationId: OrganizationId,
    roleIds: readonly OrganizationRoleId[],
    permissions: readonly OrganizationRole["permissions"][number][],
  ) {
    const roles: OrganizationRole[] = [];
    for (const roleId of roleIds) {
      const role = yield* repository.organization.role.findById(organizationId, roleId);
      if (
        role === undefined ||
        role.archivedAt !== null ||
        role.scopeKind !== "organization" ||
        (role.kind === "builtin" && role.key === "owner")
      )
        return yield* new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" });
      yield* requireDelegablePermissions(permissions, role.permissions).pipe(
        Effect.mapError(() => new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" })),
      );
      roles.push(role);
    }
    if (roles.length === 0) return yield* new InvitationError({ code: "ASSIGNMENT_UNAVAILABLE" });
    return roles;
  });
  const requireInviter = Effect.fn("InvitationAuthority.requireInviter")(function* (
    invitation: OrganizationInvitation,
  ) {
    const member = yield* repository.organization.member.findById(
      invitation.organizationId,
      invitation.invitedByMemberId,
    );
    const user =
      member === undefined ? undefined : yield* repository.auth.user.findById(member.userId);
    const email =
      user === undefined
        ? undefined
        : yield* repository.auth.userEmail.findPrimaryByUserId(user.id);
    if (
      member === undefined ||
      member.suspendedAt !== null ||
      member.removedAt !== null ||
      user === undefined ||
      user.disabledAt !== null ||
      email === undefined ||
      email.removedAt !== null ||
      email.verifiedAt === null ||
      !email.loginEnabled
    )
      return yield* new InvitationError({ code: "INVITER_NOT_AUTHORIZED" });
    const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
      invitation.organizationId,
      member.id,
    );
    const permissions = [...new Set(grants.flatMap((grant) => grant.role.permissions))];
    if (!permissions.includes("members.manage") || !permissions.includes("roles.assign"))
      return yield* new InvitationError({ code: "INVITER_NOT_AUTHORIZED" });
    const assignments = yield* repository.organization.invitation.assignments(
      invitation.organizationId,
      invitation.id,
    );
    const roles = yield* requireRoles(
      invitation.organizationId,
      assignments
        .filter((assignment) => assignment.teamId === null)
        .map((assignment) => assignment.roleId),
      permissions,
    );
    const teams = yield* requireTeams(
      invitation.organizationId,
      member.id,
      permissions,
      invitationTeams(assignments),
    );
    return {
      teams,
      member,
      user,
      roles,
      isOwner: grants.some((grant) => grant.role.kind === "builtin" && grant.role.key === "owner"),
    };
  });
  const subjectKey = (invitation: OrganizationInvitation) =>
    crypto.fingerprint({
      purpose: cryptoPurpose.invitationRecipient,
      // Rotation invalidates browser proofs even when the invitation identity stays the same.
      value: Redacted.make(`${invitation.id}:${invitation.tokenHash}`),
    });
  return { requireToken, requireRoles, requireInviter, requireTeams, subjectKey };
});
