import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { AuthenticationReturnPath, AuthFlowIntent, IdentityRevision } from "#/common/identity";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";
import { SessionId } from "#/identifiers/session";
import { UserId } from "#/identifiers/user";
export const CreateAuthFlow = Schema.Struct({
  id: AuthFlowId,
  identityConnectionId: IdentityConnectionId,
  connectionRevision: IdentityRevision,
  intent: AuthFlowIntent,
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
  pkceVerifierCiphertext: Schema.NullOr(Schema.NonEmptyString),
  createdAt: Schema.DateTimeUtcFromDate,
  claimedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type AuthFlow = typeof AuthFlow.Type;
