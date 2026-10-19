import { Context, Effect, Layer, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  AuthenticationError,
  OrganizationError,
  type OrganizationId,
  type OrganizationMemberId,
  OrganizationPermission,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { makeOrganizationAuthenticationEvidence } from "#/organization/authentication/evidence";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";
import { sessionIdleTimeout } from "#/security/policy";

const makeOrganizationAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const evaluateAuthentication = yield* makeOrganizationAuthenticationEvidence;
  const ownerPaths = yield* makeOrganizationOwnerPaths;
  const requireActor = Effect.fn("OrganizationAccess.requireActor")(function* (
    actor: SessionActor,
  ) {
    const session = yield* repository.auth.session.findActiveById(
      actor.session.id,
      actor.user.id,
      sessionIdleTimeout,
    );
    const user = yield* repository.auth.user.findById(actor.user.id);
    const evidence = yield* repository.auth.sessionAuthentication.listUsableBySessionId(
      actor.session.id,
    );
    if (
      session === undefined ||
      user === undefined ||
      user.disabledAt !== null ||
      evidence.length === 0
    )
      return yield* new AuthenticationError({ code: "UNAUTHENTICATED" });
    return { user, evidence } as const;
  });
  const requireMember = Effect.fn("OrganizationAccess.requireMember")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    options: { readonly lock?: boolean } = {},
  ) {
    const authenticated = yield* requireActor(actor);
    const organization =
      options.lock === true
        ? yield* repository.organization.organization.lockById(organizationId)
        : yield* repository.organization.organization.findById(organizationId);
    // Check again after waiting for a mutation lock, including session/evidence revocation.
    const current = options.lock === true ? yield* requireActor(actor) : authenticated;
    const member = yield* repository.organization.member.findByUserId(
      organizationId,
      actor.user.id,
    );
    if (
      organization === undefined ||
      member === undefined ||
      member.suspendedAt !== null ||
      member.removedAt !== null
    )
      return yield* new OrganizationError({ code: "ORGANIZATION_NOT_FOUND" });

    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const authentication = yield* evaluateAuthentication(
      policy,
      current.evidence,
      approved.map((entry) => entry.identityConnectionId),
    );
    if (!authentication.accepted)
      return yield* new OrganizationError({ code: "AUTHENTICATION_REQUIRED" });
    const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
      organizationId,
      member.id,
    );
    const roles = grants.map((grant) => grant.role);
    const permissions = [
      ...new Set(
        roles.flatMap((role) => role.permissions).filter(Schema.is(OrganizationPermission)),
      ),
    ].toSorted();
    const isOwner = roles.some((role) => role.kind === "builtin" && role.key === "owner");
    return {
      organization,
      member,
      user: current.user,
      roles,
      grants,
      policy,
      permissions,
      isOwner,
    } as const;
  });
  const requirePermissions = Effect.fn("OrganizationAccess.requirePermissions")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    required: readonly OrganizationPermission[],
    options: { readonly lock?: boolean } = {},
  ) {
    const access = yield* requireMember(actor, organizationId, options);
    if (!required.every((permission) => access.permissions.includes(permission)))
      return yield* new OrganizationError({ code: "FORBIDDEN" });
    return access;
  });
  const requireOwner = Effect.fn("OrganizationAccess.requireOwner")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    options: { readonly lock?: boolean } = {},
  ) {
    const access = yield* requireMember(actor, organizationId, options);
    if (!access.isOwner) return yield* new OrganizationError({ code: "FORBIDDEN" });
    return access;
  });
  const requireAnotherOwner = Effect.fn("OrganizationAccess.requireAnotherOwner")(function* (
    organizationId: OrganizationId,
    excludedMemberId: OrganizationMemberId,
  ) {
    const owners = yield* repository.organization.roleBinding.listUsableOwners(organizationId);
    if (!owners.some((owner) => owner.id !== excludedMemberId))
      return yield* new OrganizationError({ code: "LAST_OWNER" });
    yield* ownerPaths.requireRecoverable(organizationId, excludedMemberId);
  });
  return {
    requireActor,
    requireMember,
    requirePermissions,
    requireOwner,
    requireAnotherOwner,
  } as const;
});
export class OrganizationAccess extends Context.Service<
  OrganizationAccess,
  Effect.Success<typeof makeOrganizationAccess>
>()("@usepreface/application/organization/OrganizationAccess") {
  static readonly layer = Layer.effect(OrganizationAccess, makeOrganizationAccess);
}
export type ResolvedOrganizationAccess = Effect.Success<
  ReturnType<OrganizationAccess["Service"]["requireMember"]>
>;
