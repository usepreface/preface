import { DateTime, Effect, Redacted, Schema } from "effect";

import { SecretCrypto, cryptoPurpose } from "@usepreface/crypto";
import { AuthFlowId, IdentityError } from "@usepreface/protocol";

export interface VerifiedExternalIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly email: string | null;
  readonly emailVerified: boolean | null;
  readonly hostedDomain?: string | null;
  readonly authenticatedAt: DateTime.Utc | null;
  readonly validUntil: DateTime.Utc | null;
  readonly sessionExpiresAt: DateTime.Utc | null;
}

export const externalProofExpiresAt = (
  flowExpiresAt: DateTime.Utc,
  identity: VerifiedExternalIdentity,
) =>
  DateTime.min(
    DateTime.min(flowExpiresAt, identity.validUntil ?? flowExpiresAt),
    identity.sessionExpiresAt ?? flowExpiresAt,
  );

const identity = Schema.Struct({
  issuer: Schema.NonEmptyString,
  subject: Schema.NonEmptyString,
  email: Schema.NullOr(Schema.String),
  emailVerified: Schema.NullOr(Schema.Boolean),
  hostedDomain: Schema.optionalKey(Schema.NullOr(Schema.String)),
  authenticatedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  validUntil: Schema.NullOr(Schema.DateTimeUtcFromString),
  sessionExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
const envelope = Schema.fromJsonString(
  Schema.Struct({ version: Schema.Literal(1), flowId: AuthFlowId, identity }),
);

export const makeExternalProof = Effect.gen(function* () {
  const crypto = yield* SecretCrypto;
  const encrypt = Effect.fn("ExternalProof.encrypt")(function* (
    flowId: AuthFlowId,
    verified: VerifiedExternalIdentity,
  ) {
    return yield* crypto.encrypt({
      purpose: cryptoPurpose.externalIdentityProof,
      plaintext: Redacted.make(
        Schema.encodeSync(envelope)({ version: 1, flowId, identity: verified }),
      ),
    });
  });
  const decrypt = Effect.fn("ExternalProof.decrypt")(function* (
    flowId: AuthFlowId,
    ciphertext: string,
  ) {
    const plaintext = yield* crypto.decrypt({
      purpose: cryptoPurpose.externalIdentityProof,
      ciphertext,
    });
    const decoded = yield* Schema.decodeUnknownEffect(envelope)(Redacted.value(plaintext)).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })),
    );
    if (decoded.flowId !== flowId) return yield* new IdentityError({ code: "INVALID_FLOW" });
    return decoded.identity;
  });
  return { encrypt, decrypt };
});
