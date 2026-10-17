import { Effect } from "effect";

import { OrganizationError, type RolePermission } from "@usepreface/protocol";

// Ownership and archiving stay explicit owner operations, even for custom role administrators.
export const requireDelegablePermissions = Effect.fn(
  "OrganizationAccess.requireDelegablePermissions",
)(function* (actorPermissions: readonly RolePermission[], requested: readonly RolePermission[]) {
  if (
    requested.includes("organization.archive") ||
    !requested.every((permission) => actorPermissions.includes(permission))
  )
    return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
});
