import { Schema } from "effect";

import { IdentityRevision } from "#/common/identity";
import { OrganizationSsoMode, SsoMaxAgeSeconds } from "#/common/organization-authentication";
import { SecretTokenFromString } from "#/common/secret-token";
import { IdentityConnectionId } from "#/identifiers/identity";

export const UpdateOrganizationAuthPolicyInput = Schema.Struct({
  expectedRevision: IdentityRevision,
  googleEnabled: Schema.optionalKey(Schema.Boolean),
  oidcConnectionIds: Schema.optionalKey(
    Schema.Array(IdentityConnectionId).check(Schema.isMaxLength(20)),
  ),
  ssoMode: Schema.optionalKey(OrganizationSsoMode),
  ssoMaxAgeSeconds: Schema.optionalKey(SsoMaxAgeSeconds),
  recoveryCredential: Schema.optionalKey(SecretTokenFromString),
});
export type UpdateOrganizationAuthPolicyInput = typeof UpdateOrganizationAuthPolicyInput.Type;
export const RecoverOrganizationAuthInput = Schema.Struct({
  expectedRevision: IdentityRevision,
  recoveryCredential: SecretTokenFromString,
});
export type RecoverOrganizationAuthInput = typeof RecoverOrganizationAuthInput.Type;
