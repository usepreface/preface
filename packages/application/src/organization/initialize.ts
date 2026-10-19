import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { UserId } from "@usepreface/protocol";

import { builtinOrganizationRoles, builtinTeamRoles } from "#/organization/builtin-roles";

// Bootstrap owns the installation lock and transaction, including all required audit rows.
export const makeOrganizationInitialization = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.organization.initialize")(function* (userId: UserId, name: string) {
    const organization = yield* repository.organization.organization.create({
      metadata: { version: 1, name },
      createdByUserId: userId,
    });
    const member = yield* repository.organization.member.create({
      organizationId: organization.id,
      userId,
    });
    for (const definition of builtinOrganizationRoles) {
      const role = yield* repository.organization.role.create({
        organizationId: organization.id,
        kind: "builtin",
        ...definition,
      });
      if (definition.key === "owner") {
        yield* repository.organization.roleBinding.grant({
          organizationId: organization.id,
          roleId: role.id,
          memberId: member.id,
          grantedByMemberId: member.id,
        });
        yield* repository.audit.event.append({
          organizationId: organization.id,
          actorKind: "user",
          actorUserId: userId,
          eventType: "organization.owner_granted",
          targetType: "organization_member",
          targetId: member.id,
          metadata: {},
        });
      }
    }
    for (const definition of builtinTeamRoles)
      yield* repository.organization.role.create({
        organizationId: organization.id,
        scopeKind: "team",
        kind: "builtin",
        ...definition,
      });
    yield* repository.organization.authPolicy.createDefault(organization.id, member.id);
    yield* repository.audit.event.append({
      organizationId: organization.id,
      actorKind: "user",
      actorUserId: userId,
      eventType: "organization.created",
      targetType: "organization",
      targetId: organization.id,
      metadata: { name: organization.metadata.name },
    });
    return organization;
  });
});
