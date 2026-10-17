import type { Redacted } from "effect";
import { DateTime, Effect, Predicate, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import type { DatabaseError } from "@usepreface/database";
import { BootstrapError, InstanceStateError } from "@usepreface/protocol";
import type { BootstrapStatus, BootstrapTokenInfo, SessionActor } from "@usepreface/protocol/dto";
import { CompleteBootstrapInput } from "@usepreface/protocol/input";
import type { Installation } from "@usepreface/protocol/model";

import type { SecurityError } from "#/security/errors";
import { PasswordService } from "#/security/password";
import { bootstrapTokenLifetime, sessionLifetime } from "#/security/policy";
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

type BootstrapFailure = BootstrapError | InstanceStateError | DatabaseError | SecurityError;

const hasValidTokenWindow = (installation: Installation, now: DateTime.Utc) =>
  installation.bootstrapTokenHash !== null &&
  installation.bootstrapTokenIssuedAt !== null &&
  installation.bootstrapTokenExpiresAt !== null &&
  DateTime.toEpochMillis(installation.bootstrapTokenIssuedAt) <= DateTime.toEpochMillis(now) &&
  DateTime.toEpochMillis(installation.bootstrapTokenExpiresAt) > DateTime.toEpochMillis(now);

export const makeBootstrapApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const passwords = yield* PasswordService;
  const tokens = yield* TokenService;

  const validateToken = Effect.fn("Application.instance.bootstrap.validateToken")(function* (
    installation: Installation,
    token: Redacted.Redacted<string>,
  ) {
    if (installation.bootstrapCompletedAt !== null)
      return yield* new BootstrapError({ code: "ALREADY_COMPLETED" });
    const now = yield* DateTime.now;
    if (
      !hasValidTokenWindow(installation, now) ||
      installation.bootstrapTokenHash === null ||
      installation.bootstrapTokenExpiresAt === null
    ) {
      return yield* new BootstrapError({ code: "INVALID_TOKEN" });
    }
    if (!(yield* tokens.verifyBootstrap(token, installation.bootstrapTokenHash))) {
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
    const status: BootstrapStatus = {
      state: installation.bootstrapCompletedAt === null ? "setup_required" : "ready",
      instanceName: settings.displayName,
    };
    return status;
  });

  const inspectToken = Effect.fn("Application.instance.bootstrap.inspectToken")(function* (
    token: Redacted.Redacted<string>,
  ) {
    const installation = yield* repository.instance.installation.find();
    if (installation === undefined) return yield* new BootstrapError({ code: "INVALID_TOKEN" });
    const validated = yield* validateToken(installation, token);
    const info: BootstrapTokenInfo = { expiresAt: validated.expiresAt };
    return info;
  });

  const prepareToken = Effect.fn("Application.instance.bootstrap.prepareToken")(function* (
    replace: boolean,
  ): Effect.fn.Return<BootstrapPreparation, BootstrapFailure> {
    // Entropy acquisition stays outside the SQL transaction, including on restarts.
    const credential = yield* tokens.generateBootstrap();

    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.instance.initialize();
        const installation = yield* repository.instance.installation.lock();
        if (installation.bootstrapCompletedAt !== null) {
          if (replace) return yield* new BootstrapError({ code: "ALREADY_COMPLETED" });
          return { state: "ready" } as const satisfies BootstrapPreparation;
        }

        const now = yield* DateTime.now;
        if (
          !replace &&
          hasValidTokenWindow(installation, now) &&
          installation.bootstrapTokenExpiresAt !== null
        ) {
          return {
            state: "pending",
            expiresAt: installation.bootstrapTokenExpiresAt,
          } as const satisfies BootstrapPreparation;
        }

        const expiresAt = DateTime.addDuration(now, bootstrapTokenLifetime);
        const issued = yield* repository.instance.installation.issueBootstrapToken({
          hash: credential.hash,
          expiresAt,
        });
        if (issued === undefined)
          return yield* Effect.die(
            new Error("Locked installation refused bootstrap token issuance"),
          );

        yield* repository.audit.event.append({
          actorKind: "system",
          actorUserId: null,
          eventType: "instance.bootstrap_token_issued",
          targetType: "installation",
          targetId: installation.installationId,
          metadata: { replacesExisting: installation.bootstrapTokenHash !== null },
        });
        return {
          state: "issued",
          expiresAt,
          token: credential.token,
        } as const satisfies BootstrapPreparation;
      }),
    );
  });

  const complete = Effect.fn("Application.instance.bootstrap.complete")(function* (
    input: CompleteBootstrapInput,
  ): Effect.fn.Return<BootstrapCompletion, BootstrapFailure> {
    // Transport decodes the wire schema; direct callers are checked against its decoded form.
    const validated = yield* Schema.decodeUnknownEffect(Schema.toType(CompleteBootstrapInput))(
      input,
    ).pipe(Effect.mapError(() => new BootstrapError({ code: "INVALID_INPUT" })));
    yield* inspectToken(validated.token);
    const passwordHash = yield* passwords.hash(validated.password);
    const sessionCredential = yield* tokens.generateSession();

    return yield* transaction.run(
      Effect.gen(function* () {
        const installation = yield* repository.instance.installation.lock();
        const proof = yield* validateToken(installation, validated.token);
        const user = yield* repository.auth.user
          .create({
            displayName: validated.ownerName,
            email: validated.email,
          })
          .pipe(
            Effect.mapError((error) =>
              Predicate.isTagged(error.reason, "UniqueViolation") &&
              error.reason.constraint === "user_email_uidx"
                ? new BootstrapError({ code: "EMAIL_UNAVAILABLE" })
                : error,
            ),
          );
        yield* repository.auth.passwordCredential.create({ userId: user.id, passwordHash });
        const owner = yield* repository.instance.owner.grant({
          userId: user.id,
          grantSource: "bootstrap",
          grantedByUserId: null,
        });
        const settings = yield* repository.instance.settings.find();
        if (settings === undefined)
          return yield* new InstanceStateError({ code: "NOT_INITIALIZED" });
        const updated = yield* repository.instance.settings.update({
          displayName: validated.instanceName,
          revision: settings.revision,
        });
        if (updated === undefined)
          return yield* Effect.die(
            new Error("Instance settings changed outside the installation lock"),
          );

        const session = yield* repository.auth.session.create({
          userId: user.id,
          tokenHash: sessionCredential.hash,
          expiresAt: DateTime.addDuration(yield* DateTime.now, sessionLifetime),
        });
        const completed = yield* repository.instance.installation.completeBootstrap(proof.hash);
        if (completed === undefined) return yield* new BootstrapError({ code: "INVALID_TOKEN" });

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
          eventType: "auth.session_created",
          targetType: "session",
          targetId: session.id,
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

        const actor: SessionActor = {
          user: {
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            emailVerifiedAt: user.emailVerifiedAt,
          },
          session: { id: session.id, expiresAt: session.expiresAt },
        };
        // The server unwraps only sessionToken for its cookie; actor is the safe response.
        return { actor, sessionToken: sessionCredential.token } as const;
      }),
    );
  });

  return {
    prepare: () => prepareToken(false),
    reissueToken: () => prepareToken(true),
    getStatus,
    inspectToken,
    complete,
  } as const;
});
