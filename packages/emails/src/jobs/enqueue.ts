import { Context, DateTime, Effect, Layer, Schema } from "effect";

import { DatabaseRepository, type DatabaseError } from "@usepreface/database";
import type { EmailJobId } from "@usepreface/protocol";
import { EmailPayload } from "@usepreface/protocol/model";

import { EmailPayloadCipher } from "#/cipher";
import { EmailError } from "#/errors";

export type EnqueueEmail = EmailPayload & {
  readonly idempotencyKey: string;
  readonly expiresAt: DateTime.Utc;
  readonly availableAt?: DateTime.Utc;
};

export class EmailJobs extends Context.Service<
  EmailJobs,
  {
    readonly enqueue: (
      input: EnqueueEmail,
    ) => Effect.Effect<EmailJobId, EmailError | DatabaseError>;
    readonly cancel: (id: EmailJobId) => Effect.Effect<void, DatabaseError>;
  }
>()("@usepreface/emails/EmailJobs") {
  static readonly layer = Layer.effect(
    EmailJobs,
    Effect.gen(function* () {
      const repository = (yield* DatabaseRepository).jobs.email;
      const cipher = yield* EmailPayloadCipher;
      const codec = Schema.fromJsonString(EmailPayload);

      return EmailJobs.of({
        enqueue: Effect.fn("EmailJobs.enqueue")(function* (input) {
          const now = yield* DateTime.now;
          const availableAt = input.availableAt ?? now;
          // Do not enqueue a message beyond the credential's own deadline.
          if (
            DateTime.toEpochMillis(input.expiresAt) <= DateTime.toEpochMillis(now) ||
            DateTime.toEpochMillis(availableAt) >= DateTime.toEpochMillis(input.expiresAt) ||
            (input.type !== "organization-security" &&
              DateTime.toEpochMillis(input.expiresAt) >
                DateTime.toEpochMillis(input.variables.expiresAt))
          ) {
            return yield* new EmailError({ code: "INVALID_EXPIRY" });
          }
          const payload = yield* Schema.encodeEffect(codec)(input).pipe(
            Effect.mapError(() => new EmailError({ code: "INVALID_PAYLOAD" })),
          );
          const key = yield* Schema.decodeUnknownEffect(
            Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
          )(input.idempotencyKey).pipe(
            Effect.mapError(() => new EmailError({ code: "INVALID_PAYLOAD" })),
          );
          const encryptedPayload = yield* cipher.encrypt(payload);
          const payloadFingerprint = yield* cipher.fingerprint(payload);
          const { job } = yield* repository.enqueue({
            type: input.type,
            idempotencyKey: key,
            encryptedPayload,
            payloadFingerprint,
            availableAt,
            expiresAt: input.expiresAt,
          });
          if (
            job.payloadFingerprint !== payloadFingerprint ||
            DateTime.toEpochMillis(job.expiresAt) !== DateTime.toEpochMillis(input.expiresAt)
          ) {
            return yield* new EmailError({ code: "IDEMPOTENCY_CONFLICT" });
          }
          return job.id;
        }),
        cancel: Effect.fn("EmailJobs.cancel")((id) => repository.cancel(id).pipe(Effect.asVoid)),
      });
    }),
  );
}
