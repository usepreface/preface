import { Config, Context, Effect, Layer, Option, Schema } from "effect";

const HeaderValue = Schema.String.check(Schema.isMinLength(1), Schema.isPattern(/^[^\r\n]+$/));

export class EmailSender extends Context.Service<
  EmailSender,
  {
    readonly from: string;
    readonly replyTo: string | undefined;
  }
>()("@usepreface/emails/EmailSender") {
  static readonly layer = Layer.effect(
    EmailSender,
    Config.all({
      from: Config.schema(HeaderValue, "EMAIL_FROM"),
      replyTo: Config.option(Config.schema(HeaderValue, "EMAIL_REPLY_TO")),
    }).pipe(
      Effect.map(({ from, replyTo }) =>
        EmailSender.of({ from, replyTo: Option.getOrUndefined(replyTo) }),
      ),
    ),
  );
}
