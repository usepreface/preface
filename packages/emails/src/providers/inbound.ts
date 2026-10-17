import { Config, Effect, Layer, Redacted, Schema } from "effect";

import { APIError, Inbound } from "inboundemail";

import { EmailProviderError } from "#/errors";
import { EmailProvider } from "#/provider";

export const InboundEmail = {
  layer: Layer.effect(
    EmailProvider,
    Effect.gen(function* () {
      const apiKey = yield* Config.schema(
        Schema.Redacted(Schema.NonEmptyString),
        "INBOUND_API_KEY",
      );
      const client = new Inbound({
        apiKey: Redacted.value(apiKey),
        maxRetries: 0,
        timeout: 10_000,
        logLevel: "off",
      });
      return EmailProvider.of({
        name: "inbound",
        supportsIdempotency: false,
        send: Effect.fn("EmailProvider.inbound.send")(function* (message) {
          const response = yield* Effect.tryPromise({
            try: (signal) =>
              client.emails.send(
                {
                  from: message.from,
                  to: [message.to],
                  subject: message.subject,
                  html: message.html,
                  text: message.text,
                  ...(message.replyTo === undefined ? {} : { reply_to: [message.replyTo] }),
                },
                { signal, headers: { "Idempotency-Key": message.idempotencyKey } },
              ),
            catch: (cause) => {
              const status = cause instanceof APIError ? cause.status : undefined;
              if (status === 401 || status === 403) {
                return new EmailProviderError({ code: "AUTHENTICATION_FAILED", retryable: false });
              }
              if (status === 429) {
                return new EmailProviderError({ code: "RATE_LIMITED", retryable: true });
              }
              const uncertain = status === undefined || status >= 500 || status === 408;
              return new EmailProviderError({
                code: uncertain ? "UNKNOWN_OUTCOME" : "REJECTED",
                retryable: false,
              });
            },
          });
          const receipt = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ id: Schema.NonEmptyString }),
          )(response).pipe(
            Effect.mapError(
              () => new EmailProviderError({ code: "INVALID_RESPONSE", retryable: false }),
            ),
          );
          return { provider: "inbound", messageId: receipt.id };
        }),
      });
    }),
  ),
} as const;
