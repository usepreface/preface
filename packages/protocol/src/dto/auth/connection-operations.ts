import { Schema } from "effect";

import { IdentityRevision } from "#/common/identity";
import { IdentityConnectionId, IdentityConnectionKeyId } from "#/identifiers/identity";
export const PublicConnectionKey = Schema.Struct({
  id: IdentityConnectionKeyId,
  connectionRevision: IdentityRevision,
  certificate: Schema.String,
  status: Schema.Literals(["pending", "activated", "retiring", "retired"]),
  expiresAt: Schema.DateTimeUtcFromString,
  createdAt: Schema.DateTimeUtcFromString,
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  retiredAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export const ConnectionKeyList = Schema.Struct({ keys: Schema.Array(PublicConnectionKey) });
export const CertificateHealth = Schema.Struct({
  role: Schema.Literals(["sp", "idp"]),
  fingerprint: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  status: Schema.Literals(["valid", "expiring", "expired", "not_yet_valid", "invalid"]),
});
export type CertificateHealth = typeof CertificateHealth.Type;
export const ConnectionHealth = Schema.Struct({
  id: IdentityConnectionId,
  provider: Schema.Literals(["oidc", "saml"]),
  status: Schema.Literals(["draft", "tested", "active", "disabled"]),
  revision: IdentityRevision,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  approved: Schema.Boolean,
  domainProofAvailable: Schema.Boolean,
  certificates: Schema.Array(CertificateHealth),
});
