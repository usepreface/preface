import { DateTime, Effect, Layer } from "effect";

import { EmailRenderer } from "#/renderer";
import { escapeHtml } from "#/rendering/html";
import { renderInvitationEmail } from "#/rendering/invitation";
import { renderOrganizationSecurityEmail } from "#/rendering/organization-security";
import { renderSetupEmail } from "#/rendering/setup";

export const AuthenticationEmailRenderer = {
  layer: Layer.succeed(
    EmailRenderer,
    EmailRenderer.of({
      render: Effect.fn("EmailRenderer.authentication")(function* (payload) {
        if (payload.type === "organization-security")
          return yield* renderOrganizationSecurityEmail(payload);
        if (payload.type === "organization-invitation")
          return yield* renderInvitationEmail(payload);
        if (payload.type === "instance-setup") return yield* renderSetupEmail(payload);

        const reauthentication = payload.type === "email-reauthentication";
        const invitation = payload.type === "invitation-verification";

        const heading = invitation
          ? "Verify your invited email in the browser where you requested this code:"
          : reauthentication
            ? "Confirm your account action in the browser where you requested this code:"
            : "Enter this code in the browser where you requested sign-in:";
        const action = invitation
          ? "Verify invited email"
          : reauthentication
            ? "Confirm account action"
            : "Continue signing in";

        const { code, magicLinkUrl, expiresAt } = payload.variables;
        const expiry = DateTime.formatIso(expiresAt);
        // Application workflows supply trusted URLs; escaping only protects the HTML attribute.
        const href = magicLinkUrl === undefined ? undefined : escapeHtml(magicLinkUrl);

        return {
          subject: reauthentication
            ? "Confirm your Preface account action"
            : invitation
              ? "Verify your email to accept your Preface invitation"
              : "Your Preface sign-in code",
          text: `${heading}\n\n${code}\n\n${magicLinkUrl === undefined ? "" : `Or open this link in that browser:\n${magicLinkUrl}\n\n`}Expires at ${expiry}. The code and link can be used once.\nIf you did not request this email, ignore it.`,
          html: `<p>${heading}</p><p><strong>${code}</strong></p>${href === undefined ? "" : `<p><a href="${href}">${action}</a></p>`}<p>Expires at ${expiry}. The code and link can be used once.</p><p>If you did not request this email, ignore it.</p>`,
        };
      }),
    }),
  ),
} as const;
