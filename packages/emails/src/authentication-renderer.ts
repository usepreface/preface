import { DateTime, Effect, Layer } from "effect";

import { renderInvitationEmail } from "#/invitation-renderer";
import { EmailRenderer } from "#/renderer";
import { renderSetupEmail } from "#/setup-renderer";

export const AuthenticationEmailRenderer = {
  layer: Layer.succeed(
    EmailRenderer,
    EmailRenderer.of({
      render: Effect.fn("EmailRenderer.authentication")(function* (payload) {
        if (payload.type === "organization-invitation")
          return yield* renderInvitationEmail(payload);
        if (payload.type === "instance-setup") return yield* renderSetupEmail(payload);
        const invitation = payload.type === "invitation-verification";

        const { code, magicLinkUrl, expiresAt } = payload.variables;
        const expiry = DateTime.formatIso(expiresAt);
        // The workflow builds this trusted URL; escape the HTML attribute separately from its text form.
        const href = magicLinkUrl
          ?.replaceAll("&", "&amp;")
          .replaceAll('"', "&quot;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
        return {
          subject: invitation
            ? "Verify your email to accept your Preface invitation"
            : "Your Preface sign-in code",
          text: `${invitation ? "Verify your invited email in the browser where you requested this code:" : "Enter this code in the browser where you requested sign-in:"}\n\n${code}\n\n${magicLinkUrl === undefined ? "" : `Or open this link in that browser:\n${magicLinkUrl}\n\n`}Expires at ${expiry}. The code and link can be used once.\nIf you did not request this email, ignore it.`,
          html: `<p>${invitation ? "Verify your invited email in the browser where you requested this code:" : "Enter this code in the browser where you requested sign-in:"}</p><p><strong>${code}</strong></p>${href === undefined ? "" : `<p><a href="${href}">${invitation ? "Verify invited email" : "Continue signing in"}</a></p>`}<p>Expires at ${expiry}. The code and link can be used once.</p><p>If you did not request this email, ignore it.</p>`,
        };
      }),
    }),
  ),
} as const;
