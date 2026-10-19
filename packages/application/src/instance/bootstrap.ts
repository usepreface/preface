import { DateTime, Duration, Effect, Predicate, Redacted, Schema } from "effect";

import { cryptoPurpose, SecretCrypto, TokenCrypto } from "@usepreface/crypto";
import type { CryptoError } from "@usepreface/crypto";
import { DatabaseRepository, generateUuid7, TransactionService } from "@usepreface/database";
import type { DatabaseError } from "@usepreface/database";
import { EmailJobs } from "@usepreface/emails";
import type { EmailError } from "@usepreface/emails";
import { BootstrapChallengeId, BootstrapError, InstanceStateError } from "@usepreface/protocol";
import type {
  BootstrapStatus,
  BootstrapTokenInfo,
  BootstrapVerification,
  SessionActor,
} from "@usepreface/protocol/dto";
import {
  CompleteBootstrapInput,
  RequestBootstrapVerificationInput,
  ResendBootstrapVerificationInput,
} from "@usepreface/protocol/input";
import type { Installation } from "@usepreface/protocol/model";

import { makeSessionIssuance } from "#/auth/session-issuance";
import { makeOrganizationInitialization } from "#/organization/initialize";
import type { SecurityError } from "#/security/errors";
import { bootstrapTokenLifetime } from "#/security/policy";
import { TokenService } from "#/security/token";

export type BootstrapPreparation =
  | { readonly state: "ready" }
  | { readonly state: "pending"; readonly expiresAt: DateTime.Utc }
  | {
      readonly state: "issued";
      readonly expiresAt: DateTime.Utc;
      readonly token: Redacted.Redacted<string>;
    };

export interface BootstrapCompletion {
  readonly actor: SessionActor;
  readonly sessionToken: Redacted.Redacted<string>;
}

type BootstrapFailure =
  | BootstrapError
  | InstanceStateError
  | DatabaseError
  | SecurityError
  | CryptoError
  | EmailError;
const verificationLifetime = Duration.minutes(10);
const resendInterval = Duration.minutes(1);

const hasValidTokenWindow = (installation: Installation, now: DateTime.Utc) =>
  installation.bootstrapTokenHash !== null &&
  installation.bootstrapTokenIssuedAt !== null &&
  installation.bootstrapTokenExpiresAt !== null &&
  DateTime.toEpochMillis(installation.bootstrapTokenIssuedAt) <= DateTime.toEpochMillis(now) &&
  DateTime.toEpochMillis(installation.bootstrapTokenExpiresAt) > DateTime.toEpochMillis(now);

