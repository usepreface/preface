import { Schema } from "effect";

import { IdentityRevision } from "#/common/identity";
import { IdentityConnectionKeyId, IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";

export const IdentityConnectionKey = Schema.Struct({
  id: IdentityConnectionKeyId,
  identityConnectionId: IdentityConnectionId,
  organizationId: OrganizationId,
  connectionRevision: IdentityRevision,
  certificate: Schema.NonEmptyString,
  privateKeyCiphertext: Schema.NullOr(Schema.NonEmptyString),
  status: Schema.Literals(["pending", "activated", "retiring", "retired"]),
  expiresAt: Schema.DateTimeUtcFromDate,
  createdAt: Schema.DateTimeUtcFromDate,
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  retiredAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type IdentityConnectionKey = typeof IdentityConnectionKey.Type;
