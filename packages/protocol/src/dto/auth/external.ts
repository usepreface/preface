import { Schema } from "effect";

import { AuthenticationReturnPath } from "#/common/identity";
import { IdentityProvider } from "#/common/oidc";
import { VerificationCode } from "#/common/verification-code";
import { InvitationTokenRequest } from "#/dto/organization/invitation";
import { VerificationId } from "#/identifiers/auth";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";

export const InvitationAuthenticationRequest = Schema.Struct({
  ...InvitationTokenRequest.fields,
  connectionId: IdentityConnectionId,
  displayName: Schema.String,
  returnPath: Schema.optionalKey(AuthenticationReturnPath),
});
export const ExternalFlowStatus = Schema.Struct({
  flowId: AuthFlowId,
  provider: IdentityProvider,
  nextAction: Schema.Literals(["verify_email", "continue"]),
  maskedEmail: Schema.String,
  expiresAt: Schema.DateTimeUtcFromString,
});
export const VerifyExternalEmailRequest = Schema.Struct({
  challengeId: VerificationId,
  code: VerificationCode.annotate({ writeOnly: true }),
});
export const ExternalCompletion = Schema.Struct({
  nextAction: Schema.Literals(["continue", "authenticate_with_sso", "verify_email"]),
  redirectTo: Schema.String,
});
