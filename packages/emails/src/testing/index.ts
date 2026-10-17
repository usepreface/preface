import { Context, Effect, Layer, Ref } from "effect";

import type { EmailProviderError } from "#/errors";
import { EmailProvider, type ProviderMessage } from "#/provider";

export class TestEmails extends Context.Service<
  TestEmails,
  {
    readonly sent: Effect.Effect<ReadonlyArray<ProviderMessage>>;
    readonly clear: Effect.Effect<void>;
    readonly failNext: (error: EmailProviderError) => Effect.Effect<void>;
  }
>()("@usepreface/emails/testing/TestEmails") {
  static readonly layer = Layer.unwrap(
    Effect.gen(function* () {
      const messages = yield* Ref.make<ReadonlyArray<ProviderMessage>>([]);
      const failure = yield* Ref.make<EmailProviderError | undefined>(undefined);
      const test = TestEmails.of({
        sent: Ref.get(messages),
        clear: Effect.all([Ref.set(messages, []), Ref.set(failure, undefined)]).pipe(Effect.asVoid),
        failNext: (error) => Ref.set(failure, error),
      });
      const provider = EmailProvider.of({
        name: "resend",
        supportsIdempotency: true,
        send: Effect.fn("EmailProvider.test.send")(function* (message) {
          const next = yield* Ref.getAndSet(failure, undefined);
          if (next !== undefined) return yield* next;
          yield* Ref.update(messages, (sent) =>
            sent.some((previous) => previous.idempotencyKey === message.idempotencyKey)
              ? sent
              : [...sent, message],
          );
          return { provider: "resend", messageId: `test:${message.idempotencyKey}` };
        }),
      });
      return Layer.mergeAll(
        Layer.succeed(TestEmails, test),
        Layer.succeed(EmailProvider, provider),
      );
    }),
  );
}
