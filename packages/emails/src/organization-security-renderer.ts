import { DateTime, Effect } from "effect";

import type { EmailPayload } from "@usepreface/protocol/model";

const descriptions = {
  "sso-certificate-expiring":
    "An SSO signing certificate expires within 30 days or has expired. Review the connection settings and coordinate a tested certificate rollover with your identity provider.",
  "sso-required": "SSO is now required to access your organization.",
  "sso-optional": "SSO is now optional for your organization.",
  "sso-policy-updated": "Your organization's authentication policy changed.",
  "sso-recovered":
    "An organization owner used an offline recovery credential. SSO is now optional. The credential has been consumed.",
  "recovery-rotated": "An organization owner created or rotated their offline recovery credential.",
  "recovery-revoked": "An organization owner revoked their offline recovery credential.",
} as const;

export const renderOrganizationSecurityEmail = Effect.fn("EmailRenderer.organizationSecurity")(
  function* (payload: Extract<EmailPayload, { readonly type: "organization-security" }>) {
    yield* Effect.void;
    const { organizationName, action, occurredAt } = payload.variables;
    const description = descriptions[action];
    const time = DateTime.formatIso(occurredAt);
    const certificate =
      payload.variables.connectionName === undefined
        ? ""
        : `Connection: ${payload.variables.connectionName}. Certificate expires: ${payload.variables.certificateExpiresAt === undefined ? "unknown" : DateTime.formatIso(payload.variables.certificateExpiresAt)}.`;
    const escapedCertificate = certificate
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
    const escapedName = organizationName
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
    return {
      subject: "Preface organization security change",
      text: `${organizationName}\n\n${description}\n\n${certificate}\n\nTime: ${time}\nIf this was unexpected, contact another organization owner and review your organization's authentication settings.`,
      html: `<p><strong>${escapedName}</strong></p><p>${description}</p><p>${escapedCertificate}</p><p>Time: ${time}</p><p>If this was unexpected, contact another organization owner and review your organization's authentication settings.</p>`,
    };
  },
);
