import { Schema } from "effect";

import { DisplayNameInput } from "#/common/display-name";
import { EmailAddressInput } from "#/common/email";
import { InvitationRoleIds, InvitationTeams } from "#/common/invitation";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCodeFromString } from "#/common/verification-code";
import { VerificationId } from "#/identifiers/auth";
import { OrganizationInvitationId } from "#/identifiers/organization";

export const CreateInvitationInput = Schema.Struct({
  email: EmailAddressInput,
  roleIds: InvitationRoleIds,
  teams: Schema.optionalKey(InvitationTeams),
});
export type CreateInvitationInput = typeof CreateInvitationInput.Type;
export const InvitationTokenInput = Schema.Struct({
  invitationId: OrganizationInvitationId,
  token: SecretTokenFromString,
});
export type InvitationTokenInput = typeof InvitationTokenInput.Type;
export const AcceptInvitationInput = Schema.Union([
  Schema.Struct({
    ...InvitationTokenInput.fields,
    challengeId: VerificationId,
    displayName: DisplayNameInput,
    browserToken: SecretTokenFromString,
    method: Schema.Literal("code"),
    code: VerificationCodeFromString,
  }),
  Schema.Struct({
    ...InvitationTokenInput.fields,
    challengeId: VerificationId,
    displayName: DisplayNameInput,
    browserToken: SecretTokenFromString,
    method: Schema.Literal("magic_link"),
    proofToken: SecretTokenFromString,
  }),
]);
export type AcceptInvitationInput = typeof AcceptInvitationInput.Type;
