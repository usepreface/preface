import { DateTime, Effect, Redacted, Schema } from "effect";

import { TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, type IdentityConnectionId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { SamlCallbackInput, CompleteSamlFlowInput } from "@usepreface/protocol/input";

import { matchesFlowActor } from "#/auth/external/binding";
import { makeExternalCompletion } from "#/auth/external/completion";
import { makeExternalProof } from "#/auth/external/proof";
import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeExternalFlowFailure } from "#/auth/organization-identity/failure";
import { SamlIdentity } from "#/auth/saml/provider";

export const makeSamlFlowCallback = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const secrets = yield* makeIdentitySecrets;
  const proofs = yield* makeExternalProof;
  const provider = yield* SamlIdentity;
  const completeIdentity = yield* makeExternalCompletion;
  const failFlow = yield* makeExternalFlowFailure;
  const callback = Effect.fn("Application.auth.saml.callback")(function* (
    connectionId: IdentityConnectionId,
    input: SamlCallbackInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(SamlCallbackInput))(input).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })),
    );
    const hash = yield* random.digestToken({
      purpose: cryptoPurpose.samlRelay,
      token: decoded.relayState,
    });
    const flow = yield* transaction.run(
      Effect.gen(function* () {
        const pending = yield* repository.auth.authFlow.findByStateHash(hash);
        if (
          pending?.provider !== "saml" ||
          pending.identityConnectionId !== connectionId ||
          pending.samlRequestId === null ||
          pending.targetOrganizationId === null
        )
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        const claimed = yield* repository.auth.authFlow.claim(pending.id);
        if (claimed === undefined) return yield* new IdentityError({ code: "INVALID_FLOW" });
        return claimed;
      }),
    );
    return yield* Effect.gen(function* () {
      const connection = yield* repository.auth.identityConnection.findById(connectionId);
      if (
        connection?.provider !== "saml" ||
        connection.organizationId !== flow.targetOrganizationId ||
        connection.revision !== flow.connectionRevision ||
        (flow.intent !== "test" && connection.status !== "active") ||
        flow.samlRequestId === null
      )
        return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
      const verified = yield* provider.validateResponse({
        configuration: connection.configuration,
        privateKey: yield* secrets.decryptConnection(connection),
        requestId: flow.samlRequestId,
        requestedAt: flow.createdAt,
        response: decoded.response,
      });
      if (verified.issuer !== connection.configuration.idp?.entityId)
        return yield* new IdentityError({ code: "INVALID_FLOW" });
      if (
        flow.intent === "reauthenticate" &&
        DateTime.toEpochMillis(verified.authenticatedAt) <
          DateTime.toEpochMillis(flow.createdAt) - 60_000
      )
        return yield* new IdentityError({ code: "RECENT_SSO_REQUIRED" });
      const subject = yield* random.digestToken({
        purpose: cryptoPurpose.samlSubject,
        token: Redacted.make(verified.subject),
      });
      const ciphertext = yield* proofs.encrypt(flow.id, {
        issuer: verified.issuer,
        subject,
        email: verified.email ?? null,
        emailVerified: null,
        authenticatedAt: verified.authenticatedAt,
        validUntil: verified.validUntil,
        sessionExpiresAt: verified.sessionExpiresAt,
      });
      const responseHash = yield* random.digestToken({
        purpose: cryptoPurpose.samlReplay,
        token: Redacted.make(JSON.stringify([verified.issuer, verified.responseId])),
      });
      const assertionHash = yield* random.digestToken({
        purpose: cryptoPurpose.samlReplay,
        token: Redacted.make(JSON.stringify([verified.issuer, verified.assertionId])),
      });
      return yield* transaction.run(
        Effect.gen(function* () {
          const current = yield* repository.auth.identityConnection.lockById(connectionId);
          if (
            current?.provider !== "saml" ||
            current.organizationId !== flow.targetOrganizationId ||
            current.revision !== flow.connectionRevision ||
            (flow.intent !== "test" && current.status !== "active")
          )
            return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
          const organization = yield* repository.organization.organization.lockById(
            current.organizationId,
          );
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          if (
            organization?.archivedAt !== null ||
            DateTime.toEpochMillis(verified.validUntil) <= now
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          const replayExpiresAt = DateTime.addDuration(verified.validUntil, "1 minute");
          if (
            !(yield* repository.auth.ssoReplay.reserve(
              connectionId,
              "response",
              responseHash,
              replayExpiresAt,
            )) ||
            !(yield* repository.auth.ssoReplay.reserve(
              connectionId,
              "assertion",
              assertionHash,
              replayExpiresAt,
            ))
          )
            return yield* new IdentityError({ code: "SAML_REPLAY" });
          if (
            (yield* repository.auth.authFlow.stageVerifiedIdentity(flow.id, ciphertext)) ===
            undefined
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          yield* repository.audit.event.append({
            actorKind: flow.expectedUserId === null ? "system" : "user",
            actorUserId: flow.expectedUserId,
            organizationId: current.organizationId,
            eventType: "auth.external_flow_verified",
            targetType: "auth_flow",
            targetId: flow.id,
            metadata: { intent: flow.intent },
          });
          return { flowId: flow.id };
        }),
      );
    }).pipe(Effect.catch((error) => failFlow(flow).pipe(Effect.andThen(Effect.fail(error)))));
  });
  const complete = Effect.fn("Application.auth.saml.complete")(function* (
    input: CompleteSamlFlowInput,
    actor?: SessionActor,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CompleteSamlFlowInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
    const flow = yield* repository.auth.authFlow.findById(decoded.flowId);
    if (
      flow?.provider !== "saml" ||
      flow.verifiedIdentityCiphertext === null ||
      flow.consumedAt !== null ||
      flow.revokedAt !== null ||
      DateTime.toEpochMillis(flow.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now) ||
      !(yield* random.verifyToken({
        purpose: cryptoPurpose.samlBrowser,
        token: decoded.browserToken,
        expectedDigest: flow.browserBindingHash,
      }))
    )
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    if (!matchesFlowActor(flow, actor)) return yield* new IdentityError({ code: "INVALID_FLOW" });
    const ciphertext = flow.verifiedIdentityCiphertext;
    return yield* Effect.gen(function* () {
      const identity = yield* proofs.decrypt(flow.id, ciphertext);
      return yield* completeIdentity(flow, identity, actor);
    }).pipe(Effect.catch((error) => failFlow(flow).pipe(Effect.andThen(Effect.fail(error)))));
  });
  return { callback, complete };
});
