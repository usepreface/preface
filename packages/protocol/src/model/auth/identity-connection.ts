import { Schema } from "effect";

import { ConnectionStatus, GoogleConfiguration, IdentityRevision } from "#/common/identity";
import { OidcConfiguration } from "#/common/oidc";
import { SamlConfiguration } from "#/common/saml";
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
  organizationId: OrganizationId,
  provider: Schema.Literal("google"),
  configuration: GoogleConfiguration,
});
export type GoogleConnection = typeof GoogleConnection.Type;
export const OidcConnection = Schema.Struct({
  ...fields,
  organizationId: OrganizationId,
  provider: Schema.Literal("oidc"),
  configuration: OidcConfiguration,
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type OidcConnection = typeof OidcConnection.Type;
export const SamlConnection = Schema.Struct({
  ...fields,
  organizationId: OrganizationId,
  provider: Schema.Literal("saml"),
  configuration: SamlConfiguration,
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});
export type SamlConnection = typeof SamlConnection.Type;
export const OrganizationIdentityConnection = Schema.Union([OidcConnection, SamlConnection]);
export type OrganizationIdentityConnection = typeof OrganizationIdentityConnection.Type;
export const IdentityConnection = Schema.Union([GoogleConnection, OidcConnection, SamlConnection]);
export type IdentityConnection = typeof IdentityConnection.Type;
