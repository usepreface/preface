import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { OrganizationError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

// Recovery checks ownership without requiring the unavailable provider; it never authorizes content.
export const makeOrganizationRecoveryAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const actors = yield* OrganizationAccess;
  return Effect.fn("OrganizationRecoveryAccess.requireOwner")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    lock = false,
  ) {
    yield* actors.requireActor(actor);
    const organization = lock
      ? yield* repository.organization.organization.lockById(organizationId)
      : yield* repository.organization.organization.findById(organizationId);
    if (lock) yield* actors.requireActor(actor);
    const member = yield* repository.organization.member.findByUserId(
      organizationId,
      actor.user.id,
    );
    if (
      organization === undefined ||
      member === undefined ||
      member.removedAt !== null ||
      member.suspendedAt !== null
    )
      return yield* new OrganizationError({ code: "ORGANIZATION_NOT_FOUND" });
    const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
      organizationId,
      member.id,
    );
    if (!grants.some((grant) => grant.role.kind === "builtin" && grant.role.key === "owner"))
      return yield* new OrganizationError({ code: "FORBIDDEN" });
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    return { member, organization, policy };
  });
});
