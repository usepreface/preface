import { expect, layer } from "@effect/vitest";
import { DateTime, Effect, Schema } from "effect";

import { AuditEvent, UserEmailAddress, Session, User } from "@usepreface/protocol/model";

import { Database, DatabaseRepository } from "../../../src/index.js";
import { TestDatabase } from "../../../src/testing/index.js";
import { RepositoryTestLayer } from "../../fixtures/database.js";

layer(RepositoryTestLayer)("auth persistence boundary", (it) => {
  it.effect(
    "round-trips protocol models through repositories and loads their related storage",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const database = yield* Database;
        const repository = yield* DatabaseRepository;
        yield* repository.instance.initialize();
        const now = yield* DateTime.now;
        const account = yield* repository.auth.user.create({
          metadata: { version: 1, name: "Preface Owner" },
        });
        const address = yield* repository.auth.userEmail.create({
          userId: account.id,
          email: "owner+preface@example.test",
          isPrimary: true,
          loginEnabled: true,
          verifiedAt: now,
        });
        const activeSession = yield* repository.auth.session.create({
          userId: account.id,
          tokenHash: "a".repeat(64),
          expiresAt: DateTime.add(now, { hours: 1 }),
        });
        const owner = yield* repository.instance.owner.grant({
          userId: account.id,
          grantSource: "bootstrap",
          grantedByUserId: null,
        });
        const event = yield* repository.audit.event.append({
          eventType: "instance.owner_granted",
          actorKind: "user",
          actorUserId: account.id,
          targetType: "instance_owner",
          targetId: owner.id,
          metadata: { grantSource: "bootstrap" },
        });

        const persisted = yield* database.query.user.findFirst({
          where: { id: { eq: account.id } },
          with: { emails: true, sessions: true, ownerGrants: true, auditEvents: true },
        });
        expect(Schema.decodeUnknownSync(User)(persisted)).toEqual(account);
        expect(Schema.decodeUnknownSync(UserEmailAddress)(persisted?.emails[0])).toEqual(address);
        expect(Schema.decodeUnknownSync(Session)(persisted?.sessions[0])).toEqual(activeSession);
        expect(Schema.decodeUnknownSync(AuditEvent)(persisted?.auditEvents[0])).toEqual(event);
        expect(address.verifiedAt).toEqual(now);
        expect(activeSession.expiresAt).toEqual(DateTime.add(now, { hours: 1 }));
        expect(event.occurredAt).toEqual(now);
        expect(persisted?.ownerGrants.map((grant) => grant.id)).toEqual([owner.id]);
        expect(yield* repository.auth.user.findById(account.id)).toEqual(account);
        expect(yield* repository.auth.userEmail.findActiveByEmail(address.email)).toEqual(address);
        expect(
          yield* repository.auth.session.findActiveByTokenHash(activeSession.tokenHash),
        ).toEqual(activeSession);
      }),
  );
});
