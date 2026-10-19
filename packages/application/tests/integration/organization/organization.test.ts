import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { Database, DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";
import { requestEmailProof } from "../../fixtures/email-sign-in.js";
import { createTestIdentity, createTestOrganization } from "../../fixtures/organization.js";
layer(ApplicationTestLayer)("Single organization authority", (it) => {
  it.effect(
    "installation creates complete organization authority without granting content to other operators",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const database = yield* Database;
        const owner = yield* completeTestBootstrap;
        const id = yield* application.organization.organization.currentId();
        const created = yield* application.organization.organization.get(owner.actor, id);
        expect(created.organization.metadata.name).toBe("Preface Test");
        expect(created.membership.userId).toBe(owner.actor.user.id);
        expect(created.access.isOwner).toBe(true);
        const persisted = yield* database.query.organization.findFirst({
          with: {
            members: { with: { bindings: { with: { role: true } } } },
            roles: true,
            authPolicy: true,
          },
        });
        expect(persisted?.roles).toHaveLength(5);
        expect(persisted?.members[0]?.bindings[0]?.role.key).toBe("owner");
        expect(persisted?.authPolicy?.allowedMethods).toEqual(["email_code", "email_link"]);
        const outsider = yield* createTestIdentity("outsider@example.test", "Other Operator");
        yield* repository.instance.owner.grant({
          userId: outsider.actor.user.id,
          grantSource: "owner",
          grantedByUserId: owner.actor.user.id,
        });
        expect(yield* application.instance.capabilities.get(outsider.actor)).toEqual({
          isInstanceOwner: true,
        });
        expect(
          yield* application.organization.organization.get(outsider.actor, id).pipe(Effect.flip),
        ).toMatchObject({ code: "ORGANIZATION_NOT_FOUND" });
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
