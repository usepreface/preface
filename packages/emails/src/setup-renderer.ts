import { DateTime, Effect, Layer } from "effect";

import { EmailError } from "#/errors";
import { EmailRenderer } from "#/renderer";

// Minimal operational message until the React Email presentation is supplied.
export const SetupEmailRenderer = {
  layer: Layer.succeed(
    EmailRenderer,
    EmailRenderer.of({
      render: Effect.fn("EmailRenderer.setup")(function* (payload) {
        if (payload.type !== "instance-setup")
          return yield* new EmailError({ code: "RENDER_FAILED" });
        const { code, displayName, instanceName, expiresAt } = payload.variables;
        const expiry = DateTime.formatIso(expiresAt);
        return {
          subject: "Verify your email to set up Preface",
          text: `Hello ${displayName},\n\nEnter this code to finish setting up ${instanceName}:\n\n${code}\n\nThe code expires at ${expiry} and can be used once.\nIf you did not request this email, ignore it.`,
          // Only schema-validated digits and a generated ISO timestamp enter HTML.
          html: `<p>Enter this code to finish setting up Preface:</p><p><strong>${code}</strong></p><p>Expires at ${expiry}. This code can be used once.</p><p>If you did not request this email, ignore it.</p>`,
        };
      }),
    }),
  ),
} as const;
