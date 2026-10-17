import { Context, Crypto, DateTime, Effect, Layer, Option, Result, Schema } from "effect";

import { Database, DatabaseMigration, DatabaseRepository } from "@usepreface/database";
import { EmailPayload } from "@usepreface/protocol/model";

import { EmailPayloadCipher } from "#/cipher";
import { EmailError, EmailProviderError } from "#/errors";
import { emailPolicy, emailRetryDelay } from "#/policy";
import { EmailProvider } from "#/provider";
import { EmailService } from "#/service";

const makeDelivery = Effect.gen(function* () {
  yield* DatabaseMigration;
  const database = yield* Database;
  const repository = (yield* DatabaseRepository).jobs.email;
  const cipher = yield* EmailPayloadCipher;
  const email = yield* EmailService;
  const provider = yield* EmailProvider;
  const crypto = yield* Crypto.Crypto;
  const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(EmailPayload));

  const processOnce = Effect.fn("EmailDelivery.processOnce")(function* () {
    const transaction = yield* Effect.serviceOption(database.$client.transactionService);
    if (Option.isSome(transaction))
      return yield* Effect.die(new Error("Email delivery cannot run inside a SQL transaction"));

    const leaseToken = yield* crypto
      .randomUUIDv4()
      .pipe(Effect.mapError(() => new EmailError({ code: "ENCRYPT_FAILED" })));
    const job = yield* repository.claim({
      leaseToken,
      leaseExpiresAt: DateTime.addDuration(yield* DateTime.now, emailPolicy.leaseDuration),
      maximumAttempts: emailPolicy.maximumAttempts,
      provider: provider.name,
      supportsIdempotency: provider.supportsIdempotency,
      replayAfter: DateTime.subtractDuration(yield* DateTime.now, emailPolicy.replayWindow),
    });
    if (job === undefined) return 0;

    const payload = yield* Effect.result(
      Effect.gen(function* () {
        if (job.encryptedPayload === null) return yield* new EmailError({ code: "DECRYPT_FAILED" });
        const plaintext = yield* cipher.decrypt(job.encryptedPayload);
        return yield* decode(plaintext).pipe(
          Effect.mapError(() => new EmailError({ code: "INVALID_PAYLOAD" })),
        );
      }),
    );
    if (Result.isFailure(payload)) {
      yield* repository.finish({
        id: job.id,
        leaseToken,
        status: "failed",
        lastErrorCode:
          payload.failure.code === "DECRYPT_FAILED" ? "DECRYPT_FAILED" : "INVALID_PAYLOAD",
      });
      return 1;
    }

    const now = yield* DateTime.now;
    if (DateTime.toEpochMillis(job.expiresAt) <= DateTime.toEpochMillis(now)) {
      yield* repository.finish({ id: job.id, leaseToken, status: "expired" });
      return 1;
    }

    const delivered = yield* email
      .send({ ...payload.success, idempotencyKey: job.id, expiresAt: job.expiresAt })
      .pipe(Effect.result);
    if (Result.isSuccess(delivered)) {
      const completed = yield* repository.finish({
        id: job.id,
        leaseToken,
        status: "sent",
        providerMessageId: delivered.success.messageId,
      });
      if (completed !== undefined)
        yield* Effect.logInfo("email.job.sent").pipe(
          Effect.annotateLogs({ type: job.type, provider: provider.name }),
        );
      return 1;
    }

    const error = delivered.failure;
    const retryAt = DateTime.addDuration(yield* DateTime.now, emailRetryDelay(job.attempts));
    const expired =
      error.code === "INVALID_EXPIRY" ||
      DateTime.toEpochMillis(job.expiresAt) <= DateTime.toEpochMillis(yield* DateTime.now);
    const code = error instanceof EmailProviderError ? error.code : "RENDER_FAILED";
    if (
      !expired &&
      error instanceof EmailProviderError &&
      error.retryable &&
      job.attempts < emailPolicy.maximumAttempts &&
      DateTime.toEpochMillis(retryAt) < DateTime.toEpochMillis(job.expiresAt)
    ) {
      yield* repository.reschedule({
        id: job.id,
        leaseToken,
        availableAt: retryAt,
        lastErrorCode: code,
      });
    } else {
      yield* repository.finish({
        id: job.id,
        leaseToken,
        status: expired ? "expired" : "failed",
        ...(expired ? {} : { lastErrorCode: code }),
      });
    }
    yield* Effect.logWarning("email.job.delivery_failed").pipe(
      Effect.annotateLogs({
        type: job.type,
        provider: provider.name,
        reason: expired ? "EXPIRED" : code,
      }),
    );
    return 1;
  });

  return { processOnce: processOnce() } as const;
});

export class EmailDelivery extends Context.Service<
  EmailDelivery,
  Effect.Success<typeof makeDelivery>
>()("@usepreface/emails/EmailDelivery") {
  static readonly layer = Layer.effect(EmailDelivery, makeDelivery);
}
