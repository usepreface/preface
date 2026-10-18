import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { DisplayName } from "#/common/display-name";
import { AuthenticationReturnPath, AuthFlowIntent, IdentityRevision } from "#/common/identity";
import { IdentityProvider } from "#/common/oidc";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationInvitationId } from "#/identifiers/organization";
import { OrganizationId } from "#/identifiers/organization";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";
export const CreateAuthFlow = Schema.Struct({
  id: AuthFlowId,
  provider: Schema.optionalKey(IdentityProvider),
  identityConnectionId: IdentityConnectionId,
  connectionRevision: IdentityRevision,
  intent: AuthFlowIntent,
  requestedMaxAgeSeconds: Schema.optionalKey(Schema.NullOr(Schema.Natural)),
  initiatingSessionId: Schema.NullOr(SessionId),
  expectedUserId: Schema.NullOr(UserId),
  targetOrganizationId: Schema.NullOr(OrganizationId),
  invitationId: Schema.optionalKey(Schema.NullOr(OrganizationInvitationId)),
  invitationRevision: Schema.optionalKey(Schema.NullOr(IdentityRevision)),
  displayName: Schema.optionalKey(Schema.NullOr(DisplayName)),
  stateHash: CredentialDigest,
  browserBindingHash: CredentialDigest,
  nonceHash: Schema.NullOr(CredentialDigest),
  samlRequestId: Schema.optionalKey(Schema.NullOr(Schema.NonEmptyString)),
  pkceVerifierCiphertext: Schema.NullOr(Schema.NonEmptyString),
  returnPath: AuthenticationReturnPath,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateAuthFlow = typeof CreateAuthFlow.Type;
export const AuthFlow = Schema.Struct({
  ...CreateAuthFlow.fields,
  provider: IdentityProvider,
  requestedMaxAgeSeconds: Schema.NullOr(Schema.Natural),
  pkceVerifierCiphertext: Schema.NullOr(Schema.NonEmptyString),
  samlRequestId: Schema.NullOr(Schema.NonEmptyString),
  verifiedIdentityCiphertext: Schema.NullOr(Schema.NonEmptyString),
  verifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  emailVerifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  invitationId: Schema.NullOr(OrganizationInvitationId),
  invitationRevision: Schema.NullOr(IdentityRevision),
  displayName: Schema.NullOr(DisplayName),
  createdAt: Schema.DateTimeUtcFromDate,
  claimedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type AuthFlow = typeof AuthFlow.Type;
