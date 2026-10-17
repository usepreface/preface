import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import {
  OrganizationError,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";
import { makeBindingAudit } from "#/organization/binding-audit";

export const makeOrganizationOwnershipApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const recordBindingEvent = yield* makeBindingAudit;
  const grant = Effect.fn("Application.organization.ownership.grant")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, { lock: true });
        const target = yield* repository.organization.member.findById(organizationId, memberId);
        if (target === undefined) return yield* new OrganizationError({ code: "MEMBER_NOT_FOUND" });
        if (target.removedAt !== null || target.suspendedAt !== null)
          return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
        const role = yield* repository.organization.role.findByKey(organizationId, "owner");
        if (role === undefined)
          return yield* Effect.die(new Error("Organization has no owner role"));
        const result = yield* repository.organization.roleBinding.grant({
          organizationId,
          memberId,
          roleId: role.id,
          grantedByMemberId: resolved.member.id,
        });
        // A recovery owner must have an enabled identity and a usable email login path, not a live session.
        const usable = yield* repository.organization.roleBinding.listUsableOwners(organizationId);
        if (!usable.some((owner) => owner.id === memberId))
          return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
        if (result.created) {
          yield* recordBindingEvent(actor, result.binding, "organization.role_granted");
          yield* repository.audit.event.append({
            organizationId,
            actorKind: "user",
            actorUserId: actor.user.id,
            eventType: "organization.owner_granted",
            targetType: "organization_member",
            targetId: memberId,
            metadata: {},
          });
        }
      }),
    );
  });
  const revoke = Effect.fn("Application.organization.ownership.revoke")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    memberId: OrganizationMemberId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requireOwner(actor, organizationId, { lock: true });
        if (
          (yield* repository.organization.member.findById(organizationId, memberId)) === undefined
        )
          return yield* new OrganizationError({ code: "MEMBER_NOT_FOUND" });
        const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          memberId,
        );
        const owner = grants.find(
          (assignment) => assignment.role.kind === "builtin" && assignment.role.key === "owner",
        );
        if (owner === undefined) return;
        yield* access.requireAnotherOwner(organizationId, memberId);
        const binding = yield* repository.organization.roleBinding.revoke(
          organizationId,
          owner.binding.id,
        );
        if (binding === undefined)
          return yield* Effect.die(new Error("Locked owner revocation returned no row"));
        yield* recordBindingEvent(actor, binding, "organization.role_revoked");
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.owner_revoked",
          targetType: "organization_member",
          targetId: memberId,
          metadata: {},
        });
      }),
    );
  });
  const transfer = Effect.fn("Application.organization.ownership.transfer")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    targetMemberId: OrganizationMemberId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requireOwner(actor, organizationId, { lock: true });
        if (targetMemberId === resolved.member.id) return;
        // Nested runs join this transaction; target grant and source demotion cannot commit separately.
        yield* grant(actor, organizationId, targetMemberId);
        const adminRole = yield* repository.organization.role.findByKey(organizationId, "admin");
        if (adminRole === undefined)
          return yield* Effect.die(new Error("Organization has no administrator role"));
        const admin = yield* repository.organization.roleBinding.grant({
          organizationId,
          roleId: adminRole.id,
          memberId: resolved.member.id,
          grantedByMemberId: resolved.member.id,
        });
        if (admin.created)
          yield* recordBindingEvent(actor, admin.binding, "organization.role_granted");
        yield* revoke(actor, organizationId, resolved.member.id);
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.ownership_transferred",
          targetType: "organization",
          targetId: organizationId,
          metadata: { fromMemberId: resolved.member.id, toMemberId: targetMemberId },
        });
      }),
    );
  });
  return { grant, revoke, transfer } as const;
});
