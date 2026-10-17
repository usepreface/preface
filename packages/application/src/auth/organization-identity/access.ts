import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  OrganizationError,
  type IdentityConnectionId,
  type OrganizationId,
  type UserId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

export const makeOrganizationIdentityAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const actors = yield* OrganizationAccess;
  const requireMembership = Effect.fn("OrganizationIdentityAccess.requireMembership")(function* (
    organizationId: OrganizationId,
    userId: UserId,
    lock = false,
  ) {
    const organization = lock
      ? yield* repository.organization.organization.lockById(organizationId)
      : yield* repository.organization.organization.findById(organizationId);
    const member = yield* repository.organization.member.findByUserId(organizationId, userId);
    if (
      organization === undefined ||
      member === undefined ||
      member.removedAt !== null ||
      member.suspendedAt !== null
    )
      return yield* new OrganizationError({ code: "ORGANIZATION_NOT_FOUND" });
    if (organization.archivedAt !== null)
      return yield* new OrganizationError({ code: "ORGANIZATION_ARCHIVED" });
    return member;
  });
  const requireActorMember = Effect.fn("OrganizationIdentityAccess.requireActorMember")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    lock = false,
  ) {
    yield* actors.requireActor(actor);
    const member = yield* requireMembership(organizationId, actor.user.id, lock);
    // Revocation may have committed while waiting for the organization lock.
    if (lock) yield* actors.requireActor(actor);
    return member;
  });
  const requireApproved = Effect.fn("OrganizationIdentityAccess.requireApproved")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
  ) {
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    if (!approved.some((entry) => entry.identityConnectionId === connectionId))
      return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
  });
  return { requireMembership, requireActorMember, requireApproved };
});
