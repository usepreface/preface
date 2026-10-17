import { DateTime, Effect } from "effect";

import { EmailError } from "#/errors";
import type { EmailRenderer } from "#/renderer";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;");

export const renderInvitationEmail: EmailRenderer["Service"]["render"] = Effect.fn(
  "EmailRenderer.invitation",
)(function* (payload) {
  if (payload.type !== "organization-invitation")
    return yield* new EmailError({ code: "RENDER_FAILED" });
  const { organizationName, inviterName, roleName, invitationUrl, expiresAt } = payload.variables;
  const expiry = DateTime.formatIso(expiresAt);
  return {
    subject: "You're invited to an organization on Preface",
    text: `${inviterName} invited you to ${organizationName} with these roles: ${roleName}.\n\nOpen this link to review the invitation and verify your email:\n${invitationUrl}\n\nExpires at ${expiry}. This invitation does not grant access until accepted.\nIf you were not expecting this invitation, ignore it.`,
    html: `<p>${escapeHtml(inviterName)} invited you to <strong>${escapeHtml(organizationName)}</strong> with these roles: ${escapeHtml(roleName)}.</p><p><a href="${escapeHtml(invitationUrl)}">Review your invitation</a></p><p>Verify your email to accept. Expires at ${expiry}.</p><p>If you were not expecting this invitation, ignore it.</p>`,
  };
});
