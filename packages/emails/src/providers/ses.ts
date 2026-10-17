import { Config, Effect, Layer } from "effect";

import { SendEmailCommand, SESv2Client, SESv2ServiceException } from "@aws-sdk/client-sesv2";

import { EmailProviderError } from "#/errors";
import { EmailProvider } from "#/provider";

export const SesEmail = {
  layer: Layer.effect(
    EmailProvider,
    Effect.gen(function* () {
      const region = yield* Config.NonEmptyString("AWS_REGION");
      const client = yield* Effect.acquireRelease(
        Effect.sync(() => new SESv2Client({ region, maxAttempts: 1 })),
        (acquired) => Effect.sync(() => acquired.destroy()),
      );

      return EmailProvider.of({
        name: "ses",
        supportsIdempotency: false,
        send: Effect.fn("EmailProvider.ses.send")(function* (message) {
          const response = yield* Effect.tryPromise({
            try: (signal) =>
              client.send(
                new SendEmailCommand({
                  FromEmailAddress: message.from,
                  Destination: { ToAddresses: [message.to] },
                  ...(message.replyTo === undefined ? {} : { ReplyToAddresses: [message.replyTo] }),
                  Content: {
                    Simple: {
                      Subject: { Data: message.subject, Charset: "UTF-8" },
                      Body: {
                        Html: { Data: message.html, Charset: "UTF-8" },
                        Text: { Data: message.text, Charset: "UTF-8" },
                      },
                    },
                  },
                }),
                { abortSignal: signal },
              ),
            catch: (cause) => {
              if (!(cause instanceof SESv2ServiceException))
                return new EmailProviderError({ code: "UNKNOWN_OUTCOME", retryable: false });
              const status = cause.$metadata.httpStatusCode;
              if (status === 429)
                return new EmailProviderError({ code: "RATE_LIMITED", retryable: true });
              if (status === 401 || status === 403)
                return new EmailProviderError({ code: "AUTHENTICATION_FAILED", retryable: false });
              return new EmailProviderError({
                code: status !== undefined && status < 500 ? "REJECTED" : "UNKNOWN_OUTCOME",
                retryable: false,
              });
            },
          });
          if (response.MessageId === undefined)
            return yield* new EmailProviderError({ code: "INVALID_RESPONSE", retryable: false });
          return { provider: "ses", messageId: response.MessageId };
        }),
      });
    }),
  ),
} as const;
