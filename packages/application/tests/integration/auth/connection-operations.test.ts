import { expect, layer } from "@effect/vitest";
import { DateTime, Effect } from "effect";
import { TestClock } from "effect/testing";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { signInTestUser } from "../../fixtures/email-sign-in.js";
import { createTestOrganization } from "../../fixtures/organization.js";
import { completeTestSaml, configureTestSaml, linkTestSaml } from "../../fixtures/saml.js";

layer(ApplicationTestLayer)("Connection operations", (it) => {
  it.effect(
    "tests a candidate, publishes overlap and rotates without invalidating identity evidence",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestSaml(owner.actor, organization.id);
        yield* linkTestSaml(owner.actor, organization.id, connection.id);
        const evidenceBefore = yield* repository.auth.sessionAuthentication.listUsableBySessionId(
          owner.actor.session.id,
        );
        const keys = application.organization.identityConnection.keys;
        const candidate = yield* keys.prepare(
          owner.actor,
          organization.id,
          connection.id,
          connection.revision,
        );
        expect(candidate).not.toHaveProperty("privateKeyCiphertext");
        const pendingMetadata = yield* application.auth.saml.metadata(
          organization.id,
          connection.id,
        );
        expect(pendingMetadata).toContain(connection.configuration.signingCertificate);
        expect(pendingMetadata).toContain(candidate.certificate);
        expect(
          yield* keys
            .activate(
              owner.actor,
              organization.id,
              connection.id,
              candidate.id,
              connection.revision,
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "KEY_NOT_TESTED" });

        const started = yield* keys.test(
          owner.actor,
          organization.id,
          connection.id,
          candidate.id,
          connection.revision,
        );
        yield* completeTestSaml(connection.id, started, owner.actor);
        const activated = yield* keys.activate(
          owner.actor,
          organization.id,
          connection.id,
          candidate.id,
          connection.revision,
        );
        expect(activated.status).toBe("activated");
        const current = yield* application.organization.identityConnection.get(
          owner.actor,
          organization.id,
          connection.id,
        );
        expect(current).toMatchObject({
          status: "active",
          revision: connection.revision,
          configuration: { signingCertificate: candidate.certificate },
        });
        expect(
          yield* repository.auth.sessionAuthentication.listUsableBySessionId(
            owner.actor.session.id,
          ),
        ).toEqual(evidenceBefore);
        expect(
          (yield* repository.auth.identityConnectionKey.find(candidate.id))?.privateKeyCiphertext,
        ).toBeNull();

        const old = (yield* keys.list(owner.actor, organization.id, connection.id)).keys.find(
          (key) => key.status === "retiring",
        );
        if (old === undefined) throw new Error("Expected retiring certificate");
        yield* keys.retire(
          owner.actor,
          organization.id,
          connection.id,
          old.id,
          connection.revision,
        );
        expect(yield* application.auth.saml.metadata(organization.id, connection.id)).not.toContain(
          connection.configuration.signingCertificate,
        );
        expect(
          yield* keys
            .retire(owner.actor, organization.id, connection.id, candidate.id, connection.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "KEY_UNAVAILABLE" });
      }),
  );
  it.effect("rejects retired candidate tests and scrubs abandoned private keys", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestSaml(owner.actor, organization.id);
      const keys = application.organization.identityConnection.keys;
      const candidate = yield* keys.prepare(
        owner.actor,
        organization.id,
        connection.id,
        connection.revision,
      );
      const started = yield* keys.test(
        owner.actor,
        organization.id,
        connection.id,
        candidate.id,
        connection.revision,
      );
      yield* keys.retire(
        owner.actor,
        organization.id,
        connection.id,
        candidate.id,
        connection.revision,
      );
      expect(
        yield* completeTestSaml(connection.id, started, owner.actor).pipe(Effect.flip),
      ).toMatchObject({ code: "KEY_UNAVAILABLE" });
      const replacement = yield* keys.prepare(
        owner.actor,
        organization.id,
        connection.id,
        connection.revision,
      );
      yield* TestClock.adjust("8 days");
      yield* repository.auth.identityConnectionKey.expirePending();
      expect(yield* repository.auth.identityConnectionKey.find(replacement.id)).toMatchObject({
        status: "retired",
        privateKeyCiphertext: null,
      });
    }),
  );
  it.effect("queues one expiry notice per certificate and exposes observed health", () =>
    Effect.gen(function* () {
      yield* (yield* TestDatabase).reset;
      const application = yield* Application;
      const repository = yield* DatabaseRepository;
      const { owner, organization } = yield* createTestOrganization;
      const connection = yield* configureTestSaml(owner.actor, organization.id);
      yield* TestClock.adjust("340 days");
      const fresh = yield* signInTestUser(owner.actor.user.email);
      yield* application.auth.connectionMaintenance();
      yield* application.auth.connectionMaintenance();
      const history = yield* repository.audit.event.list({
        organizationId: organization.id,
        eventType: "auth.connection_certificate_expiring",
        limit: 10,
      });
      expect(history).toHaveLength(1);
      const health = yield* application.organization.identityConnection.health(
        fresh.actor,
        organization.id,
        connection.id,
      );
      expect(health).toMatchObject({
        approved: true,
        certificates: [
          { role: "sp", status: "expiring", expiresAt: expect.anything() },
          { role: "idp", status: "invalid" },
        ],
      });
      const certificateExpiry = health.certificates[0]?.expiresAt;
      if (certificateExpiry === undefined || certificateExpiry === null)
        throw new Error("Expected SP certificate expiry");
      expect(DateTime.toEpochMillis(certificateExpiry)).toBeGreaterThan(
        DateTime.toEpochMillis(yield* DateTime.now),
      );
    }),
  );
});
