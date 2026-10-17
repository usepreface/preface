import { Config, Effect, Layer, Option, Predicate, Redacted } from "effect";

import { createTransport } from "nodemailer";

import { EmailProviderError } from "#/errors";
import { EmailProvider } from "#/provider";

export const SmtpEmail = {
  layer: Layer.effect(
    EmailProvider,
    Effect.gen(function* () {
      const config = yield* Config.all({
        host: Config.NonEmptyString("SMTP_HOST"),
        port: Config.Port("SMTP_PORT").pipe(Config.withDefault(587)),
        secure: Config.Boolean("SMTP_SECURE").pipe(Config.withDefault(false)),
        username: Config.option(Config.NonEmptyString("SMTP_USERNAME")),
        password: Config.option(Config.Redacted("SMTP_PASSWORD")),
      });
      const username = Option.getOrUndefined(config.username);
      const password = Option.getOrUndefined(config.password);
      if (username !== undefined && password === undefined) yield* Config.Redacted("SMTP_PASSWORD");
      if (password !== undefined && username === undefined)
        yield* Config.NonEmptyString("SMTP_USERNAME");

      return EmailProvider.of({
        name: "smtp",
        supportsIdempotency: false,
        send: Effect.fn("EmailProvider.smtp.send")((message) =>
          Effect.scoped(
            Effect.gen(function* () {
              const transport = yield* Effect.acquireRelease(
                Effect.sync(() =>
                  createTransport({
                    host: config.host,
                    port: config.port,
                    secure: config.secure,
                    requireTLS: !config.secure,
                    ...(username === undefined
                      ? {}
                      : {
                          auth: {
                            user: username,
                            pass: password === undefined ? undefined : Redacted.value(password),
                          },
                        }),
                    connectionTimeout: 8_000,
                    greetingTimeout: 8_000,
                    socketTimeout: 8_000,
                    disableFileAccess: true,
                    disableUrlAccess: true,
                  }),
                ),
                (acquired) => Effect.sync(() => acquired.close()),
              );

              const result = yield* Effect.tryPromise({
                try: () =>
                  transport.sendMail({
                    from: message.from,
                    to: message.to,
                    subject: message.subject,
                    html: message.html,
                    text: message.text,
                    ...(message.replyTo === undefined ? {} : { replyTo: message.replyTo }),
                  }),
                catch: (cause) => {
                  const status =
                    Predicate.isObject(cause) &&
                    "responseCode" in cause &&
                    Predicate.isNumber(cause.responseCode)
                      ? cause.responseCode
                      : undefined;
                  if (status === 535)
                    return new EmailProviderError({
                      code: "AUTHENTICATION_FAILED",
                      retryable: false,
                    });
                  if (status !== undefined && status >= 400 && status < 500)
                    return new EmailProviderError({ code: "UNAVAILABLE", retryable: true });
                  return new EmailProviderError({
                    code: status !== undefined && status >= 500 ? "REJECTED" : "UNKNOWN_OUTCOME",
                    retryable: false,
                  });
                },
              });
              if (result.accepted.length === 0)
                return yield* new EmailProviderError({ code: "REJECTED", retryable: false });
              return { provider: "smtp", messageId: result.messageId };
            }),
          ),
        ),
      });
    }),
  ),
} as const;
