import { Effect } from "effect";

import { OrganizationError, type RolePermission } from "@usepreface/protocol";

// Custom roles cannot delegate permissions the acting member does not hold.
export const requireDelegablePermissions = Effect.fn(
  "OrganizationAccess.requireDelegablePermissions",
)(function* (actorPermissions: readonly RolePermission[], requested: readonly RolePermission[]) {
  if (!requested.every((permission) => actorPermissions.includes(permission)))
    return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
});
