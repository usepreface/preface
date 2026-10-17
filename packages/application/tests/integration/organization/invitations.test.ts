import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Result } from "effect";
import { TestClock } from "effect/testing";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import {
  createTestInvitation,
  readInvitationToken,
  requestInvitationProof,
} from "../../fixtures/invitation.js";
import {
  createTestOrganization,
  createTestIdentity,
  admitTestMember,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("organization invitations", (it) => {
  it.effect(
    "admits a verified new identity once and preserves atomicity when acceptance audit fails",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const fixture = yield* createTestOrganization;
        const invitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "new@example.test",
        );
        const proof = yield* requestInvitationProof(invitation.input);
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("new@example.test"),
        ).toBeUndefined();
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.invitation.accept(proof).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("new@example.test"),
        ).toBeUndefined();
        expect(
          (yield* repository.auth.verification.findById(proof.challengeId))?.consumedAt,
        ).toBeNull();
        expect(
          (yield* repository.organization.invitation.findById(
            fixture.organization.id,
            invitation.invitation.id,
          ))?.acceptedAt,
        ).toBeNull();
        const results = yield* Effect.all(
          [
            application.organization.invitation.accept(proof).pipe(Effect.result),
            application.organization.invitation.accept(proof).pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        expect(results.filter(Result.isSuccess)).toHaveLength(1);
        expect(results.find(Result.isFailure)?.failure).toMatchObject({
          _tag: "InvitationError",
          code: "INVALID_INVITATION",
        });
        const accepted = results.find(Result.isSuccess)?.success;
        if (accepted === undefined) throw new Error("Expected successful acceptance");
        expect(
          (yield* application.organization.organization.getAccess(
            accepted.actor,
            fixture.organization.id,
          )).permissions,
        ).toContain("organization.read");
        expect(
          (yield* repository.organization.invitation.findById(
            fixture.organization.id,
            invitation.invitation.id,
          ))?.acceptedByUserId,
        ).toBe(accepted.actor.user.id);
        const events = yield* database.$client<{
          event_type: string;
        }>`select event_type from audit.event where organization_id = ${fixture.organization.id}`;
        expect(
          events.filter((event) => event.event_type === "organization.invitation_accepted"),
        ).toHaveLength(1);
        expect(yield* application.instance.capabilities.get(accepted.actor)).toEqual({
          canCreateOrganization: false,
        });
      }),
  );

  it.effect(
    "reuses the intended identity, refuses account switching and admits removed members with only the newly invited roles",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const colleague = yield* createTestIdentity("existing@example.test", "Existing Profile");
        const invitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "existing@example.test",
        );
        const proof = yield* requestInvitationProof(invitation.input);
        expect(
          yield* application.organization.invitation
            .accept(proof, fixture.owner.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ACCOUNT_MISMATCH" });
        const accepted = yield* application.organization.invitation.accept(
          { ...proof, method: "magic_link" },
          colleague.actor,
        );
        expect(accepted.actor.user.id).toBe(colleague.actor.user.id);
        expect(accepted.actor.user.metadata.name).toBe("Existing Profile");
        yield* application.organization.member.suspend(
          fixture.owner.actor,
          fixture.organization.id,
          accepted.memberId,
        );
        const suspendedInvitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "existing@example.test",
        );
        const suspendedProof = yield* requestInvitationProof(suspendedInvitation.input);
        expect(
          yield* application.organization.invitation.accept(suspendedProof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "RECIPIENT_UNAVAILABLE" });
        yield* application.organization.member.remove(
          fixture.owner.actor,
          fixture.organization.id,
          accepted.memberId,
        );
        const custom = yield* application.organization.role.create(
          fixture.owner.actor,
          fixture.organization.id,
          { key: "reviewer", name: "Reviewer", permissions: ["organization.read"] },
        );
        const readmission = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "existing@example.test",
          [custom.id],
        );
        const readmitted = yield* application.organization.invitation.accept(
          yield* requestInvitationProof(readmission.input),
        );
        expect(readmitted.memberId).toBe(accepted.memberId);
        expect(
          (yield* repository.organization.roleBinding.listActiveByMemberId(
            fixture.organization.id,
            readmitted.memberId,
          )).map((grant) => grant.role.id),
        ).toEqual([custom.id]);
      }),
  );

  it.effect(
    "replaces invitation and browser proofs, commits the attempt budget, and enforces expiry and revocation",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const invitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "new@example.test",
        );
        const original = yield* requestInvitationProof(invitation.input);
        yield* application.organization.invitation.resend(
          fixture.owner.actor,
          fixture.organization.id,
          invitation.invitation.id,
        );
        expect(
          yield* application.organization.invitation.inspect(invitation.input).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
        const current = yield* readInvitationToken(
          fixture.organization.id,
          invitation.invitation.id,
        );
        expect(
          yield* application.organization.invitation
            .accept({ ...original, ...current })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        const first = yield* requestInvitationProof(current);
        const proof = yield* requestInvitationProof(current);
        expect(
          yield* application.organization.invitation.accept(first).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        expect(
          yield* application.organization.invitation
            .accept({ ...proof, browserToken: Redacted.make("a".repeat(43)) })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        const wrongCode = Redacted.make(
          Redacted.value(proof.code) === "00000000" ? "11111111" : "00000000",
        );
        for (let attempt = 0; attempt < 5; attempt++) {
          expect(
            yield* application.organization.invitation
              .accept({ ...proof, code: wrongCode })
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        }
        expect((yield* repository.auth.verification.findById(proof.challengeId))?.attempts).toBe(5);
        expect(
          yield* application.organization.invitation
            .accept({ ...proof, method: "magic_link" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        const expiring = yield* requestInvitationProof(current);
        yield* TestClock.adjust("10 minutes");
        expect(
          yield* application.organization.invitation.accept(expiring).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_PROOF" });
        yield* application.organization.invitation.revoke(
          fixture.owner.actor,
          fixture.organization.id,
          invitation.invitation.id,
        );
        expect(
          yield* application.organization.invitation.requestVerification(current).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
      }),
  );

  it.effect(
    "rechecks inviter delegation and current roles, prohibits ownership and obeys the current organization policy",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const fixture = yield* createTestOrganization;
        const admin = yield* createTestIdentity("admin@example.test", "Administrator");
        const member = yield* admitTestMember(fixture.organization.id, admin.actor.user.id);
        const adminRole = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "admin",
        );
        const ownerRole = yield* repository.organization.role.findByKey(
          fixture.organization.id,
          "owner",
        );
        if (adminRole === undefined || ownerRole === undefined)
          throw new Error("Expected builtin roles");
        const binding = yield* application.organization.roleBinding.grant(
          fixture.owner.actor,
          fixture.organization.id,
          { memberId: member.id, roleId: adminRole.id },
        );
        expect(
          yield* application.organization.invitation
            .create(fixture.owner.actor, fixture.organization.id, {
              email: "new@example.test",
              roleIds: [ownerRole.id],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ASSIGNMENT_UNAVAILABLE" });
        const invitation = yield* createTestInvitation(
          admin.actor,
          fixture.organization.id,
          "new@example.test",
        );
        const proof = yield* requestInvitationProof(invitation.input);
        yield* application.organization.roleBinding.revoke(
          fixture.owner.actor,
          fixture.organization.id,
          binding.id,
        );
        expect(
          yield* application.organization.invitation.accept(proof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVITER_NOT_AUTHORIZED" });
        const custom = yield* application.organization.role.create(
          fixture.owner.actor,
          fixture.organization.id,
          { key: "reviewer", name: "Reviewer", permissions: ["organization.read"] },
        );
        const assigned = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "other@example.test",
          [custom.id],
        );
        const assignedProof = yield* requestInvitationProof(assigned.input);
        yield* application.organization.role.archive(
          fixture.owner.actor,
          fixture.organization.id,
          custom.id,
        );
        expect(
          yield* application.organization.invitation.accept(assignedProof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ASSIGNMENT_UNAVAILABLE" });
        const allowed = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "allowed@example.test",
        );
        const allowedProof = yield* requestInvitationProof(allowed.input);
        yield* database.$client`update organization.auth_policy set allowed_methods = '["email_link"]'::jsonb where organization_id = ${fixture.organization.id}`;
        expect(
          yield* application.organization.invitation.accept(allowedProof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ASSIGNMENT_UNAVAILABLE" });
        yield* application.organization.invitation.accept({
          ...allowedProof,
          method: "magic_link",
        });
      }),
  );

  it.effect(
    "isolates verification purposes and converges concurrent admission to the same installation identity",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const fixture = yield* createTestOrganization;
        const another = yield* application.organization.organization.create(fixture.owner.actor, {
          metadata: { name: "Second" },
          slug: "second",
        });
        const first = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "shared@example.test",
        );
        const second = yield* createTestInvitation(
          fixture.owner.actor,
          another.organization.id,
          "shared@example.test",
        );
        const firstProof = yield* requestInvitationProof(first.input);
        const secondProof = yield* requestInvitationProof(second.input);
        expect(
          yield* application.auth.emailSignIn.verify(firstProof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        expect(
          yield* application.auth.emailSignIn.resend(firstProof).pipe(Effect.flip),
        ).toMatchObject({ _tag: "EmailSignInError", code: "INVALID_PROOF" });
        const results = yield* Effect.all(
          [
            application.organization.invitation.accept(firstProof),
            application.organization.invitation.accept(secondProof),
          ],
          { concurrency: 2 },
        );
        expect(results[0].actor.user.id).toBe(results[1].actor.user.id);
        expect(
          (yield* repository.auth.userEmail.findActiveByEmail("shared@example.test"))?.userId,
        ).toBe(results[0].actor.user.id);
      }),
  );
  it.effect(
    "rolls back failed issuance, replaces pending invitations and scopes management to its organization",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const fixture = yield* createTestOrganization;
        const invitation = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "new@example.test",
        );
        const original = yield* repository.organization.invitation.findById(
          fixture.organization.id,
          invitation.invitation.id,
        );
        if (original === undefined) throw new Error("Expected stored invitation");
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* createTestInvitation(
                fixture.owner.actor,
                fixture.organization.id,
                "new@example.test",
              ).pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        yield* application.organization.invitation.inspect(invitation.input);
        expect((yield* repository.jobs.email.findById(original.emailJobId))?.status).toBe(
          "pending",
        );
        const replacement = yield* createTestInvitation(
          fixture.owner.actor,
          fixture.organization.id,
          "new@example.test",
        );
        expect(
          yield* application.organization.invitation.inspect(invitation.input).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
        expect((yield* repository.jobs.email.findById(original.emailJobId))?.status).toBe(
          "cancelled",
        );
        const page = yield* application.organization.invitation.list(
          fixture.owner.actor,
          fixture.organization.id,
          { limit: 1 },
        );
        expect(page.invitations.map((invite) => invite.id)).toEqual([replacement.invitation.id]);
        expect(page.nextCursor).toBe(replacement.invitation.id);
        const another = yield* application.organization.organization.create(fixture.owner.actor, {
          metadata: { name: "Second" },
          slug: "second",
        });
        expect(
          yield* application.organization.invitation
            .revoke(fixture.owner.actor, another.organization.id, replacement.invitation.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVITATION_NOT_FOUND" });
        const foreignRole = yield* repository.organization.role.findByKey(
          another.organization.id,
          "member",
        );
        if (foreignRole === undefined) throw new Error("Expected member role");
        expect(
          yield* application.organization.invitation
            .create(fixture.owner.actor, fixture.organization.id, {
              email: "cross@example.test",
              roleIds: [foreignRole.id],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "ASSIGNMENT_UNAVAILABLE" });
        yield* TestClock.adjust("7 days");
        expect(
          yield* application.organization.invitation.inspect(replacement.input).pipe(Effect.flip),
        ).toMatchObject({ _tag: "InvitationError", code: "INVALID_INVITATION" });
        expect(
          yield* repository.auth.userEmail.findActiveByEmail("new@example.test"),
        ).toBeUndefined();
        const rows = yield* database.$client<{
          count: string;
        }>`select count(*)::text as count from organization.invitation where organization_id = ${fixture.organization.id}`;
        expect(rows[0]?.count).toBe("2");
      }),
  );
});
