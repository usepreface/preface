import { Schema } from "effect";

export const OrganizationSsoMode = Schema.Literals(["optional", "required"]);
export const SsoMaxAgeSeconds = Schema.Int.check(
  Schema.isBetween({ minimum: 300, maximum: 604800 }),
);
export const SsoReadinessBlocker = Schema.Literals([
  "NO_ACTIVE_APPROVED_CONNECTION",
  "OWNER_ACCOUNT_NOT_LINKED",
  "RECENT_EMAIL_REQUIRED",
  "RECENT_SSO_REQUIRED",
  "RECOVERY_CREDENTIAL_REQUIRED",
]);
