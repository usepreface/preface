import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import {
  OrganizationAuthRecoveryTokenId,
  OrganizationId,
  OrganizationMemberId,
} from "#/identifiers/organization";

export const OrganizationAuthRecoveryToken = Schema.Struct({
  id: OrganizationAuthRecoveryTokenId,
  organizationId: OrganizationId,
  memberId: OrganizationMemberId,
  tokenHash: CredentialDigest,
  createdAt: Schema.DateTimeUtcFromDate,
  consumedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type OrganizationAuthRecoveryToken = typeof OrganizationAuthRecoveryToken.Type;
