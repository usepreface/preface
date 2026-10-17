import { Schema } from "effect";

import {
  ConnectionStatus,
  GoogleConfiguration,
  IdentityRevision,
  AuthenticationReturnPath,
} from "#/common/identity";
import { OrganizationOidcMethod } from "#/dto/auth/oidc";
import { IdentityConnectionId, AccountId } from "#/identifiers/identity";
import { OrganizationId } from "#/identifiers/organization";
export const PublicGoogleConnection = Schema.Struct({
  id: Schema.NullOr(IdentityConnectionId),
  name: Schema.String,
  status: Schema.NullOr(ConnectionStatus),
  revision: Schema.Natural,
  configuration: Schema.NullOr(GoogleConfiguration),
  hasClientSecret: Schema.Boolean,
  callbackUrl: Schema.String,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export const SaveGoogleConnectionRequest = Schema.Struct({
  expectedRevision: Schema.Natural,
  clientId: Schema.String,
  clientSecret: Schema.optionalKey(Schema.String.annotate({ writeOnly: true })),
  name: Schema.optionalKey(Schema.String),
});
export const IdentityRevisionRequest = Schema.Struct({ expectedRevision: IdentityRevision });
export const GoogleStartRequest = Schema.Struct({
  returnPath: Schema.optionalKey(AuthenticationReturnPath),
});
export const GoogleStartResult = Schema.Struct({
  authorizationUrl: Schema.String,
  expiresAt: Schema.DateTimeUtcFromString,
});
export const GoogleCallbackQuery = Schema.Struct({
  state: Schema.String,
  code: Schema.optionalKey(Schema.String),
  error: Schema.optionalKey(Schema.String),
});
export const PublicAccount = Schema.Struct({
  id: AccountId,
  provider: Schema.Literals(["google", "oidc"]),
  connectionId: Schema.optionalKey(IdentityConnectionId),
  organizationId: Schema.optionalKey(Schema.NullOr(OrganizationId)),
  providerEmail: Schema.NullOr(Schema.String),
  providerEmailVerified: Schema.NullOr(Schema.Boolean),
  connectionAvailable: Schema.Boolean,
  linkedAt: Schema.DateTimeUtcFromString,
  lastUsedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
  unlinkedAt: Schema.NullOr(Schema.DateTimeUtcFromString),
});
export const AccountList = Schema.Struct({ accounts: Schema.Array(PublicAccount) });
export const AuthenticationMethods = Schema.Struct({
  email: Schema.Literal(true),
  google: Schema.Boolean,
});
export const OrganizationAuthenticationMethods = Schema.Struct({
  revision: IdentityRevision,
  googleEnabled: Schema.Boolean,
  googleAvailable: Schema.Boolean,
  googleEffective: Schema.Boolean,
  oidc: Schema.Array(OrganizationOidcMethod),
  email: Schema.Literal(true),
});
export const UpdateGooglePolicyRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  googleEnabled: Schema.optionalKey(Schema.Boolean),
  oidcConnectionIds: Schema.optionalKey(
    Schema.Array(IdentityConnectionId).check(Schema.isMaxLength(20)),
  ),
});
