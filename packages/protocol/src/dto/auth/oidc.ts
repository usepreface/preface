import { Schema } from "effect";

import { ConnectionStatus, IdentityRevision } from "#/common/identity";
import {
  OidcClientAuthentication,
  OidcClientId,
  OidcConfiguration,
  OidcIssuer,
} from "#/common/oidc";
import { IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";

const secret = Schema.String.annotate({ writeOnly: true });
export const PublicOidcConnection = Schema.Struct({
  id: IdentityConnectionId,
  organizationId: OrganizationId,
  provider: Schema.Literal("oidc"),
  name: Schema.String,
  status: ConnectionStatus,
  revision: IdentityRevision,
  configuration: OidcConfiguration,
  hasClientSecret: Schema.Boolean,
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  callbackUrl: Schema.String,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export const OidcConnectionList = Schema.Struct({
  connections: Schema.Array(PublicOidcConnection),
});
export const CreateOidcConnectionRequest = Schema.Struct({
  name: Schema.String,
  issuer: OidcIssuer,
  clientId: OidcClientId,
  clientSecret: secret,
  clientAuthenticationMethod: OidcClientAuthentication,
});
export const UpdateOidcConnectionRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  name: Schema.optionalKey(Schema.String),
  issuer: Schema.optionalKey(OidcIssuer),
  clientId: Schema.optionalKey(OidcClientId),
  clientSecret: Schema.optionalKey(secret),
  clientAuthenticationMethod: Schema.optionalKey(OidcClientAuthentication),
});
export const OrganizationOidcMethod = Schema.Struct({
  id: IdentityConnectionId,
  name: Schema.String,
  available: Schema.Boolean,
  linked: Schema.Boolean,
});
