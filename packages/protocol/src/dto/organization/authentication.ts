import { Schema } from "effect";

import { IdentityRevision } from "#/common/identity";
import {
  OrganizationSsoMode,
  SsoMaxAgeSeconds,
  SsoReadinessBlocker,
} from "#/common/organization-authentication";
import { IdentityConnectionId } from "#/identifiers/identity";
import { OrganizationAuthRecoveryTokenId, OrganizationMemberId } from "#/identifiers/organization";

export const UpdateOrganizationAuthPolicyRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  googleEnabled: Schema.optionalKey(Schema.Boolean),
  oidcConnectionIds: Schema.optionalKey(
    Schema.Array(IdentityConnectionId).check(Schema.isMaxLength(20)),
  ),
  samlConnectionIds: Schema.optionalKey(
    Schema.Array(IdentityConnectionId).check(Schema.isMaxLength(20)),
  ),
  ssoMode: Schema.optionalKey(OrganizationSsoMode),
  ssoMaxAgeSeconds: Schema.optionalKey(SsoMaxAgeSeconds),
  recoveryCredential: Schema.optionalKey(Schema.String.annotate({ writeOnly: true })),
});
export const RecoverOrganizationAuthRequest = Schema.Struct({
  expectedRevision: IdentityRevision,
  recoveryCredential: Schema.String.annotate({ writeOnly: true }),
});
export const OrganizationAuthRecoveryStatus = Schema.Struct({
  credential: Schema.NullOr(
    Schema.Struct({
      id: OrganizationAuthRecoveryTokenId,
      createdAt: Schema.DateTimeUtcFromString,
    }),
  ),
});
export const OrganizationAuthRecoveryIssued = Schema.Struct({
  id: OrganizationAuthRecoveryTokenId,
  createdAt: Schema.DateTimeUtcFromString,
  recoveryCredential: Schema.String,
});
export const OrganizationSsoReadiness = Schema.Struct({
  policyRevision: IdentityRevision,
  ready: Schema.Boolean,
  blockers: Schema.Array(SsoReadinessBlocker),
  connections: Schema.Array(
    Schema.Struct({ id: IdentityConnectionId, name: Schema.String, available: Schema.Boolean }),
  ),
  owners: Schema.Array(
    Schema.Struct({
      memberId: OrganizationMemberId,
      ssoLinked: Schema.Boolean,
      recoveryPrepared: Schema.Boolean,
    }),
  ),
});