export const makeBootstrapApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const tokens = yield* TokenService;
  const random = yield* TokenCrypto;
  const crypto = yield* SecretCrypto;
  const emails = yield* EmailJobs;
  const issueSession = yield* makeSessionIssuance;
  const initializeOrganization = yield* makeOrganizationInitialization;

  const validateToken = Effect.fn("Application.instance.bootstrap.validateToken")(function* (
    installation: Installation,
    token: Redacted.Redacted<string>,
  ) {
    if (installation.bootstrapCompletedAt !== null)
      return yield* new BootstrapError({ code: "ALREADY_COMPLETED" });
    if (
      !hasValidTokenWindow(installation, yield* DateTime.now) ||
      installation.bootstrapTokenHash === null ||
      installation.bootstrapTokenExpiresAt === null ||
      !(yield* tokens.verifyBootstrap(token, installation.bootstrapTokenHash))
    ) {
      return yield* new BootstrapError({ code: "INVALID_TOKEN" });
    }
    return {
      hash: installation.bootstrapTokenHash,
      expiresAt: installation.bootstrapTokenExpiresAt,
    };
  });

  const getStatus = Effect.fn("Application.instance.bootstrap.getStatus")(function* () {
    const installation = yield* repository.instance.installation.find();
    const settings = yield* repository.instance.settings.find();
    if (installation === undefined || settings === undefined)
      return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
    return {
      state: installation.bootstrapCompletedAt === null ? "setup_required" : "ready",
      organizationName:
        (yield* repository.organization.organization.find())?.metadata.name ?? settings.displayName,
    } satisfies BootstrapStatus;
  });

  const inspectToken = Effect.fn("Application.instance.bootstrap.inspectToken")(function* (
    token: Redacted.Redacted<string>,
  ) {
    const installation = yield* repository.instance.installation.find();
    if (installation === undefined) return yield* new BootstrapError({ code: "INVALID_TOKEN" });
    const proof = yield* validateToken(installation, token);
    return { expiresAt: proof.expiresAt } satisfies BootstrapTokenInfo;
  });

  const prepareToken = Effect.fn("Application.instance.bootstrap.prepareToken")(function* (
    replace: boolean,
  ): Effect.fn.Return<BootstrapPreparation, BootstrapFailure> {
    const credential = yield* tokens.generateBootstrap();
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.instance.initialize();
        const installation = yield* repository.instance.installation.lock();
        if (installation.bootstrapCompletedAt !== null) {
          if (replace) return yield* new BootstrapError({ code: "ALREADY_COMPLETED" });
          return { state: "ready" } as const;
        }
        const now = yield* DateTime.now;
        if (
          !replace &&
          hasValidTokenWindow(installation, now) &&
          installation.bootstrapTokenExpiresAt !== null
        )
          return { state: "pending", expiresAt: installation.bootstrapTokenExpiresAt } as const;

        const challenge = yield* repository.instance.challenge.find();
        if (challenge !== undefined) {
          yield* emails.cancel(challenge.emailJobId);
          yield* repository.instance.challenge.clear();
        }
        const expiresAt = DateTime.addDuration(now, bootstrapTokenLifetime);
        const issued = yield* repository.instance.installation.issueBootstrapToken({
          hash: credential.hash,
          expiresAt,
        });
        if (issued === undefined)
          return yield* Effect.die(new Error("Locked installation refused setup token issuance"));
        yield* repository.audit.event.append({
          actorKind: "system",
          actorUserId: null,
          eventType: "instance.bootstrap_token_issued",
          targetType: "installation",
          targetId: installation.installationId,
          metadata: { replacesExisting: installation.bootstrapTokenHash !== null },
        });
        return { state: "issued", expiresAt, token: credential.token } as const;
      }),
    );
  });

  const issueVerification = Effect.fn("Application.instance.bootstrap.issueVerification")(
    function* (input: RequestBootstrapVerificationInput | ResendBootstrapVerificationInput) {
      yield* inspectToken(input.token);
      const id = Schema.decodeSync(BootstrapChallengeId)(generateUuid7());
      const code = yield* random.randomCode();
      const codeHash = yield* crypto.fingerprint({
        purpose: cryptoPurpose.setupVerificationCode,
        value: Redacted.make(`${id}:${Redacted.value(code)}`),
      });

      return yield* transaction.run(
        Effect.gen(function* () {
          const installation = yield* repository.instance.installation.lock();
          const proof = yield* validateToken(installation, input.token);
          const previous = yield* repository.instance.challenge.find();
          if (
            !("email" in input) &&
            (previous === undefined ||
              previous.id !== input.challengeId ||
              previous.bootstrapTokenHash !== proof.hash)
          )
            return yield* new BootstrapError({ code: "INVALID_CODE" });
          const details = "email" in input ? input : previous;
          if (details === undefined) return yield* new BootstrapError({ code: "INVALID_CODE" });
          const now = yield* DateTime.now;
          if (
            previous !== undefined &&
            DateTime.toEpochMillis(DateTime.addDuration(previous.createdAt, resendInterval)) >
              DateTime.toEpochMillis(now)
          )
            return yield* new BootstrapError({ code: "VERIFICATION_RATE_LIMITED" });
          if (previous !== undefined) yield* emails.cancel(previous.emailJobId);

          const deadline = DateTime.addDuration(now, verificationLifetime);
          const expiresAt =
            DateTime.toEpochMillis(deadline) < DateTime.toEpochMillis(proof.expiresAt)
              ? deadline
              : proof.expiresAt;
          const emailJobId = yield* emails.enqueue({
            type: "instance-setup",
            to: details.email,
            variables: {
              organizationName: details.organizationName,
              displayName: details.ownerName,
              code: Redacted.value(code),
              expiresAt,
            },
            idempotencyKey: `instance-setup:${id}`,
            expiresAt,
          });
          const challenge = yield* repository.instance.challenge.replace({
            id,
            bootstrapTokenHash: proof.hash,
            organizationName: details.organizationName,
            ownerName: details.ownerName,
            email: details.email,
            codeHash,
            emailJobId,
            expiresAt,
          });
          yield* repository.audit.event.append({
            actorKind: "system",
            actorUserId: null,
            eventType: "instance.bootstrap_verification_requested",
            targetType: "installation",
            targetId: installation.installationId,
            metadata: { challengeId: id, attempts: 0 },
          });
          return {
            challengeId: id,
            expiresAt,
            resendAt: DateTime.addDuration(challenge.createdAt, resendInterval),
          } satisfies BootstrapVerification;
        }),
      );
    },
  );

  const requestVerification = Effect.fn("Application.instance.bootstrap.requestVerification")(
    function* (input: RequestBootstrapVerificationInput) {
      const decoded = yield* Schema.decodeUnknownEffect(
        Schema.toType(RequestBootstrapVerificationInput),
      )(input).pipe(Effect.mapError(() => new BootstrapError({ code: "INVALID_INPUT" })));
      return yield* issueVerification(decoded);
    },
  );

  const resendVerification = Effect.fn("Application.instance.bootstrap.resendVerification")(
    function* (input: ResendBootstrapVerificationInput) {
      const decoded = yield* Schema.decodeUnknownEffect(
        Schema.toType(ResendBootstrapVerificationInput),
      )(input).pipe(Effect.mapError(() => new BootstrapError({ code: "INVALID_INPUT" })));
      return yield* issueVerification(decoded);
    },
  );

  const complete = Effect.fn("Application.instance.bootstrap.complete")(function* (
    input: CompleteBootstrapInput,
  ): Effect.fn.Return<BootstrapCompletion, BootstrapFailure> {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(CompleteBootstrapInput))(
      input,
    ).pipe(Effect.mapError(() => new BootstrapError({ code: "INVALID_INPUT" })));
    yield* inspectToken(decoded.token);
    const sessionCredential = yield* tokens.generateSession();

    const outcome = yield* transaction.run(
      Effect.gen(function* () {
        const installation = yield* repository.instance.installation.lock();
        const proof = yield* validateToken(installation, decoded.token);
        const challenge = yield* repository.instance.challenge.find();
        if (
          challenge === undefined ||
          challenge.id !== decoded.challengeId ||
          challenge.bootstrapTokenHash !== proof.hash ||
          challenge.attempts >= 5 ||
          DateTime.toEpochMillis(challenge.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now)
        )
          return yield* new BootstrapError({ code: "INVALID_CODE" });
        const matches = yield* crypto.verifyFingerprint({
          purpose: cryptoPurpose.setupVerificationCode,
          value: Redacted.make(`${challenge.id}:${Redacted.value(decoded.code)}`),
          expectedFingerprint: challenge.codeHash,
        });
        if (!matches) {
          const failed = yield* repository.instance.challenge.recordFailure(challenge.id);
          if (failed !== undefined && failed.attempts >= 5) yield* emails.cancel(failed.emailJobId);
          if (failed !== undefined)
            yield* repository.audit.event.append({
              actorKind: "system",
              actorUserId: null,
              eventType: "instance.bootstrap_verification_failed",
              targetType: "installation",
              targetId: installation.installationId,
              metadata: { challengeId: challenge.id, attempts: failed.attempts },
            });
          // Return a marker so the failed-attempt update commits before the public error.
          return { state: "invalid" } as const;
        }

        const user = yield* repository.auth.user.create({
          metadata: { version: 1, name: challenge.ownerName },
        });
        const address = yield* repository.auth.userEmail
          .create({
            userId: user.id,
            email: challenge.email,
            isPrimary: true,
            loginEnabled: true,
            verifiedAt: yield* DateTime.now,
          })
          .pipe(
            Effect.mapError((error) =>
              Predicate.isTagged(error.reason, "UniqueViolation") &&
              error.reason.constraint === "user_email_active_email_uidx"
                ? new BootstrapError({ code: "EMAIL_UNAVAILABLE" })
                : error,
            ),
          );
        const owner = yield* repository.instance.owner.grant({
          userId: user.id,
          grantSource: "bootstrap",
          grantedByUserId: null,
        });
        yield* initializeOrganization(user.id, challenge.organizationName);
        const settings = yield* repository.instance.settings.find();
        if (settings === undefined)
          return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
        const updated = yield* repository.instance.settings.update({
          displayName: challenge.organizationName,
          revision: settings.revision,
        });
        if (updated === undefined)
          return yield* Effect.die(
            new Error("Instance settings changed outside the installation lock"),
          );
        const session = yield* issueSession({
          userId: user.id,
          userEmailId: address.id,
          credential: sessionCredential,
          method: "bootstrap_email_code",
        }).pipe(
          Effect.catchTag("AuthenticationError", () =>
            Effect.fail(new BootstrapError({ code: "INVALID_CODE" })),
          ),
        );
        yield* emails.cancel(challenge.emailJobId);
        if ((yield* repository.instance.challenge.consume(challenge.id)) === undefined)
          return yield* new BootstrapError({ code: "INVALID_CODE" });
        if ((yield* repository.instance.installation.completeBootstrap(proof.hash)) === undefined)
          return yield* new BootstrapError({ code: "INVALID_TOKEN" });

        yield* repository.audit.event.append({
          actorKind: "system",
          actorUserId: null,
          eventType: "instance.owner_granted",
          targetType: "instance_owner",
          targetId: owner.id,
          metadata: { grantSource: "bootstrap" },
        });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: user.id,
          eventType: "auth.email_verified",
          targetType: "user",
          targetId: user.id,
          metadata: {},
        });
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: user.id,
          eventType: "instance.bootstrap_completed",
          targetType: "installation",
          targetId: installation.installationId,
          metadata: {},
        });
        return { state: "completed", result: session } as const;
      }),
    );
    if (outcome.state === "invalid") return yield* new BootstrapError({ code: "INVALID_CODE" });
    return outcome.result;
  });

  return {
    prepare: () => prepareToken(false),
    reissueToken: () => prepareToken(true),
    getStatus,
    inspectToken,
    requestVerification,
    resendVerification,
    complete,
  } as const;
});
