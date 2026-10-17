import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import {
  createTestIdentity,
  admitTestMember,
  createTestOrganization,
} from "../../fixtures/organization.js";
import { createTestTeam } from "../../fixtures/team.js";

layer(ApplicationTestLayer)("teams and scoped authority", (it) => {
  it.effect(
    "isolates team grants and revokes them on removal without restoring old roles on readmission",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestTeam;
        const colleague = yield* createTestIdentity("team-admin@example.test", "Team Admin");
        const member = yield* admitTestMember(fixture.organization.id, colleague.actor.user.id);
        const other = yield* application.organization.team.create(
          fixture.owner.actor,
          fixture.organization.id,
          {
            metadata: { name: "Research" },
            slug: "research",
          },
        );
        yield* application.organization.team.member.add(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.team.id,
          member.id,
        );
        const admin = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "admin",
          "team",
        );
        if (admin === undefined) throw new Error("Expected team administrator role");
        yield* application.organization.roleBinding.grant(
          fixture.owner.actor,
          fixture.organization.id,
          {
            teamId: fixture.team.id,
            roleId: admin.id,
            memberId: member.id,
          },
        );
        yield* application.organization.team.update(
          colleague.actor,
          fixture.organization.id,
          fixture.team.id,
          {
            metadata: { name: "Platform", description: null },
          },
        );
        expect(
          (yield* application.organization.team.get(
            fixture.owner.actor,
            fixture.organization.id,
            fixture.team.id,
          )).metadata,
        ).toEqual({ version: 1, name: "Platform" });
        expect(
          (yield* application.organization.organization.getAccess(
            colleague.actor,
            fixture.organization.id,
          )).permissions,
        ).toEqual([]);
        expect(
          yield* application.organization.team
            .update(colleague.actor, fixture.organization.id, other.id, {
              metadata: { name: "Forbidden" },
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "TeamError", code: "FORBIDDEN" });
        expect(
          yield* application.organization.roleBinding
            .grant(fixture.owner.actor, fixture.organization.id, {
              memberId: member.id,
              roleId: admin.id,
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ROLE_NOT_ASSIGNABLE" });

        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.team.member
                .remove(fixture.owner.actor, fixture.organization.id, fixture.team.id, member.id)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          (yield* application.organization.team.getAccess(
            colleague.actor,
            fixture.organization.id,
            fixture.team.id,
          )).permissions,
        ).toContain("team.update");
        yield* application.organization.team.member.remove(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.team.id,
          member.id,
        );
        expect(
          (yield* application.organization.team.getAccess(
            colleague.actor,
            fixture.organization.id,
            fixture.team.id,
          )).permissions,
        ).toEqual([]);
        yield* application.organization.team.member.add(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.team.id,
          member.id,
        );
        expect(
          (yield* application.organization.team.getAccess(
            colleague.actor,
            fixture.organization.id,
            fixture.team.id,
          )).permissions,
        ).not.toContain("team.update");
        yield* application.organization.member.remove(
          fixture.owner.actor,
          fixture.organization.id,
          member.id,
        );
        expect(
          (yield* repository.organization.team.member.find(
            fixture.organization.id,
            fixture.team.id,
            member.id,
          ))?.removedAt,
        ).not.toBeNull();
        expect(
          yield* repository.organization.roleBinding.listActiveByMemberId(
            fixture.organization.id,
            member.id,
            fixture.team.id,
          ),
        ).toEqual([]);
      }),
  );

  it.effect(
    "rolls back team creation when required audit fails and denies archived and cross-organization mutations",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.team
                .create(fixture.owner.actor, fixture.organization.id, {
                  metadata: { name: "Engineering" },
                  slug: "engineering",
                })
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          yield* repository.organization.team.list(fixture.organization.id, { limit: 10 }),
        ).toEqual([]);
        const team = yield* application.organization.team.create(
          fixture.owner.actor,
          fixture.organization.id,
          {
            metadata: { name: "Engineering" },
            slug: "engineering",
          },
        );
        const other = yield* application.organization.organization.create(fixture.owner.actor, {
          metadata: { name: "Other" },
          slug: "other",
        });
        expect(
          yield* application.organization.team
            .update(fixture.owner.actor, other.organization.id, team.id, {
              metadata: { name: "Forbidden" },
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "TeamError", code: "TEAM_NOT_FOUND" });
        yield* application.organization.team.archive(
          fixture.owner.actor,
          fixture.organization.id,
          team.id,
        );
        expect(
          yield* application.organization.team
            .update(fixture.owner.actor, fixture.organization.id, team.id, {
              metadata: { name: "Forbidden" },
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "TeamError", code: "TEAM_ARCHIVED" });
        expect(
          (yield* application.organization.team.list(fixture.owner.actor, fixture.organization.id))
            .teams,
        ).toEqual([]);
      }),
  );
});
