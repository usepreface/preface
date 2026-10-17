import { Schema } from "effect";

import { ConnectionStatus, IdentityRevision } from "#/common/identity";
import { SamlConfiguration, SamlIdentityProviderConfiguration } from "#/common/saml";
import { PublicOidcConnection } from "#/dto/auth/oidc";
import { AuthFlowId, IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";

export const PublicSamlConnection = Schema.Struct({
  id: IdentityConnectionId,
  organizationId: OrganizationId,
  provider: Schema.Literal("saml"),
  name: Schema.String,
  status: ConnectionStatus,
  revision: IdentityRevision,
  configuration: SamlConfiguration,
  metadataUrl: Schema.String,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  activatedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  createdAt: Schema.DateTimeUtcFromString,
  updatedAt: Schema.DateTimeUtcFromString,
});
export const PublicOrganizationIdentityConnection = Schema.Union([
  PublicOidcConnection,
  PublicSamlConnection,
]);
export const OrganizationIdentityConnectionList = Schema.Struct({
  connections: Schema.Array(PublicOrganizationIdentityConnection),
});
export const CreateSamlConnectionRequest = Schema.Struct({ name: Schema.String });
export const UpdateSamlConnectionRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  name: Schema.optionalKey(Schema.String),
  idp: Schema.optionalKey(SamlIdentityProviderConfiguration),
});
export const SamlCallbackRequest = Schema.Struct({
  SAMLResponse: Schema.String,
  RelayState: Schema.String,
});
export const SamlCompletionQuery = Schema.Struct({ flowId: AuthFlowId });
