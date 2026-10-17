import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { OrganizationRoleBinding } from "@usepreface/protocol/model";

export const makeBindingAudit = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.organization.recordBindingEvent")(function* (
    actor: SessionActor,
    binding: OrganizationRoleBinding,
    eventType: "organization.role_granted" | "organization.role_revoked",
  ) {
    yield* repository.audit.event.append({
      organizationId: binding.organizationId,
      actorKind: "user",
      actorUserId: actor.user.id,
      eventType,
      targetType: "organization_role_binding",
      targetId: binding.id,
      metadata: { memberId: binding.memberId, roleId: binding.roleId },
    });
  });
});
