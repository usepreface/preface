import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import {
  OrganizationError,
  type TeamId,
  type OrganizationId,
  type OrganizationMemberId,
  type OrganizationRoleId,
  type OrganizationRoleBindingId,
} from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";
import { makeBindingAudit } from "#/organization/binding-audit";
import { requireDelegablePermissions } from "#/organization/delegation";
import { TeamAccess } from "#/organization/team/access";
import { publicBinding } from "#/organization/views";

export const makeOrganizationRoleBindingApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const teams = yield* TeamAccess;
  const recordBindingEvent = yield* makeBindingAudit;
  const grant = Effect.fn("Application.organization.roleBinding.grant")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: {
      readonly memberId: OrganizationMemberId;
      readonly roleId: OrganizationRoleId;
      readonly teamId?: TeamId;
    },
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        if (input.teamId !== undefined) {
          const resolved = yield* teams.requirePermissions(
            actor,
            organizationId,
            input.teamId,
            ["team.roles.assign"],
            { lock: true },
          );
          const member = yield* repository.organization.member.findById(
            organizationId,
            input.memberId,
          );
          const user =
            member === undefined ? undefined : yield* repository.auth.user.findById(member.userId);
          const membership = yield* repository.organization.team.member.find(
            organizationId,
            input.teamId,
            input.memberId,
          );
          if (
            member === undefined ||
            member.removedAt !== null ||
            member.suspendedAt !== null ||
            user === undefined ||
            user.disabledAt !== null ||
            membership === undefined ||
            membership.removedAt !== null
          )
            return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
          const role = yield* repository.organization.role.findById(organizationId, input.roleId);
          if (role === undefined || role.archivedAt !== null || role.scopeKind !== "team")
            return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
          yield* requireDelegablePermissions(resolved.permissions, role.permissions);
          const granted = yield* repository.organization.roleBinding.grant({
            organizationId,
            ...input,
            grantedByMemberId: resolved.organization.member.id,
          });
          if (granted.created)
            yield* recordBindingEvent(actor, granted.binding, "organization.role_granted");
          return publicBinding(granted.binding);
        }
        const resolved = yield* access.requirePermissions(actor, organizationId, ["roles.assign"], {
          lock: true,
        });
        const member = yield* repository.organization.member.findById(
          organizationId,
          input.memberId,
        );
        if (member === undefined) return yield* new OrganizationError({ code: "MEMBER_NOT_FOUND" });
        const user = yield* repository.auth.user.findById(member.userId);
        if (
          member.removedAt !== null ||
          member.suspendedAt !== null ||
          user === undefined ||
          user.disabledAt !== null
        )
          return yield* new OrganizationError({ code: "MEMBER_NOT_ACTIVE" });
        const role = yield* repository.organization.role.findById(organizationId, input.roleId);
        if (role === undefined || role.archivedAt !== null)
          return yield* new OrganizationError({ code: "ROLE_NOT_FOUND" });
        const targetGrants = yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          member.id,
        );
        if (
          targetGrants.some(
            (assignment) => assignment.role.kind === "builtin" && assignment.role.key === "owner",
          ) &&
          !resolved.isOwner
        )
          return yield* new OrganizationError({ code: "FORBIDDEN" });
        if (role.scopeKind !== "organization" || (role.kind === "builtin" && role.key === "owner"))
          return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
        yield* requireDelegablePermissions(resolved.permissions, role.permissions);
        const result = yield* repository.organization.roleBinding.grant({
          organizationId,
          memberId: member.id,
          roleId: role.id,
          grantedByMemberId: resolved.member.id,
        });
        if (result.created)
          yield* recordBindingEvent(actor, result.binding, "organization.role_granted");
        return publicBinding(result.binding);
      }),
    );
  });
  const revoke = Effect.fn("Application.organization.roleBinding.revoke")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    bindingId: OrganizationRoleBindingId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        yield* access.requireMember(actor, organizationId, { lock: true });
        const binding = yield* repository.organization.roleBinding.findById(
          organizationId,
          bindingId,
        );
        if (binding === undefined)
          return yield* new OrganizationError({ code: "BINDING_NOT_FOUND" });
        if (binding.teamId !== null) {
          const resolved = yield* teams.requirePermissions(actor, organizationId, binding.teamId, [
            "team.roles.assign",
          ]);
          const role = yield* repository.organization.role.findById(organizationId, binding.roleId);
          if (role === undefined) return yield* Effect.die(new Error("Role binding has no role"));
          yield* requireDelegablePermissions(resolved.permissions, role.permissions);
          const revoked = yield* repository.organization.roleBinding.revoke(
            organizationId,
            bindingId,
          );
          if (revoked !== undefined)
            yield* recordBindingEvent(actor, revoked, "organization.role_revoked");
          return;
        }
        const resolved = yield* access.requirePermissions(actor, organizationId, ["roles.assign"]);
        const role = yield* repository.organization.role.findById(organizationId, binding.roleId);
        if (role === undefined) return yield* Effect.die(new Error("Role binding has no role"));
        if (role.kind === "builtin" && role.key === "owner")
          return yield* new OrganizationError({ code: "ROLE_NOT_ASSIGNABLE" });
        yield* requireDelegablePermissions(resolved.permissions, role.permissions);
        const targetGrants = yield* repository.organization.roleBinding.listActiveByMemberId(
          organizationId,
          binding.memberId,
        );
        if (
          targetGrants.some(
            (assignment) => assignment.role.kind === "builtin" && assignment.role.key === "owner",
          ) &&
          !resolved.isOwner
        )
          return yield* new OrganizationError({ code: "FORBIDDEN" });
        const revoked = yield* repository.organization.roleBinding.revoke(
          organizationId,
          bindingId,
        );
        if (revoked !== undefined)
          yield* recordBindingEvent(actor, revoked, "organization.role_revoked");
      }),
    );
  });
  return { grant, revoke } as const;
});
