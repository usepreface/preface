import { expect, it } from "@effect/vitest";
import { Deferred, Effect, Fiber, Schedule } from "effect";

import { Database, DatabaseRepository, TransactionService } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";

const port = process.env.PREFACE_TEST_POSTGRES_PORT;

it.live.skipIf(port === undefined)(
  "rechecks permissions after waiting for the organization mutation lock",
  () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const transaction = yield* TransactionService;
      const sql = (yield* Database).$client;
      const fixture = yield* createTestOrganization;
      const editor = yield* createTestIdentity("waiting-editor@example.test", "Waiting Editor");
      const member = yield* admitTestMember(fixture.organization.id, editor.actor.user.id);
      const role = yield* application.organization.role.create(
        fixture.owner.actor,
        fixture.organization.id,
        {
          key: "editor",
          name: "Editor",
          permissions: ["organization.read", "organization.update"],
        },
      );
      const binding = yield* application.organization.roleBinding.grant(
        fixture.owner.actor,
        fixture.organization.id,
        { roleId: role.id, memberId: member.id },
      );
      const locked = yield* Deferred.make<void>();
      const revoke = yield* Deferred.make<void>();

      const administrator = yield* transaction
        .run(
          Effect.gen(function* () {
            yield* repository.organization.organization.lockById(fixture.organization.id);
            yield* Deferred.succeed(locked, undefined);
            yield* Deferred.await(revoke);
            yield* application.organization.roleBinding.revoke(
              fixture.owner.actor,
              fixture.organization.id,
              binding.id,
            );
          }),
        )
        .pipe(Effect.forkChild);
      yield* Deferred.await(locked);
      const waitingUpdate = yield* application.organization.organization
        .update(editor.actor, fixture.organization.id, { name: "Unauthorized update" })
        .pipe(Effect.result, Effect.forkChild);
      yield* sql<{
        readonly count: number;
      }>`select count(*)::int as count from pg_stat_activity where application_name = 'preface' and wait_event_type = 'Lock'`.pipe(
        Effect.flatMap((rows) =>
          rows[0]?.count === 1 ? Effect.void : Effect.fail("Mutation has not reached the lock"),
        ),
        Effect.retry({ times: 100, schedule: Schedule.spaced("10 millis") }),
      );
      yield* Deferred.succeed(revoke, undefined);
      yield* Fiber.join(administrator);
      expect(yield* Fiber.join(waitingUpdate)).toMatchObject({
        _tag: "Failure",
        failure: { _tag: "OrganizationError", code: "FORBIDDEN" },
      });
      expect(
        (yield* repository.organization.organization.findById(fixture.organization.id))?.name,
      ).toBe("Knowledge");
    }).pipe(Effect.provide(ApplicationTestLayer)),
);
