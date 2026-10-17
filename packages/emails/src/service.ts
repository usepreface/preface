import { Context, DateTime, Effect, Layer } from "effect";

import type { EmailPayload } from "@usepreface/protocol/model";

import { EmailSender } from "#/config";
import { EmailError, EmailProviderError } from "#/errors";
import { emailPolicy } from "#/policy";
import { EmailProvider, type EmailReceipt } from "#/provider";
import { EmailRenderer } from "#/renderer";

export class EmailService extends Context.Service<
  EmailService,
  {
    readonly send: (
      input: EmailPayload & { readonly idempotencyKey: string; readonly expiresAt?: DateTime.Utc },
    ) => Effect.Effect<EmailReceipt, EmailError | EmailProviderError>;
  }
>()("@usepreface/emails/EmailService") {
  static readonly layer = Layer.effect(
    EmailService,
    Effect.gen(function* () {
      const renderer = yield* EmailRenderer;
      const provider = yield* EmailProvider;
      const sender = yield* EmailSender;

      return EmailService.of({
        send: Effect.fn("EmailService.send")(
          function* (input) {
            const rendered = yield* renderer.render(input);
            const payloadExpiresAt =
              input.type === "organization-security"
                ? DateTime.addDuration(input.variables.occurredAt, "7 days")
                : input.variables.expiresAt;
            if (
              Math.min(
                DateTime.toEpochMillis(payloadExpiresAt),
                DateTime.toEpochMillis(input.expiresAt ?? payloadExpiresAt),
              ) <= DateTime.toEpochMillis(yield* DateTime.now)
            ) {
              return yield* new EmailError({ code: "INVALID_EXPIRY" });
            }
            return yield* provider.send({
              ...rendered,
              to: input.to,
              from: sender.from,
              ...(sender.replyTo === undefined ? {} : { replyTo: sender.replyTo }),
              idempotencyKey: input.idempotencyKey,
            });
          },
          Effect.timeoutOrElse({
            duration: emailPolicy.requestTimeout,
            orElse: () =>
              Effect.fail(
                new EmailProviderError({
                  code: "UNKNOWN_OUTCOME",
                  retryable: provider.supportsIdempotency,
                }),
              ),
          }),
        ),
      });
    }),
  );
}
