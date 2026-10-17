import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("organization membership lifecycle", (it) => {
  it.effect(
    "suspends only organization access, restores preserved assignments and removes without resurrecting grants",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const fixture = yield* createTestOrganization;
        const colleague = yield* createTestIdentity("colleague@example.test", "Colleague");
        const member = yield* admitTestMember(fixture.organization.id, colleague.actor.user.id);
        const role = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "member",
        );
        if (role === undefined) throw new Error("Expected member role");
        const binding = yield* application.organization.roleBinding.grant(
          fixture.owner.actor,
          fixture.organization.id,
          { memberId: member.id, roleId: role.id },
        );
        yield* application.organization.member.suspend(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          yield* application.organization.organization
            .get(colleague.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ORGANIZATION_NOT_FOUND" });
        expect(yield* application.auth.session.resolve(colleague.sessionToken)).toEqual(
          colleague.actor,
        );
        yield* application.organization.member.reinstate(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        yield* application.organization.organization.get(colleague.actor, fixture.organization.id);

        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.member
                .remove(fixture.owner.actor, fixture.organization.id, member.id)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          (yield* repository.organization.member.findById(fixture.organization.id, member.id))
            ?.removedAt,
        ).toBeNull();
        expect(
          (yield* repository.organization.roleBinding.findById(fixture.organization.id, binding.id))
            ?.revokedAt,
        ).toBeNull();
        yield* application.organization.member.remove(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          (yield* repository.organization.roleBinding.findById(fixture.organization.id, binding.id))
            ?.revokedAt,
        ).not.toBeNull();
        expect(
          yield* application.organization.member
            .reinstate(fixture.owner.actor, fixture.organization.id, member.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "MEMBER_NOT_ACTIVE" });
        // Even clearing lifecycle state alone cannot revive previously revoked assignments.
        yield* database.$client`update organization.member set removed_at = null where id = ${member.id}`;
        expect(
          (yield* application.organization.organization.getAccess(
            colleague.actor,
            fixture.organization.id,
          )).permissions,
        ).toEqual([]);
      }),
  );
});
