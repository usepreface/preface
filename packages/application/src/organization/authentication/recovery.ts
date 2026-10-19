import { Effect, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { RecoverOrganizationAuthInput } from "@usepreface/protocol/input";

import { makeIdentityAccess } from "#/auth/identity-access";
import { OrganizationAccess } from "#/organization/access";
import { makeOrganizationSecurityNotifications } from "#/organization/authentication/notifications";
import { makeOrganizationOwnerPaths } from "#/organization/authentication/owner-paths";
import { makeOrganizationRecoveryAccess } from "#/organization/authentication/recovery-access";
import {
  makeRecoveryCredentialVerification,
  makeRecoveryCredentialRevocation,
} from "#/organization/authentication/recovery-credential";
import { organizationAuthPolicyView } from "#/organization/authentication/views";

export const makeOrganizationAuthRecovery = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const identities = yield* makeIdentityAccess;
  const access = yield* OrganizationAccess;
  const recoveryOwner = yield* makeOrganizationRecoveryAccess;
  const paths = yield* makeOrganizationOwnerPaths;
  const revokeCredentials = yield* makeRecoveryCredentialRevocation;
  const notify = yield* makeOrganizationSecurityNotifications;
  const get = Effect.fn("Application.organization.authRecovery.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const { member } = yield* recoveryOwner(actor, organizationId);
    const credential = yield* repository.organization.authRecoveryToken.findActiveByMember(
      organizationId,
      member.id,
    );
    return {
      credential:
        credential === undefined ? null : { id: credential.id, createdAt: credential.createdAt },
    };
  });
  const rotate = Effect.fn("Application.organization.authRecovery.rotate")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const credential = yield* random.randomToken();
    const hash = yield* random.digestToken({
      purpose: cryptoPurpose.organizationAuthRecovery,
      token: credential,
    });
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identities.requireVerifiedEmail(actor);
        yield* revokeCredentials(actor, organizationId, resolved.member.id);
        const token = yield* repository.organization.authRecoveryToken.create(
          organizationId,
          resolved.member.id,
          hash,
        );
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_recovery_issued",
          targetType: "organization_auth_recovery_token",
          targetId: token.id,
          metadata: { memberId: resolved.member.id },
        });
        yield* notify(resolved.organization, "recovery-rotated", token.id);
        return { id: token.id, createdAt: token.createdAt, recoveryCredential: credential };
      }),
    );
  });
  const revoke = Effect.fn("Application.organization.authRecovery.revoke")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, { lock: true });
        yield* identities.requireVerifiedEmail(actor);
        const revoked = yield* revokeCredentials(actor, organizationId, resolved.member.id);
        yield* paths.requireRecoverable(organizationId);
        for (const token of revoked)
          yield* notify(resolved.organization, "recovery-revoked", token.id);
      }),
    );
  });
  const verify = yield* makeRecoveryCredentialVerification;
  const recover = Effect.fn("Application.organization.authRecovery.recover")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: RecoverOrganizationAuthInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(RecoverOrganizationAuthInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const { member, organization, policy } = yield* recoveryOwner(actor, organizationId, true);
        yield* identities.requireVerifiedEmail(actor);
        if (policy.revision !== decoded.expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const token = yield* verify(organizationId, member.id, decoded.recoveryCredential);
        if (policy.ssoMode !== "required")
          return yield* new IdentityError({ code: "INVALID_INPUT" });
        if (
          (yield* repository.organization.authRecoveryToken.consume(
            organizationId,
            member.id,
            token.id,
          )) === undefined
        )
          return yield* new IdentityError({ code: "INVALID_RECOVERY_CREDENTIAL" });
        const updated = yield* repository.organization.authPolicy.update(
          organizationId,
          member.id,
          policy.revision,
          {
            allowedMethods: policy.allowedMethods,
            ssoMode: "optional",
            ssoMaxAgeSeconds: policy.ssoMaxAgeSeconds,
          },
        );
        if (updated === undefined) return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_recovered",
          targetType: "organization_auth_recovery_token",
          targetId: token.id,
          metadata: { memberId: member.id },
        });
        const approved =
          yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
        const ids = approved.map((entry) => entry.identityConnectionId);
        const connections =
          yield* repository.auth.identityConnection.listByOrganization(organizationId);
        const oidcConnectionIds = ids.filter((id) =>
          connections.some((connection) => connection.id === id && connection.provider === "oidc"),
        );
        const samlConnectionIds = ids.filter((id) =>
          connections.some((connection) => connection.id === id && connection.provider === "saml"),
        );

        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          organizationId,
          eventType: "organization.auth_policy_updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: {
            revision: updated.revision,
            googleEnabled: policy.allowedMethods.includes("google"),
            oidcConnectionIds,
            samlConnectionIds,
            ssoMode: updated.ssoMode,
            ssoMaxAgeSeconds: updated.ssoMaxAgeSeconds,
          },
        });
        yield* notify(organization, "sso-recovered", `policy-${updated.revision}`);
        return organizationAuthPolicyView(updated, oidcConnectionIds, samlConnectionIds);
      }),
    );
  });
  return { get, rotate, revoke, recover };
});
