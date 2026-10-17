import type { IdentityConnectionId } from "@usepreface/protocol";
import type { OrganizationAuthPolicy } from "@usepreface/protocol/model";

export const organizationAuthPolicyView = (
  policy: OrganizationAuthPolicy,
  oidcConnectionIds: readonly IdentityConnectionId[],
) => ({
  revision: policy.revision,
  allowedMethods: policy.allowedMethods,
  ssoMode: policy.ssoMode,
  ssoMaxAgeSeconds: policy.ssoMaxAgeSeconds,
  oidcConnectionIds,
  updatedAt: policy.updatedAt,
});
