import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Result } from "effect";

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

layer(ApplicationTestLayer)("organization ownership", (it) => {
  it.effect(
    "protects the last usable owner across every removal path and competing owner departures",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        expect(
          yield* application.organization.member
            .leave(fixture.owner.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
        expect(
          yield* application.organization.member
            .suspend(fixture.owner.actor, fixture.organization.id, fixture.membership.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
        expect(
          yield* application.organization.member
            .remove(fixture.owner.actor, fixture.organization.id, fixture.membership.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
        expect(
          yield* application.organization.ownership
            .revoke(fixture.owner.actor, fixture.organization.id, fixture.membership.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });

        const colleague = yield* createTestIdentity("co-owner@example.test", "Co-owner");
        const member = yield* admitTestMember(fixture.organization.id, colleague.actor.user.id);
        yield* application.organization.ownership.grant(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        const outcomes = yield* Effect.all(
          [
            application.organization.member
              .leave(fixture.owner.actor, fixture.organization.id)
              .pipe(Effect.result),
            application.organization.member
              .leave(colleague.actor, fixture.organization.id)
              .pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        expect(outcomes.filter(Result.isSuccess)).toHaveLength(1);
        expect(outcomes.find(Result.isFailure)?.failure).toMatchObject({
          _tag: "OrganizationError",
          code: "LAST_OWNER",
        });
        expect(
          yield* repository.organization.roleBinding.listUsableOwners(fixture.organization.id),
        ).toHaveLength(1);
      }),
  );

  it.effect(
    "transfers ownership with source demotion atomically and keeps administrators away from owner operations",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const successor = yield* createTestIdentity("successor@example.test", "Successor");
        const member = yield* admitTestMember(fixture.organization.id, successor.actor.user.id);
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.ownership
                .transfer(fixture.owner.actor, fixture.organization.id, member.id)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          (yield* application.organization.organization.getAccess(
            fixture.owner.actor,
            fixture.organization.id,
          )).isOwner,
        ).toBe(true);
        expect(
          yield* repository.organization.roleBinding.listActiveByMemberId(
            fixture.organization.id,
            member.id,
          ),
        ).toEqual([]);
        yield* application.organization.ownership.transfer(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          (yield* application.organization.organization.getAccess(
            successor.actor,
            fixture.organization.id,
          )).isOwner,
        ).toBe(true);
        expect(
          (yield* application.organization.organization.get(
            fixture.owner.actor,
            fixture.organization.id,
          )).membership.roles.map((role) => role.key),
        ).toEqual(["admin"]);
        expect(
          yield* application.organization.member
            .suspend(fixture.owner.actor, fixture.organization.id, member.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
        expect(
          yield* application.organization.organization
            .archive(fixture.owner.actor, fixture.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
        const ownerRole = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "owner",
        );
        if (ownerRole === undefined) throw new Error("Expected owner role");
        expect(
          yield* application.organization.roleBinding
            .grant(fixture.owner.actor, fixture.organization.id, {
              memberId: fixture.membership.id,
              roleId: ownerRole.id,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_ASSIGNABLE" });
      }),
  );

  it.effect("does not count a disabled identity as a recovery owner", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const fixture = yield* createTestOrganization;
      const colleague = yield* createTestIdentity("disabled@example.test", "Disabled Owner");
      const member = yield* admitTestMember(fixture.organization.id, colleague.actor.user.id);
      yield* application.organization.ownership.grant(
        fixture.owner.actor,
        fixture.organization.id,
        member.id,
      );
      yield* (yield* Database)
        .$client`update auth.user set disabled_at = ${DateTime.toDateUtc(yield* DateTime.now)} where id = ${colleague.actor.user.id}`;
      expect(
        yield* application.organization.member
          .leave(fixture.owner.actor, fixture.organization.id)
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
      expect(
        yield* repository.organization.roleBinding.listUsableOwners(fixture.organization.id),
      ).toHaveLength(1);
    }),
  );
});
