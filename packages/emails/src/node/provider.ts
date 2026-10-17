import { Config, Effect, Layer } from "effect";

import { DevelopmentEmail } from "#/providers/development";
import { InboundEmail } from "#/providers/inbound";
import { ResendEmail } from "#/providers/resend";
import { SesEmail } from "#/providers/ses";
import { SmtpEmail } from "#/providers/smtp";

export const ConfiguredEmailProvider = Layer.unwrap(
  Effect.gen(function* () {
    const provider = yield* Config.Literals(
      ["development", "smtp", "resend", "ses", "inbound"],
      "EMAIL_PROVIDER",
    );
    switch (provider) {
      case "development": {
        // A missing NODE_ENV is not permission to expose credentials in server logs.
        yield* Config.Literal("development", "NODE_ENV");
        return DevelopmentEmail.layer;
      }
      case "smtp":
        return SmtpEmail.layer;
      case "ses":
        return SesEmail.layer;
      case "resend":
        return ResendEmail.layer;
      case "inbound":
        return InboundEmail.layer;
    }
  }),
);
