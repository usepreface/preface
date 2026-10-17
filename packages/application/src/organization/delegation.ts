import { Effect } from "effect";

import { OrganizationError, type OrganizationPermission } from "@usepreface/protocol";

// Ownership and archiving stay explicit owner operations, even for custom role administrators.
export const requireDelegablePermissions = Effect.fn(
  "OrganizationAccess.requireDelegablePermissions",
)(function* (
  actorPermissions: readonly OrganizationPermission[],
  requested: readonly OrganizationPermission[],
) {
  if (
    requested.includes("organization.archive") ||
    !requested.every((permission) => actorPermissions.includes(permission))
  )
    return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
});
