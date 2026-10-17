import { Effect, Layer } from "effect";

import { EmailProvider } from "#/provider";

export const DevelopmentEmail = {
  layer: Layer.succeed(
    EmailProvider,
    EmailProvider.of({
      name: "development",
      supportsIdempotency: false,
      send: Effect.fn("EmailProvider.development.send")(function* (message) {
        // Explicit development output includes login codes/links by design.
        yield* Effect.logInfo("email.development").pipe(
          Effect.annotateLogs({
            to: message.to,
            from: message.from,
            subject: message.subject,
            text: message.text,
          }),
        );
        return { provider: "development", messageId: `development:${message.idempotencyKey}` };
      }),
    }),
  ),
} as const;
