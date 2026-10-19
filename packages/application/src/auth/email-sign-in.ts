import { DateTime, Effect, Predicate, Redacted, Schema } from "effect";

import { cryptoPurpose, SecretCrypto, TokenCrypto } from "@usepreface/crypto";
import { DatabaseRepository, generateUuid7, TransactionService } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import { EmailSignInError, VerificationId } from "@usepreface/protocol";
import type { EmailSignInChallenge } from "@usepreface/protocol/dto";
import {
  RequestEmailSignInInput,
  ResendEmailSignInInput,
  VerifyEmailSignInInput,
} from "@usepreface/protocol/input";
import type { UserEmailAddress, Verification } from "@usepreface/protocol/model";

import { AuthenticationLinks } from "#/auth/links";
import { makeSessionIssuance } from "#/auth/session-issuance";
import { TokenService } from "#/security/token";

const permitsEmailProof = (email: UserEmailAddress) =>
  email.removedAt === null && email.loginEnabled && email.verifiedAt !== null;

export const makeEmailSignInApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const crypto = yield* SecretCrypto;
  const random = yield* TokenCrypto;
  const tokens = yield* TokenService;
  const emails = yield* EmailJobs;
  const links = yield* AuthenticationLinks;
  const issueSession = yield* makeSessionIssuance;

  const browserMatches = (proof: Verification, token: Redacted.Redacted<string>) =>
    random.verifyToken({
      purpose: cryptoPurpose.emailSignInBrowser,
      token,
      expectedDigest: proof.browserBindingHash,
    });
  const recipientKey = (email: string) =>
    crypto.fingerprint({
      purpose: cryptoPurpose.emailSignInRecipient,
      value: Redacted.make(email),
    });

  const issue = Effect.fn("Application.auth.emailSignIn.issue")(function* (
    input: RequestEmailSignInInput | ResendEmailSignInInput,
  ) {
    const installation = yield* repository.instance.installation.find();
    if (installation === undefined || installation.bootstrapCompletedAt === null)
      return yield* new EmailSignInError({ code: "INSTANCE_NOT_READY" });

    const id = Schema.decodeSync(VerificationId)(generateUuid7());
    const code = yield* random.randomCode();
    const linkToken = yield* random.randomToken();
    const browserToken = yield* random.randomToken();
    const codeHash = yield* crypto.fingerprint({
      purpose: cryptoPurpose.emailSignInCode,
      value: Redacted.make(`${id}:${Redacted.value(code)}`),
    });
    const tokenHash = yield* random.digestToken({
      purpose: cryptoPurpose.emailSignInLink,
      token: linkToken,
    });
    const browserBindingHash = yield* random.digestToken({
      purpose: cryptoPurpose.emailSignInBrowser,
      token: browserToken,
    });
    const requestSubject = "email" in input ? yield* recipientKey(input.email) : undefined;

    const challenge = yield* transaction
      .run(
        Effect.gen(function* () {
          const previous =
            "challengeId" in input
              ? yield* repository.auth.verification.lockById(input.challengeId)
              : undefined;
          if (
            "challengeId" in input &&
            (previous === undefined ||
              previous.purpose !== "email_sign_in" ||
              previous.consumedAt !== null ||
              previous.revokedAt !== null ||
              DateTime.toEpochMillis(previous.expiresAt) <=
                DateTime.toEpochMillis(yield* DateTime.now) ||
              !(yield* browserMatches(previous, input.browserToken)))
          )
            return yield* new EmailSignInError({ code: "INVALID_PROOF" });
          const subjectKey = requestSubject ?? previous?.subjectKey;
          if (subjectKey === undefined)
            return yield* Effect.die(new Error("Sign-in issuance has no recipient binding"));

          // Conditional retirement plus the unique pending-subject index coordinate competing issuances.
          const retired = yield* repository.auth.verification.retirePendingBySubject(subjectKey);
          for (const proof of retired)
            if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);

          const address =
            "email" in input
              ? yield* repository.auth.userEmail.findActiveByEmail(input.email)
              : previous === undefined || previous.userEmailId === null
                ? undefined
                : yield* repository.auth.userEmail.findById(previous.userEmailId);
          const user =
            address === undefined
              ? undefined
              : yield* repository.auth.user.findById(address.userId);
          const eligible =
            address !== undefined &&
            user !== undefined &&
            user.disabledAt === null &&
            permitsEmailProof(address) &&
            (yield* recipientKey(address.email)) === subjectKey;
          const expiresAt = DateTime.addDuration(yield* DateTime.now, "10 minutes");
          const url = new URL("/auth/email/verify", links.dashboardOrigin ?? links.publicOrigin);
          url.hash = new URLSearchParams({
            challengeId: id,
            token: Redacted.value(linkToken),
          }).toString();
          const settings = yield* repository.instance.settings.find();
          if (settings === undefined)
            return yield* Effect.die(new Error("Prepared installation has no settings"));

          const emailJobId = eligible
            ? yield* emails.enqueue({
                type: "sign-in",
                to: address.email,
                variables: {
                  organizationName:
                    (yield* repository.organization.organization.find())?.metadata.name ??
                    settings.displayName,
                  code: Redacted.value(code),
                  magicLinkUrl: url.href,
                  expiresAt,
                },
                idempotencyKey: `email-sign-in:${id}`,
                expiresAt,
              })
            : null;
          yield* repository.auth.verification.create({
            id,
            purpose: "email_sign_in",
            subjectKey,
            userId: eligible ? user.id : null,
            userEmailId: eligible ? address.id : null,
            browserBindingHash,
            codeHash,
            tokenHash,
            emailJobId,
            context: { version: 1 },
            expiresAt,
          });
          yield* repository.audit.event.append({
            actorKind: "system",
            actorUserId: null,
            eventType: "auth.email_sign_in_requested",
            targetType: "verification",
            targetId: id,
            metadata: { attempts: 0 },
          });
          return { challengeId: id, expiresAt } satisfies EmailSignInChallenge;
        }),
      )
      .pipe(
        Effect.retry({
          times: 3,
          while: (error) =>
            Predicate.isTagged(error, "DatabaseError") &&
            Predicate.isTagged(error.reason, "UniqueViolation") &&
            error.reason.constraint === "verification_pending_subject_uidx",
        }),
      );

    return { challenge, browserToken } as const;
  });

  const request = Effect.fn("Application.auth.emailSignIn.request")(function* (
    input: RequestEmailSignInInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(RequestEmailSignInInput))(
      input,
    ).pipe(Effect.mapError(() => new EmailSignInError({ code: "INVALID_INPUT" })));
    return yield* issue(decoded);
  });
  const resend = Effect.fn("Application.auth.emailSignIn.resend")(function* (
    input: ResendEmailSignInInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(ResendEmailSignInInput))(
      input,
    ).pipe(Effect.mapError(() => new EmailSignInError({ code: "INVALID_INPUT" })));
    return yield* issue(decoded);
  });
  const verify = Effect.fn("Application.auth.emailSignIn.verify")(function* (
    input: VerifyEmailSignInInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(VerifyEmailSignInInput))(
      input,
    ).pipe(Effect.mapError(() => new EmailSignInError({ code: "INVALID_INPUT" })));
    const credential = yield* tokens.generateSession();
    const result = yield* transaction.run(
      Effect.gen(function* () {
        const proof = yield* repository.auth.verification.lockById(decoded.challengeId);
        if (
          proof === undefined ||
          proof.purpose !== "email_sign_in" ||
          proof.consumedAt !== null ||
          proof.revokedAt !== null ||
          proof.attempts >= 5 ||
          DateTime.toEpochMillis(proof.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now) ||
          !(yield* browserMatches(proof, decoded.browserToken))
        )
          return yield* new EmailSignInError({ code: "INVALID_PROOF" });
        const matches =
          decoded.method === "code"
            ? yield* crypto.verifyFingerprint({
                purpose: cryptoPurpose.emailSignInCode,
                value: Redacted.make(`${proof.id}:${Redacted.value(decoded.code)}`),
                expectedFingerprint: proof.codeHash,
              })
            : yield* random.verifyToken({
                purpose: cryptoPurpose.emailSignInLink,
                token: decoded.token,
                expectedDigest: proof.tokenHash,
              });
        const user =
          proof.userId === null ? undefined : yield* repository.auth.user.lockById(proof.userId);
        const address =
          proof.userEmailId === null
            ? undefined
            : yield* repository.auth.userEmail.findById(proof.userEmailId);
        const eligible =
          matches &&
          user !== undefined &&
          user.disabledAt === null &&
          address !== undefined &&
          address.userId === user.id &&
          permitsEmailProof(address) &&
          (yield* recipientKey(address.email)) === proof.subjectKey;
        if (!eligible) {
          const failed = yield* repository.auth.verification.recordFailure(proof.id);
          if (failed !== undefined) {
            if (failed.attempts >= 5 && failed.emailJobId !== null)
              yield* emails.cancel(failed.emailJobId);
            yield* repository.audit.event.append({
              actorKind: "system",
              actorUserId: null,
              eventType: "auth.email_sign_in_failed",
              targetType: "verification",
              targetId: proof.id,
              metadata: { attempts: failed.attempts },
            });
          }
          // Commit the failure budget before translating it to the public failure.
          return undefined;
        }
        const session = yield* issueSession({
          userId: user.id,
          userEmailId: address.id,
          credential,
          method: decoded.method === "code" ? "email_code" : "email_link",
        }).pipe(
          Effect.catchTag("AuthenticationError", () =>
            Effect.fail(new EmailSignInError({ code: "INVALID_PROOF" })),
          ),
        );
        if ((yield* repository.auth.verification.consume(proof.id)) === undefined)
          return yield* new EmailSignInError({ code: "INVALID_PROOF" });
        if (proof.emailJobId !== null) yield* emails.cancel(proof.emailJobId);
        return session;
      }),
    );
    if (result === undefined) return yield* new EmailSignInError({ code: "INVALID_PROOF" });
    return result;
  });
  return { request, resend, verify } as const;
});
