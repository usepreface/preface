import { Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { UpdateGooglePolicyInput } from "@usepreface/protocol/input";

import { makeIdentityAccess } from "#/auth/identity-access";
import { makeOidcAccess } from "#/auth/oidc/access";
import { OrganizationAccess } from "#/organization/access";

export const makeAuthenticationPolicyApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const organizations = yield* OrganizationAccess;
  const oidcAccess = yield* makeOidcAccess;
  const access = yield* makeIdentityAccess;
  const methods = Effect.fn("Application.organization.authPolicy.methods")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    // Discovery allows choosing a proof before satisfying the organization's method policy.
    yield* oidcAccess.requireActorMember(actor, organizationId);
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    const google = yield* repository.auth.identityConnection.findGoogle();
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const connections =
      yield* repository.auth.identityConnection.listByOrganization(organizationId);
    const accounts = yield* repository.auth.account.listByUserId(actor.user.id);
    return {
      revision: policy.revision,
      email: true as const,
      googleEnabled: policy.allowedMethods.includes("google"),
      googleAvailable: google?.status === "active",
      googleEffective: policy.allowedMethods.includes("google") && google?.status === "active",
      oidc: connections
        .filter((connection) =>
          approved.some((entry) => entry.identityConnectionId === connection.id),
        )
        .map((connection) => ({
          id: connection.id,
          name: connection.name,
          available: connection.status === "active",
          linked: accounts.some(
            (account) =>
              account.identityConnectionId === connection.id && account.unlinkedAt === null,
          ),
        })),
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
    if (
      (decoded.googleEnabled === undefined && decoded.oidcConnectionIds === undefined) ||
      (decoded.oidcConnectionIds !== undefined &&
        new Set(decoded.oidcConnectionIds).size !== decoded.oidcConnectionIds.length)
    )
      return yield* new IdentityError({ code: "INVALID_INPUT" });
    // Check authority before acquiring locks on client-supplied connection identities.
    yield* organizations.requireOwner(actor, organizationId);
    yield* access.requireRecentEmail(actor);
    return yield* transaction.run(
      Effect.gen(function* () {
        const google = yield* repository.auth.identityConnection.findGoogle();
        const ids = [
          ...new Set([
            ...(decoded.oidcConnectionIds ?? []),
            ...(google === undefined ? [] : [google.id]),
          ]),
        ].toSorted();
        const locked = [];
        for (const id of ids) locked.push(yield* repository.auth.identityConnection.lockById(id));
        const resolved = yield* organizations.requireOwner(actor, organizationId, { lock: true });
        yield* access.requireRecentEmail(actor);
        if (resolved.policy.revision !== decoded.expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const previous = (yield* repository.organization.authPolicyConnection.listByOrganization(
          organizationId,
        )).map((entry) => entry.identityConnectionId);
        const oidcConnectionIds = [...(decoded.oidcConnectionIds ?? previous)].toSorted();
        for (const id of oidcConnectionIds) {
          const connection = locked.find((candidate) => candidate?.id === id);
          if (
            decoded.oidcConnectionIds !== undefined &&
            (connection?.provider !== "oidc" ||
              connection.organizationId !== organizationId ||
              (!previous.includes(id) && connection.status !== "active"))
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        }
        const googleEnabled =
          decoded.googleEnabled ?? resolved.policy.allowedMethods.includes("google");
        if (
          decoded.googleEnabled === true &&
          locked.find((connection) => connection?.id === google?.id)?.status !== "active"
        )
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        if (
          googleEnabled === resolved.policy.allowedMethods.includes("google") &&
          JSON.stringify(oidcConnectionIds) === JSON.stringify([...previous].toSorted())
        )
          return {
            revision: resolved.policy.revision,
            allowedMethods: resolved.policy.allowedMethods,
            oidcConnectionIds,
            updatedAt: resolved.policy.updatedAt,
          };
        const policy = yield* repository.organization.authPolicy.updateGoogle(
          organizationId,
          resolved.member.id,
          decoded.expectedRevision,
          googleEnabled,
          oidcConnectionIds.length > 0,
        );
        if (policy === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (decoded.oidcConnectionIds !== undefined)
          yield* repository.organization.authPolicyConnection.replaceForOrganization(
            organizationId,
            resolved.member.id,
            oidcConnectionIds,
          );
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_policy_updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: { revision: policy.revision, googleEnabled, oidcConnectionIds },
        });
        return {
          revision: policy.revision,
          allowedMethods: policy.allowedMethods,
          oidcConnectionIds,
          updatedAt: policy.updatedAt,
        };
      }),
    );
  });
  return { methods, update };
});
