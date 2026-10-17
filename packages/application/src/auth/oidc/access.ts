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

export const makeOidcAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const actors = yield* OrganizationAccess;
  const requireMembership = Effect.fn("OidcAccess.requireMembership")(function* (
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
  const requireActorMember = Effect.fn("OidcAccess.requireActorMember")(function* (
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
  const requireConnection = Effect.fn("OidcAccess.requireConnection")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    lock = false,
  ) {
    const previous = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      connectionId,
    );
    const connection =
      lock && previous !== undefined
        ? yield* repository.auth.identityConnection.lockById(connectionId)
        : previous;
    if (
      connection === undefined ||
      connection.provider !== "oidc" ||
      connection.organizationId !== organizationId
    )
      return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    return connection;
  });
  const requireApproved = Effect.fn("OidcAccess.requireApproved")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
  ) {
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    if (!approved.some((entry) => entry.identityConnectionId === connectionId))
      return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
  });
  return { requireMembership, requireActorMember, requireConnection, requireApproved };
});
