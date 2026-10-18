import { Schema } from "effect";

import { DisplayNameInput } from "#/common/display-name";
import { AuthenticationReturnPath } from "#/common/identity";
import { SecretTokenFromString } from "#/common/secret-token";
import { VerificationCodeFromString } from "#/common/verification-code";
import { VerificationId } from "#/identifiers/auth";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";
import { InvitationTokenInput } from "#/input/organization/invitation";

export const InvitationAuthenticationInput = Schema.Struct({
  ...InvitationTokenInput.fields,
  connectionId: IdentityConnectionId,
  displayName: DisplayNameInput,
  returnPath: Schema.optionalKey(AuthenticationReturnPath),
});
export type InvitationAuthenticationInput = typeof InvitationAuthenticationInput.Type;
export const ExternalFlowInput = Schema.Struct({
  flowId: AuthFlowId,
  browserToken: SecretTokenFromString,
});
export type ExternalFlowInput = typeof ExternalFlowInput.Type;
export const VerifyExternalEmailInput = Schema.Struct({
  ...ExternalFlowInput.fields,
  challengeId: VerificationId,
  code: VerificationCodeFromString,
});
export type VerifyExternalEmailInput = typeof VerifyExternalEmailInput.Type;
