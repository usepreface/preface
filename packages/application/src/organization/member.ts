import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import {
  OrganizationError,
  type OrganizationId,
  type OrganizationMemberId,
} from "@usepreface/protocol";
import type { SessionActor, ListOrganizationMembersQuery } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";
import { makeBindingAudit } from "#/organization/binding-audit";
import { publicMember } from "#/organization/views";

export const makeOrganizationMemberApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const recordBindingEvent = yield* makeBindingAudit;
  const list = Effect.fn("Application.organization.member.list")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: ListOrganizationMembersQuery,
  ) {
    yield* access.requirePermissions(actor, organizationId, ["members.read"]);
    const limit = input.limit ?? 25;
    const rows = yield* repository.organization.member.listByOrganizationId(organizationId, {
      ...input,
      limit: limit + 1,
    });
    const visible = rows.slice(0, limit);
    const grants = yield* repository.organization.roleBinding.listActiveByMemberIds(
      organizationId,
      visible.map((row) => row.member.id),
    );
    return {
      members: visible.map((row) =>
        publicMember(
          row.member,
          row.metadata,
          grants
            .filter((grant) => grant.binding.memberId === row.member.id)
            .map((grant) => grant.role),
        ),
      ),
      nextCursor: rows.length > limit ? (visible.at(-1)?.member.id ?? null) : null,
    };
  });
  const change = Effect.fn("Application.organization.member.change")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    memberId: OrganizationMemberId | undefined,
    action: "suspend" | "reinstate" | "remove" | "leave",
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const resolved =
          action === "leave"
            ? yield* access.requireMember(actor, organizationId, { lock: true })
            : yield* access.requirePermissions(actor, organizationId, ["members.manage"], {
                lock: true,
              });
        const target =
          memberId === undefined
            ? resolved.member
            : yield* repository.organization.member.findById(organizationId, memberId);
        if (target === undefined) return yield* new OrganizationError({ code: "MEMBER_NOT_FOUND" });
        if (target.removedAt !== null) {
          if (action === "remove") return;
          return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
        }
        const grants = yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          target.id,
        );
        const isOwner = grants.some(
          (grant) => grant.role.kind === "builtin" && grant.role.key === "owner",
        );
        if (isOwner && !resolved.isOwner)
          return yield* new OrganizationError({ code: "FORBIDDEN" });
        if (isOwner && action !== "reinstate")
          yield* access.requireAnotherOwner(organizationId, target.id);
        if (action === "reinstate") {
          const user = yield* repository.auth.user.findById(target.userId);
          if (user === undefined || user.disabledAt !== null)
            return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
        }
        const changed =
          action === "suspend"
            ? yield* repository.organization.member.suspend(organizationId, target.id)
            : action === "reinstate"
              ? yield* repository.organization.member.reinstate(organizationId, target.id)
              : yield* repository.organization.member.remove(organizationId, target.id);
        if (changed === undefined) return;
        if (action === "remove" || action === "leave") {
          yield* repository.organization.team.member.removeAllByMember(organizationId, target.id);
          const revoked = yield* repository.organization.roleBinding.revokeAllByMemberId(
            organizationId,
            target.id,
          );
          for (const binding of revoked)
            yield* recordBindingEvent(actor, binding, "organization.role_revoked");
          if (isOwner)
            yield* repository.audit.event.append({
              organizationId,
              actorKind: "user",
              actorUserId: actor.user.id,
              eventType: "organization.owner_revoked",
              targetType: "organization_member",
              targetId: target.id,
              metadata: {},
            });
        }
        const eventType =
          action === "suspend"
            ? "organization.member_suspended"
            : action === "reinstate"
              ? "organization.member_reinstated"
              : action === "leave"
                ? "organization.member_left"
                : "organization.member_removed";
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType,
          targetType: "organization_member",
          targetId: target.id,
          metadata: {},
        });
      }),
    );
  });
  return {
    list,
    suspend: Effect.fn("Application.organization.member.suspend")(
      (actor: SessionActor, organizationId: OrganizationId, memberId: OrganizationMemberId) =>
        change(actor, organizationId, memberId, "suspend"),
    ),
    reinstate: Effect.fn("Application.organization.member.reinstate")(
      (actor: SessionActor, organizationId: OrganizationId, memberId: OrganizationMemberId) =>
        change(actor, organizationId, memberId, "reinstate"),
    ),
    remove: Effect.fn("Application.organization.member.remove")(
      (actor: SessionActor, organizationId: OrganizationId, memberId: OrganizationMemberId) =>
        change(actor, organizationId, memberId, "remove"),
    ),
    leave: Effect.fn("Application.organization.member.leave")(
      (actor: SessionActor, organizationId: OrganizationId) =>
        change(actor, organizationId, undefined, "leave"),
    ),
  } as const;
});
