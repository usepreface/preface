import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { rejectLifecycleAudit } from "../../fixtures/audit-failure.js";
import { completeTestBootstrap } from "../../fixtures/bootstrap.js";

layer(ApplicationTestLayer)("versioned profiles", (it) => {
  it.effect("merges metadata patches, clears optional fields and rolls back when audit fails", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const fixture = yield* completeTestBootstrap;
      yield* repository.auth.user.updateMetadata(fixture.actor.user.id, {
        version: 1,
        name: "Owner",
        title: "Engineer",
        bio: "Hello",
        image: { type: "image", value: "https://example.test/avatar.png" },
      });
      const profile = yield* application.auth.profile.update(fixture.actor, {
        metadata: { name: "New Name", bio: null },
      });
      expect(profile.metadata).toEqual({
        version: 1,
        name: "New Name",
        title: "Engineer",
        image: { type: "image", value: "https://example.test/avatar.png" },
      });
      expect(profile.email).toBe(fixture.actor.user.email);
      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* rejectLifecycleAudit;
          expect(
            yield* application.auth.profile
              .update(fixture.actor, { metadata: { title: "Should roll back" } })
              .pipe(Effect.flip),
          ).toMatchObject({ _tag: "DatabaseError" });
        }),
      );
      expect((yield* application.auth.profile.get(fixture.actor)).metadata.title).toBe("Engineer");
      yield* application.auth.session.revokeCurrent(fixture.actor);
      expect(
        yield* application.auth.profile
          .update(fixture.actor, { metadata: { name: "Forbidden" } })
          .pipe(Effect.flip),
      ).toMatchObject({ _tag: "AuthenticationError", code: "UNAUTHENTICATED" });
    }),
  );
});
