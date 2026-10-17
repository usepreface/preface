import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Schema } from "effect";

import { PasswordCredential, Session } from "@usepreface/protocol/model";

import { Database, InstanceRepository } from "../../../src/index.js";
import { auditEvent } from "../../../src/schema/audit/index.js";
import { passwordCredential, session } from "../../../src/schema/auth/index.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { InstanceTestLayer } from "../../fixtures/database.js";
import { createTestUser } from "../../fixtures/user.js";

layer(InstanceTestLayer)("auth persistence boundary", (it) => {
  it.effect(
    "loads the account's credentials, session, ownership and audit history through real relations",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const database = yield* Database;
        const repository = yield* InstanceRepository;
        const initialized = yield* repository.initialize();
        const account = yield* createTestUser();
        const createdAt = DateTime.toDateUtc(yield* DateTime.now);
        const expiresAt = DateTime.toDateUtc(DateTime.add(yield* DateTime.now, { hours: 1 }));

        yield* database.insert(passwordCredential).values({
          userId: account.id,
          passwordHash: "encoded-test-hash",
          createdAt,
          passwordChangedAt: createdAt,
        });
        yield* database.insert(session).values({
          userId: account.id,
          tokenHash: "a".repeat(64),
          createdAt,
          lastSeenAt: createdAt,
          expiresAt,
        });
        const owner = yield* repository.owner.grant({
          userId: account.id,
          grantSource: "bootstrap",
          grantedByUserId: null,
        });
        yield* database.insert(auditEvent).values({
          eventType: "instance.bootstrap_completed",
          actorKind: "user",
          actorUserId: account.id,
          targetType: "installation",
          targetId: initialized.installation.installationId,
          occurredAt: createdAt,
        });

        const persisted = yield* database.query.user.findFirst({
          where: { id: { eq: account.id } },
          with: { passwordCredential: true, sessions: true, ownerGrants: true, auditEvents: true },
        });
        const credential = Schema.decodeUnknownSync(PasswordCredential)(
          persisted?.passwordCredential,
        );
        const activeSession = Schema.decodeUnknownSync(Session)(persisted?.sessions[0]);

        expect(DateTime.toEpochMillis(credential.passwordChangedAt)).toBe(createdAt.getTime());
        expect(DateTime.toEpochMillis(activeSession.expiresAt)).toBe(expiresAt.getTime());
        expect(persisted?.ownerGrants.map((grant) => grant.id)).toEqual([owner.id]);
        expect(persisted?.auditEvents.map((event) => event.actorUserId)).toEqual([account.id]);
      }),
  );
});
