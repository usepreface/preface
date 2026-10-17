import { DateTime, Effect, Redacted, Schema } from "effect";

import { TokenCrypto, SecretCrypto, cryptoPurpose } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { IdentityError, VerificationId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { ResendEmailSignInInput, VerifyEmailSignInInput } from "@usepreface/protocol/input";

import { AuthenticationLinks } from "#/auth/links";
import { OrganizationAccess } from "#/organization/access";

export const makeEmailReauthenticationApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const emails = yield* EmailJobs;
  const access = yield* OrganizationAccess;
  const links = yield* AuthenticationLinks;
  const requireProof = Effect.fn("EmailReauthentication.requireProof")(function* (
    actor: SessionActor,
    id: VerificationId,
    browserToken: Redacted.Redacted<string>,
  ) {
    const proof = yield* repository.auth.verification.lockById(id);
    if (
      proof === undefined ||
      proof.purpose !== "email_reauthentication" ||
      proof.context.sessionId !== actor.session.id ||
      proof.userId !== actor.user.id ||
      proof.consumedAt !== null ||
      proof.revokedAt !== null ||
      proof.attempts >= 5 ||
      DateTime.toEpochMillis(proof.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now) ||
      !(yield* tokens.verifyToken({
        purpose: cryptoPurpose.emailReauthenticationBrowser,
        token: browserToken,
        expectedDigest: proof.browserBindingHash,
      }))
    )
      return yield* new IdentityError({ code: "INVALID_PROOF" });
    return proof;
  });
  const issue = Effect.fn("Application.auth.reauthentication.email.issue")(function* (
    actor: SessionActor,
    previous?: ResendEmailSignInInput,
  ) {
    const id = Schema.decodeSync(VerificationId)(generateUuid7());
    const code = yield* tokens.randomCode();
    const link = yield* tokens.randomToken();
    const browserToken = yield* tokens.randomToken();
    const codeHash = yield* crypto.fingerprint({
      purpose: cryptoPurpose.emailReauthenticationCode,
      value: Redacted.make(`${id}:${Redacted.value(code)}`),
    });
    const tokenHash = yield* tokens.digestToken({
      purpose: cryptoPurpose.emailReauthenticationLink,
      token: link,
    });
    const browserBindingHash = yield* tokens.digestToken({
      purpose: cryptoPurpose.emailReauthenticationBrowser,
      token: browserToken,
    });
    const subjectKey = yield* crypto.fingerprint({
      purpose: cryptoPurpose.emailReauthenticationSubject,
      value: Redacted.make(actor.session.id),
    });
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.user.lockById(actor.user.id);
        yield* access.requireActor(actor);
        if (previous !== undefined)
          yield* requireProof(actor, previous.challengeId, previous.browserToken);
        const address = yield* repository.auth.userEmail.findPrimaryByUserId(actor.user.id);
        if (
          address === undefined ||
          address.verifiedAt === null ||
          !address.loginEnabled ||
          address.removedAt !== null
        )
          return yield* new IdentityError({ code: "EMAIL_UNAVAILABLE" });
        const retired = yield* repository.auth.verification.retirePendingBySubject(
          subjectKey,
          "email_reauthentication",
        );
        for (const proof of retired)
          if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);
        const requestedExpiry = DateTime.addDuration(yield* DateTime.now, "10 minutes");
        const expiresAt =
          DateTime.toEpochMillis(requestedExpiry) < DateTime.toEpochMillis(actor.session.expiresAt)
            ? requestedExpiry
            : actor.session.expiresAt;
        const settings = yield* repository.instance.settings.find();
        if (settings === undefined)
          return yield* Effect.die(new Error("Installation settings missing"));
        const url = new URL("/auth/email/reauthenticate", links.publicOrigin);
        url.hash = new URLSearchParams({ challengeId: id, token: Redacted.value(link) }).toString();
        const emailJobId = yield* emails.enqueue({
          type: "email-reauthentication",
          to: address.email,
          variables: {
            instanceName: settings.displayName,
            code: Redacted.value(code),
            magicLinkUrl: url.href,
            expiresAt,
          },
          idempotencyKey: `email-reauthentication:${id}`,
          expiresAt,
        });
        yield* repository.auth.verification.create({
          id,
          purpose: "email_reauthentication",
          subjectKey,
          userId: actor.user.id,
          userEmailId: address.id,
          browserBindingHash,
          codeHash,
          tokenHash,
          emailJobId,
          context: { version: 1, sessionId: actor.session.id },
          expiresAt,
        });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "auth.email_reauthentication_requested",
          targetType: "verification",
          targetId: id,
          metadata: { attempts: 0 },
        });
        return { challenge: { challengeId: id, expiresAt }, browserToken };
      }),
    );
  });
  const verify = Effect.fn("Application.auth.reauthentication.email.verify")(function* (
    actor: SessionActor,
    input: VerifyEmailSignInInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(VerifyEmailSignInInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    const success = yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.auth.user.lockById(actor.user.id);
        yield* access.requireActor(actor);
        const proof = yield* requireProof(actor, decoded.challengeId, decoded.browserToken);
        const address = yield* repository.auth.userEmail.findById(proof.userEmailId);
        if (
          address === undefined ||
          address.userId !== actor.user.id ||
          address.verifiedAt === null ||
          !address.loginEnabled ||
          address.removedAt !== null
        )
          return yield* new IdentityError({ code: "EMAIL_UNAVAILABLE" });
        const matches =
          decoded.method === "code"
            ? yield* crypto.verifyFingerprint({
                purpose: cryptoPurpose.emailReauthenticationCode,
                value: Redacted.make(`${proof.id}:${Redacted.value(decoded.code)}`),
                expectedFingerprint: proof.codeHash,
              })
            : yield* tokens.verifyToken({
                purpose: cryptoPurpose.emailReauthenticationLink,
                token: decoded.token,
                expectedDigest: proof.tokenHash,
              });
        if (!matches) {
          const failed = yield* repository.auth.verification.recordFailure(proof.id);
          if (failed !== undefined) {
            if (failed.attempts >= 5) yield* emails.cancel(proof.emailJobId);
            yield* repository.audit.event.append({
              actorKind: "user",
              actorUserId: actor.user.id,
              eventType: "auth.email_reauthentication_failed",
              targetType: "verification",
              targetId: proof.id,
              metadata: { attempts: failed.attempts },
            });
          }
          return false;
        }
        const method = decoded.method === "code" ? "email_code" : "email_link";
        yield* repository.auth.sessionAuthentication.create({
          sessionId: actor.session.id,
          userId: actor.user.id,
          userEmailId: address.id,
          method,
          authenticatedAt: yield* DateTime.now,
          expiresAt: actor.session.expiresAt,
          assurance: { version: 1, emailVerified: true },
        });
        if ((yield* repository.auth.verification.consume(proof.id)) === undefined)
          return yield* new IdentityError({ code: "INVALID_PROOF" });
        yield* emails.cancel(proof.emailJobId);
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "auth.session_authenticated",
          targetType: "session",
          targetId: actor.session.id,
          metadata: { method, userEmailId: address.id },
        });
        return true;
      }),
    );
    if (!success) return yield* new IdentityError({ code: "INVALID_PROOF" });
  });
  return {
    request: (actor: SessionActor) => issue(actor),
    resend: Effect.fn("Application.auth.reauthentication.email.resend")(function* (
      actor: SessionActor,
      input: ResendEmailSignInInput,
    ) {
      const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(ResendEmailSignInInput))(
        input,
      ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
      return yield* issue(actor, decoded);
    }),
    verify,
  };
});
