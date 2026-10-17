import { Effect, type Redacted } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

export const makeRecoveryCredentialVerification = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const random = yield* TokenCrypto;
  return Effect.fn("OrganizationAuthRecovery.verify")(function* (
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
    credential: Redacted.Redacted<string>,
  ) {
    const token = yield* repository.organization.authRecoveryToken.findActiveByMember(
      organizationId,
      memberId,
    );
    if (
      token === undefined ||
      !(yield* random.verifyToken({
        purpose: cryptoPurpose.organizationAuthRecovery,
        token: credential,
        expectedDigest: token.tokenHash,
      }))
    )
      return yield* new IdentityError({ code: "INVALID_RECOVERY_CREDENTIAL" });
    return token;
  });
});

export const makeRecoveryCredentialRevocation = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("OrganizationAuthRecovery.revokeCredentials")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ) {
    const revoked = yield* repository.organization.authRecoveryToken.revokeByMember(
      organizationId,
      memberId,
    );
    for (const token of revoked)
      yield* repository.audit.event.append({
        actorKind: "user",
        actorUserId: actor.user.id,
        organizationId,
        eventType: "organization.auth_recovery_revoked",
        targetType: "organization_auth_recovery_token",
        targetId: token.id,
        metadata: { memberId },
      });
    return revoked;
  });
});
