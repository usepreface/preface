import { Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, OrganizationError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { UpdateGooglePolicyInput } from "@usepreface/protocol/input";

import { makeIdentityAccess } from "#/auth/identity-access";
import { OrganizationAccess } from "#/organization/access";
export const makeAuthenticationPolicyApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const organizations = yield* OrganizationAccess;
  const access = yield* makeIdentityAccess;
  const methods = Effect.fn("Application.organization.authPolicy.methods")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    // Discovery must work before the member has satisfied this organization's method policy.
    // It still requires current session identity and an active same-organization membership.
    yield* organizations.requireActor(actor);
    const organization = yield* repository.organization.organization.findById(organizationId);
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
    if (organization.archivedAt !== null)
      return yield* new OrganizationError({ code: "ORGANIZATION_ARCHIVED" });
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    const connection = yield* repository.auth.identityConnection.findGoogle();
    return {
      revision: policy.revision,
      email: true as const,
      googleEnabled: policy.allowedMethods.includes("google"),
      googleAvailable: connection?.status === "active",
      googleEffective: policy.allowedMethods.includes("google") && connection?.status === "active",
    };
  });
  const update = Effect.fn("Application.organization.authPolicy.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: UpdateGooglePolicyInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(UpdateGooglePolicyInput)(input).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })),
    );
    return yield* transaction.run(
      Effect.gen(function* () {
        // Coordinate with global connection disable/configuration before taking the organization lock.
        const previous = yield* repository.auth.identityConnection.findGoogle();
        const connection =
          previous === undefined
            ? undefined
            : yield* repository.auth.identityConnection.lockById(previous.id);
        const resolved = yield* organizations.requireOwner(actor, organizationId, { lock: true });
        yield* access.requireRecentEmail(actor);
        if (decoded.googleEnabled && connection?.status !== "active")
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        if (resolved.policy.revision !== decoded.expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (resolved.policy.allowedMethods.includes("google") === decoded.googleEnabled)
          return {
            revision: resolved.policy.revision,
            allowedMethods: resolved.policy.allowedMethods,
            updatedAt: resolved.policy.updatedAt,
          };
        const policy = yield* repository.organization.authPolicy.updateGoogle(
          organizationId,
          resolved.member.id,
          decoded.expectedRevision,
          decoded.googleEnabled,
        );
        if (policy === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_policy_updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: { revision: policy.revision, googleEnabled: decoded.googleEnabled },
        });
        return {
          revision: policy.revision,
          allowedMethods: policy.allowedMethods,
          updatedAt: policy.updatedAt,
        };
      }),
    );
  });
  return { methods, update };
});
