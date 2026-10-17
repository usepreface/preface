import { Schema } from "effect";

import { DisplayName as InstanceDisplayName } from "#/common/display-name";
import { DisplayName as UserDisplayName } from "#/common/display-name";
import { EmailAddress as UserEmail } from "#/common/email";
import { VerificationCode } from "#/common/verification-code";

const EmailLink = Schema.String.check(Schema.isPattern(/^https?:\/\/[^\s]+$/));

export const InstanceSetupEmailVariables = Schema.Struct({
  instanceName: InstanceDisplayName,
  displayName: UserDisplayName,
  code: VerificationCode,
  magicLinkUrl: Schema.optionalKey(EmailLink),
  expiresAt: Schema.DateTimeUtcFromString,
});
export type InstanceSetupEmailVariables = typeof InstanceSetupEmailVariables.Type;

export const SignInEmailVariables = Schema.Struct({
  instanceName: InstanceDisplayName,
  code: VerificationCode,
  magicLinkUrl: Schema.optionalKey(EmailLink),
  expiresAt: Schema.DateTimeUtcFromString,
});
export type SignInEmailVariables = typeof SignInEmailVariables.Type;

export const OrganizationInvitationEmailVariables = Schema.Struct({
  instanceName: InstanceDisplayName,
  organizationName: Schema.NonEmptyString,
  inviterName: UserDisplayName,
  roleName: Schema.NonEmptyString,
  invitationUrl: EmailLink,
  expiresAt: Schema.DateTimeUtcFromString,
});
export type OrganizationInvitationEmailVariables = typeof OrganizationInvitationEmailVariables.Type;

// Storage contracts only: rendering and subject selection belong to the email package.
export const EmailPayload = Schema.Union([
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
