import { Config, Effect, Layer, Redacted, Schema } from "effect";

import { Resend } from "resend";

import { EmailProviderError } from "#/errors";
import { EmailProvider } from "#/provider";

export const ResendEmail = {
  layer: Layer.effect(
    EmailProvider,
    Effect.gen(function* () {
      const apiKey = yield* Config.schema(Schema.Redacted(Schema.NonEmptyString), "RESEND_API_KEY");
      const client = new Resend(Redacted.value(apiKey));
      return EmailProvider.of({
        name: "resend",
        supportsIdempotency: true,
        send: Effect.fn("EmailProvider.resend.send")(function* (message) {
          const response = yield* Effect.tryPromise({
            try: (signal) =>
              client.emails.send(
                {
                  from: message.from,
                  to: [message.to],
                  subject: message.subject,
                  html: message.html,
                  text: message.text,
                  ...(message.replyTo === undefined ? {} : { replyTo: [message.replyTo] }),
                },
                { idempotencyKey: message.idempotencyKey, signal },
              ),
            catch: () => new EmailProviderError({ code: "UNKNOWN_OUTCOME", retryable: true }),
          });
          if (response.error !== null) {
            const status = response.error.statusCode ?? undefined;
            if (response.error.name === "concurrent_idempotent_requests") {
              return yield* new EmailProviderError({ code: "UNAVAILABLE", retryable: true });
            }
            if (status === 401 || status === 403) {
              return yield* new EmailProviderError({
                code: "AUTHENTICATION_FAILED",
                retryable: false,
              });
            }
            if (status === 429) {
              return yield* new EmailProviderError({ code: "RATE_LIMITED", retryable: true });
            }
            const uncertain = status === undefined || status >= 500 || status === 408;
            return yield* new EmailProviderError({
              code: uncertain ? "UNKNOWN_OUTCOME" : "REJECTED",
              retryable: uncertain,
            });
          }
          const receipt = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ id: Schema.NonEmptyString }),
          )(response.data).pipe(
            Effect.mapError(
              () => new EmailProviderError({ code: "INVALID_RESPONSE", retryable: true }),
            ),
          );
          return { provider: "resend", messageId: receipt.id };
        }),
      });
    }),
  ),
} as const;
