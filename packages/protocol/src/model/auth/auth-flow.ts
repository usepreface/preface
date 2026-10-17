import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { AuthenticationReturnPath, AuthFlowIntent, IdentityRevision } from "#/common/identity";
import { IdentityProvider } from "#/common/oidc";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";
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
  stateHash: CredentialDigest,
  browserBindingHash: CredentialDigest,
  nonceHash: CredentialDigest,
  pkceVerifierCiphertext: Schema.NonEmptyString,
  returnPath: AuthenticationReturnPath,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateAuthFlow = typeof CreateAuthFlow.Type;
export const AuthFlow = Schema.Struct({
  ...CreateAuthFlow.fields,
  provider: IdentityProvider,
  requestedMaxAgeSeconds: Schema.NullOr(Schema.Natural),
  pkceVerifierCiphertext: Schema.NullOr(Schema.NonEmptyString),
  createdAt: Schema.DateTimeUtcFromDate,
  claimedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type AuthFlow = typeof AuthFlow.Type;
