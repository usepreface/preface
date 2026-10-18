import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { DomainName } from "#/common/domain";
import { OrganizationDomainId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";
import { UserId } from "#/identifiers/user";

export const OrganizationDomain = Schema.Struct({
  id: OrganizationDomainId,
  organizationId: OrganizationId,
  domain: DomainName,
  revision: Schema.Int.check(Schema.isGreaterThan(0)),
  verificationMethod: Schema.NullOr(Schema.Literals(["dns", "operator"])),
  challengeHash: Schema.NullOr(CredentialDigest),
  challengeExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  verifiedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  verifiedUntil: Schema.NullOr(Schema.DateTimeUtcFromDate),
  approvedByUserId: Schema.NullOr(UserId),
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type OrganizationDomain = typeof OrganizationDomain.Type;
