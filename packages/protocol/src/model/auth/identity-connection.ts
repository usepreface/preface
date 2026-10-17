import { Schema } from "effect";

import { ConnectionStatus, GoogleConfiguration, IdentityRevision } from "#/common/identity";
import { OidcConfiguration } from "#/common/oidc";
import { IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";

const fields = {
  id: IdentityConnectionId,
  name: Schema.NonEmptyString,
  status: ConnectionStatus,
  revision: IdentityRevision,
  secretsCiphertext: Schema.NonEmptyString,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
};
export const GoogleConnection = Schema.Struct({
  ...fields,
  installationId: Schema.Literal(1),
  organizationId: Schema.optionalKey(Schema.Null),
  provider: Schema.Literal("google"),
  configuration: GoogleConfiguration,
});
export type GoogleConnection = typeof GoogleConnection.Type;
export const OidcConnection = Schema.Struct({
  ...fields,
  installationId: Schema.Null,
  organizationId: OrganizationId,
  provider: Schema.Literal("oidc"),
  configuration: OidcConfiguration,
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type OidcConnection = typeof OidcConnection.Type;
export const IdentityConnection = Schema.Union([GoogleConnection, OidcConnection]);
export type IdentityConnection = typeof IdentityConnection.Type;
