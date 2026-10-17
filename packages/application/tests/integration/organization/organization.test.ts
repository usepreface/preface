import { expect, layer } from "@effect/vitest";
import { Effect, Result, Schema } from "effect";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { CreateOrganizationInput } from "@usepreface/protocol/input";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { requestEmailProof } from "../../fixtures/email-sign-in.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("organization creation and access", (it) => {
  it.effect(
    "creates explicit organization authority and never treats instance ownership as membership",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const owner = yield* completeTestBootstrap;
        const input = yield* Schema.decodeUnknownEffect(CreateOrganizationInput)({
          metadata: { name: " Knowledge " },
          slug: " KNOWLEDGE ",
        });
        const created = yield* application.organization.organization.create(owner.actor, input);
        expect(created.organization).toMatchObject({
          metadata: { name: "Knowledge" },
          slug: "knowledge",
          archivedAt: null,
        });
        expect(created.membership.userId).toBe(owner.actor.user.id);
        expect(created.access).toMatchObject({ memberId: created.membership.id, isOwner: true });
        expect(
          yield* application.organization.authPolicy.get(owner.actor, created.organization.id),
        ).toMatchObject({ revision: 1, allowedMethods: ["email_code", "email_link"] });
        const persisted = yield* database.query.organization.findFirst({
          with: {
            members: { with: { bindings: { with: { role: true, grantedBy: true } } } },
            roles: true,
            authPolicy: true,
          },
        });
        expect(persisted?.roles).toHaveLength(5);
        expect(persisted?.members[0]?.bindings[0]?.role.key).toBe("owner");
        expect(persisted?.members[0]?.bindings[0]?.grantedBy.id).toBe(created.membership.id);

        const outsider = yield* createTestIdentity("outsider@example.test", "Other Owner");
        expect(
          yield* application.organization.organization
            .create(outsider.actor, { metadata: { name: "Other" }, slug: "other" })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
        yield* repository.instance.owner.grant({
          userId: outsider.actor.user.id,
          grantSource: "owner",
          grantedByUserId: owner.actor.user.id,
        });
        expect(yield* application.instance.capabilities.get(outsider.actor)).toEqual({
          canCreateOrganization: true,
        });
        expect(yield* application.organization.organization.listMine(outsider.actor, {})).toEqual({
          organizations: [],
          nextCursor: null,
        });
        expect(
          yield* application.organization.organization
            .get(outsider.actor, created.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ORGANIZATION_NOT_FOUND" });
        const event = yield* database.query.auditEvent.findFirst({
          where: { eventType: { eq: "organization.created" } },
          with: { organization: true },
        });
        expect(event?.organizationId).toBe(created.organization.id);
        expect(event?.organization?.slug).toBe("knowledge");
      }),
  );

  it.effect(
    "rolls back all creation writes after audit failure and maps competing slug creation without orphan rows",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const database = yield* Database;
        const owner = yield* completeTestBootstrap;
        const input = { metadata: { name: "Knowledge" }, slug: "knowledge" };
        yield* Effect.scoped(
          Effect.gen(function* () {
            yield* rejectLifecycleAudit;
            expect(
              yield* application.organization.organization
                .create(owner.actor, input)
                .pipe(Effect.flip),
            ).toMatchObject({ _tag: "DatabaseError" });
          }),
        );
        expect(yield* database.query.organization.findMany()).toEqual([]);
        expect(yield* database.query.organizationMember.findMany()).toEqual([]);
        expect(yield* database.query.organizationRole.findMany()).toEqual([]);
        expect(yield* database.query.organizationRoleBinding.findMany()).toEqual([]);
        expect(yield* database.query.organizationAuthPolicy.findMany()).toEqual([]);

        const outcomes = yield* Effect.all(
          [
            application.organization.organization.create(owner.actor, input).pipe(Effect.result),
            application.organization.organization.create(owner.actor, input).pipe(Effect.result),
          ],
          { concurrency: 2 },
        );
        expect(outcomes.filter(Result.isSuccess)).toHaveLength(1);
        expect(outcomes.find(Result.isFailure)?.failure).toMatchObject({
          _tag: "OrganizationError",
          code: "SLUG_UNAVAILABLE",
        });
        expect(yield* database.query.organizationMember.findMany()).toHaveLength(1);
        expect(yield* database.query.organizationRole.findMany()).toHaveLength(5);
        expect(yield* database.query.organizationAuthPolicy.findMany()).toHaveLength(1);
      }),
  );

  it.effect(
    "paginates memberships, blocks archived access and preserves owner-only restoration",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const first = yield* createTestOrganization;
        const second = yield* application.organization.organization.create(first.owner.actor, {
          metadata: { name: "Second" },
          slug: "second",
        });
        const page = yield* application.organization.organization.listMine(first.owner.actor, {
          limit: 1,
        });
        expect(page.organizations.map((org) => org.id)).toEqual([second.organization.id]);
        if (page.nextCursor === null) throw new Error("Expected next cursor");
        expect(
          (yield* application.organization.organization.listMine(first.owner.actor, {
            limit: 1,
            cursor: page.nextCursor,
          })).organizations.map((org) => org.id),
        ).toEqual([first.organization.id]);
        const member = yield* createTestIdentity("member@example.test", "Member");
        const membership = yield* admitTestMember(first.organization.id, member.actor.user.id);
        const memberRole = yield* repository.organization.role.findByKey(
          first.organization.id,
          "member",
        );
        if (memberRole === undefined) throw new Error("Expected built-in member role");
        yield* application.organization.roleBinding.grant(
          first.owner.actor,
          first.organization.id,
          { memberId: membership.id, roleId: memberRole.id },
        );
        yield* application.organization.organization.archive(
          first.owner.actor,
          first.organization.id,
        );
        expect(
          yield* application.organization.organization
            .get(first.owner.actor, first.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "ORGANIZATION_ARCHIVED" });
        expect(
          (yield* application.organization.organization.listMine(member.actor, {
            includeArchived: true,
          })).organizations,
        ).toEqual([]);
        expect(
          yield* application.organization.organization
            .restore(member.actor, first.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
        expect(
          (yield* application.organization.organization.listMine(first.owner.actor, {
            includeArchived: true,
          })).organizations,
        ).toHaveLength(2);
        yield* application.organization.organization.restore(
          first.owner.actor,
          first.organization.id,
        );
        yield* application.organization.organization.get(member.actor, first.organization.id);
      }),
  );

  it.effect("evaluates current policy and evidence instead of trusting an old actor", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const database = yield* Database;
      const fixture = yield* createTestOrganization;
      yield* database.$client`update organization.auth_policy set allowed_methods = '["email_link"]'::jsonb where organization_id = ${fixture.organization.id}`;
      expect(
        yield* application.organization.organization
          .get(fixture.owner.actor, fixture.organization.id)
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "OrganizationError", code: "AUTHENTICATION_REQUIRED" });
      const proof = yield* requestEmailProof();
      const linked = yield* application.auth.emailSignIn.verify({ ...proof, method: "magic_link" });
      yield* application.organization.organization.get(linked.actor, fixture.organization.id);
      yield* application.auth.session.revokeCurrent(linked.actor);
      expect(
        yield* application.organization.organization
          .update(linked.actor, fixture.organization.id, { metadata: { name: "Stale Actor" } })
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
    }),
  );
});
