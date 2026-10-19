import { Schema } from "effect";

import { DisplayName } from "#/common/display-name";
import { EmailAddress as UserEmail } from "#/common/email";
import { VerificationCode } from "#/common/verification-code";

const EmailLink = Schema.String.check(Schema.isPattern(/^https?:\/\/[^\s]+$/));

export const InstanceSetupEmailVariables = Schema.Struct({
  organizationName: DisplayName,
  displayName: DisplayName,
  code: VerificationCode,
  magicLinkUrl: Schema.optionalKey(EmailLink),
  expiresAt: Schema.DateTimeUtcFromString,
});
export type InstanceSetupEmailVariables = typeof InstanceSetupEmailVariables.Type;

export const SignInEmailVariables = Schema.Struct({
  organizationName: DisplayName,
  code: VerificationCode,
  magicLinkUrl: Schema.optionalKey(EmailLink),
  expiresAt: Schema.DateTimeUtcFromString,
});
export type SignInEmailVariables = typeof SignInEmailVariables.Type;

export const OrganizationInvitationEmailVariables = Schema.Struct({
  organizationName: DisplayName,
  inviterName: DisplayName,
  roleName: Schema.NonEmptyString,
  invitationUrl: EmailLink,
  expiresAt: Schema.DateTimeUtcFromString,
});
export type OrganizationInvitationEmailVariables = typeof OrganizationInvitationEmailVariables.Type;

// Storage contracts only: rendering and subject selection belong to the email package.
export const OrganizationSecurityEmailVariables = Schema.Struct({
  connectionName: Schema.optionalKey(Schema.String),
  certificateExpiresAt: Schema.optionalKey(Schema.DateTimeUtcFromString),
  organizationName: Schema.NonEmptyString,
  action: Schema.Literals([
    "sso-certificate-expiring",
    "sso-required",
    "sso-optional",
    "sso-policy-updated",
    "sso-recovered",
    "recovery-rotated",
    "recovery-revoked",
  ]),
  occurredAt: Schema.DateTimeUtcFromString,
});
export type OrganizationSecurityEmailVariables = typeof OrganizationSecurityEmailVariables.Type;
export const EmailPayload = Schema.Union([
  Schema.Struct({
    type: Schema.Literal("identity-verification"),
    to: UserEmail,
    variables: SignInEmailVariables,
  }),
  Schema.Struct({
    type: Schema.Literal("organization-security"),
    to: UserEmail,
    variables: OrganizationSecurityEmailVariables,
  }),
  Schema.Struct({
    type: Schema.Literal("invitation-verification"),
    to: UserEmail,
    variables: SignInEmailVariables,
  }),
  Schema.Struct({
    type: Schema.Literal("instance-setup"),
    to: UserEmail,
    variables: InstanceSetupEmailVariables,
  }),
  Schema.Struct({
    type: Schema.Literal("sign-in"),
    to: UserEmail,
    variables: SignInEmailVariables,
  }),
  Schema.Struct({
    type: Schema.Literal("organization-invitation"),
    to: UserEmail,
    variables: OrganizationInvitationEmailVariables,
  }),
]);
export type EmailPayload = typeof EmailPayload.Type;
