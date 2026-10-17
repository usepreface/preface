import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { readInvitationToken, requestInvitationProof } from "../../fixtures/invitation.js";
import { createTestTeam } from "../../fixtures/team.js";

layer(ApplicationTestLayer)("invitation team assignments", (it) => {
  it.effect(
    "commits verified identity, organization and team admission together with only the approved scoped roles",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestTeam;
        const role = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "member",
        );
        if (role === undefined) throw new Error("Expected organization member role");
        const invitation = yield* application.organization.invitation.create(
          fixture.owner.actor,
          fixture.organization.id,
          {
            email: "engineer@example.test",
            roleIds: [role.id],
            teams: [{ teamId: fixture.team.id }],
          },
        );
        const proof = yield* requestInvitationProof(
          yield* readInvitationToken(fixture.organization.id, invitation.id),
        );
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.invitation.accept(proof).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("engineer@example.test"),
        ).toBeUndefined();
        expect(
          (yield* repository.auth.verification.findById(proof.challengeId))?.consumedAt,
        ).toBeNull();
        const accepted = yield* application.organization.invitation.accept(proof);
        expect(
          yield* application.organization.team.getAccess(
            accepted.actor,
            fixture.organization.id,
            fixture.team.id,
          ),
        ).toEqual({
          isMember: true,
          permissions: ["team.read", "team.members.read", "team.roles.read"],
        });
        const members = yield* application.organization.team.member.list(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.team.id,
        );
        expect(
          members.members
            .find((member) => member.memberId === accepted.memberId)
            ?.roles.map((granted) => granted.key),
        ).toEqual(["member"]);
        expect(
          yield* application.organization.invitation.accept(proof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
      }),
  );

  it.effect(
    "revalidates a team assignment at acceptance and leaves proofs and identity untouched when the team was archived",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestTeam;
        const role = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "member",
        );
        if (role === undefined) throw new Error("Expected organization member role");
        const invitation = yield* application.organization.invitation.create(
          fixture.owner.actor,
          fixture.organization.id,
          {
            email: "stale-team@example.test",
            roleIds: [role.id],
            teams: [{ teamId: fixture.team.id }],
          },
        );
        const proof = yield* requestInvitationProof(
          yield* readInvitationToken(fixture.organization.id, invitation.id),
        );
        yield* application.organization.team.archive(
          fixture.owner.actor,
          fixture.organization.id,
          fixture.team.id,
        );
        expect(
          yield* application.organization.invitation.accept(proof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ASSIGNMENT_UNAVAILABLE" });
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("stale-team@example.test"),
        ).toBeUndefined();
        expect(
          (yield* repository.auth.verification.findById(proof.challengeId))?.consumedAt,
        ).toBeNull();
        expect(
          (yield* repository.organization.invitation.findById(
            fixture.organization.id,
            invitation.id,
          ))?.acceptedAt,
        ).toBeNull();
      }),
  );
});
