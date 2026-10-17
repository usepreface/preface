import { Context, type Effect } from "effect";

import type { EmailProviderName } from "@usepreface/protocol/model";

import type { EmailProviderError } from "#/errors";
import type { RenderedEmail } from "#/renderer";

export interface ProviderMessage extends RenderedEmail {
  readonly to: string;
  readonly from: string;
  readonly replyTo?: string;
  readonly idempotencyKey: string;
}

export interface EmailReceipt {
  readonly provider: EmailProviderName;
  readonly messageId: string;
}

export class EmailProvider extends Context.Service<
  EmailProvider,
  {
    readonly name: EmailProviderName;
    readonly supportsIdempotency: boolean;
    readonly send: (message: ProviderMessage) => Effect.Effect<EmailReceipt, EmailProviderError>;
  }
>()("@usepreface/emails/EmailProvider") {}
