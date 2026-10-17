import { Context, type Effect } from "effect";

import type { EmailPayload } from "@usepreface/protocol/model";

import type { EmailError } from "#/errors";

export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

// A required capability, deliberately without placeholder templates or a default implementation.
export class EmailRenderer extends Context.Service<
  EmailRenderer,
  {
    readonly render: (payload: EmailPayload) => Effect.Effect<RenderedEmail, EmailError>;
  }
>()("@usepreface/emails/EmailRenderer") {}
