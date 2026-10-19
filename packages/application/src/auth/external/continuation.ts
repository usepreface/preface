import { DateTime, Effect, Redacted, Schema } from "effect";

import { SecretCrypto, TokenCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { EmailAddressInput, IdentityError, VerificationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { ExternalFlowInput, VerifyExternalEmailInput } from "@usepreface/protocol/input";

import { matchesFlowActor } from "#/auth/external/binding";
import { makeExternalCompletion } from "#/auth/external/completion";
import { externalProofExpiresAt, makeExternalProof } from "#/auth/external/proof";

export const makeExternalContinuation = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const random = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const emails = yield* EmailJobs;
  const proofs = yield* makeExternalProof;
  const complete = yield* makeExternalCompletion;
  const requireFlow = Effect.fn("ExternalContinuation.requireFlow")(function* (
    input: ExternalFlowInput,
    actor?: SessionActor,
  ) {
    const flow = yield* repository.auth.authFlow.findById(input.flowId);
    if (
      flow === undefined ||
      flow.verifiedIdentityCiphertext === null ||
      flow.claimedAt === null ||
      flow.consumedAt !== null ||
      flow.revokedAt !== null ||
      DateTime.toEpochMillis(flow.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now) ||
      !matchesFlowActor(flow, actor) ||
      !(yield* random.verifyToken({
        purpose:
          flow.provider === "saml" ? cryptoPurpose.samlBrowser : cryptoPurpose.authFlowBrowser,
        token: input.browserToken,
        expectedDigest: flow.browserBindingHash,
      }))
    )
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    const identity = yield* proofs.decrypt(flow.id, flow.verifiedIdentityCiphertext);
    const connection = yield* repository.auth.identityConnection.findById(
      flow.identityConnectionId,
    );
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    if (
      connection === undefined ||
      connection.status !== "active" ||
      connection.revision !== flow.connectionRevision ||
      identity.email === null ||
      (identity.validUntil !== null && DateTime.toEpochMillis(identity.validUntil) <= now) ||
      (identity.sessionExpiresAt !== null &&
        DateTime.toEpochMillis(identity.sessionExpiresAt) <= now)
    )
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    const email = yield* Schema.decodeUnknownEffect(EmailAddressInput)(identity.email).pipe(
      Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })),
    );
    if (flow.invitationId !== null && flow.targetOrganizationId !== null) {
      const invitation = yield* repository.organization.invitation.findById(
        flow.targetOrganizationId,
        flow.invitationId,
      );
      if (
        invitation === undefined ||
        invitation.revision !== flow.invitationRevision ||
        invitation.revokedAt !== null ||
        invitation.acceptedAt !== null ||
        DateTime.toEpochMillis(invitation.expiresAt) <= now ||
        invitation.email !== email
      )
        return yield* new IdentityError({ code: "INVALID_FLOW" });
    }
    return { flow, identity, email };
  });
  const status = Effect.fn("Application.auth.external.status")(function* (
    input: ExternalFlowInput,
    actor?: SessionActor,
  ) {
    const { flow, identity, email } = yield* requireFlow(input, actor);
    const at = email.lastIndexOf("@");
    return {
      flowId: flow.id,
      provider: flow.provider,
      nextAction: flow.emailVerifiedAt === null ? ("verify_email" as const) : ("continue" as const),
      maskedEmail: `${email.slice(0, 1)}***${email.slice(at)}`,
      expiresAt: externalProofExpiresAt(flow.expiresAt, identity),
    };
  });
  const request = Effect.fn("Application.auth.external.requestEmail")(function* (
    input: ExternalFlowInput,
    actor?: SessionActor,
  ) {
    const id = Schema.decodeSync(VerificationId)(generateUuid7());
    const code = yield* random.randomCode();
    const unusedLink = yield* random.randomToken();
    const codeHash = yield* crypto.fingerprint({
      purpose: cryptoPurpose.externalEmailCode,
      value: Redacted.make(`${id}:${Redacted.value(code)}`),
    });
    const tokenHash = yield* random.digestToken({
      purpose: cryptoPurpose.authFlowBrowser,
      token: unusedLink,
    });
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.authFlow.lockById(input.flowId);
        const { flow, identity, email } = yield* requireFlow(input, actor);
        if (flow.emailVerifiedAt !== null)
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        const subjectKey = yield* crypto.fingerprint({
          purpose: cryptoPurpose.externalEmailSubject,
          value: Redacted.make(`${flow.id}:${email}`),
        });
        const retired = yield* repository.auth.verification.retirePendingBySubject(
          subjectKey,
          "external_identity_email",
        );
        for (const proof of retired)
          if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);
        const expiresAt = externalProofExpiresAt(flow.expiresAt, identity);
        const settings = yield* repository.instance.settings.find();
        if (settings === undefined)
          return yield* Effect.die(new Error("Prepared instance has no settings"));
        const emailJobId = yield* emails.enqueue({
          type: "identity-verification",
          to: email,
          variables: {
            organizationName:
              (yield* repository.organization.organization.find())?.metadata.name ??
              settings.displayName,
            code: Redacted.value(code),
            expiresAt,
          },
          idempotencyKey: `external-email:${id}`,
          expiresAt,
        });
        yield* repository.auth.verification.create({
          id,
          purpose: "external_identity_email",
          subjectKey,
          userId: null,
          userEmailId: null,
          emailJobId,
          browserBindingHash: flow.browserBindingHash,
          codeHash,
          tokenHash,
          context: { version: 1, flowId: flow.id, email },
          expiresAt,
        });
        yield* repository.audit.event.append({
          actorKind: "system",
          actorUserId: null,
          ...(flow.targetOrganizationId ? { organizationId: flow.targetOrganizationId } : {}),
          eventType: "auth.external_email_requested",
          targetType: "auth_flow",
          targetId: flow.id,
          metadata: { attempts: 0 },
        });
        return { challengeId: id, expiresAt };
      }),
    );
  });
  const verify = Effect.fn("Application.auth.external.verifyEmail")(function* (
    input: VerifyExternalEmailInput,
    actor?: SessionActor,
  ) {
    const accepted = yield* transaction.run(
      Effect.gen(function* () {
        const located = yield* requireFlow(input, actor);
        // Preserve connection -> organization -> flow/proof ordering used by configuration and completion.
        yield* repository.auth.identityConnection.lockById(located.flow.identityConnectionId);
        if (located.flow.targetOrganizationId !== null)
          yield* repository.organization.organization.lockById(located.flow.targetOrganizationId);
        yield* repository.auth.authFlow.lockById(input.flowId);
        const { flow, email } = yield* requireFlow(input, actor);
        const proof = yield* repository.auth.verification.lockById(input.challengeId);
        if (
          proof?.purpose !== "external_identity_email" ||
          proof.context.flowId !== flow.id ||
          proof.context.email !== email ||
          proof.browserBindingHash !== flow.browserBindingHash ||
          proof.consumedAt !== null ||
          proof.revokedAt !== null ||
          proof.attempts >= 5 ||
          DateTime.toEpochMillis(proof.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now)
        )
          return yield* new IdentityError({ code: "INVALID_PROOF" });
        const matches = yield* crypto.verifyFingerprint({
          purpose: cryptoPurpose.externalEmailCode,
          value: Redacted.make(`${proof.id}:${Redacted.value(input.code)}`),
          expectedFingerprint: proof.codeHash,
        });
        if (!matches) {
          const failed = yield* repository.auth.verification.recordFailure(proof.id);
          if (failed !== undefined) {
            if (failed.attempts >= 5) yield* emails.cancel(proof.emailJobId);
            yield* repository.audit.event.append({
              actorKind: "system",
              actorUserId: null,
              ...(flow.targetOrganizationId ? { organizationId: flow.targetOrganizationId } : {}),
              eventType: "auth.external_email_failed",
              targetType: "auth_flow",
              targetId: flow.id,
              metadata: { attempts: failed.attempts },
            });
          }
          return false;
        }
        if (
          (yield* repository.auth.verification.consume(proof.id)) === undefined ||
          (yield* repository.auth.authFlow.verifyEmail(flow.id)) === undefined
        )
          return yield* new IdentityError({ code: "INVALID_PROOF" });
        yield* emails.cancel(proof.emailJobId);
        yield* repository.audit.event.append({
          actorKind: "system",
          actorUserId: null,
          ...(flow.targetOrganizationId ? { organizationId: flow.targetOrganizationId } : {}),
          eventType: "auth.external_email_verified",
          targetType: "auth_flow",
          targetId: flow.id,
          metadata: { attempts: proof.attempts },
        });
        return true;
      }),
    );
    if (!accepted) return yield* new IdentityError({ code: "INVALID_PROOF" });
    // The mailbox proof is durable; admission remains an independently rechecked atomic transaction.
    const { flow, identity } = yield* requireFlow(input, actor);
    return yield* complete(flow, identity, actor);
  });
  const resume = Effect.fn("Application.auth.external.resume")(function* (
    input: ExternalFlowInput,
    actor?: SessionActor,
  ) {
    const { flow, identity } = yield* requireFlow(input, actor);
    return yield* complete(flow, identity, actor);
  });
  return { status, request, verify, resume };
});
