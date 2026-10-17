import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { Account, IdentityConnection } from "@usepreface/protocol/model";
export const makeGoogleEvidence = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.auth.google.recordEvidence")(function* (
    actor: SessionActor,
    account: Account,
    connection: IdentityConnection,
  ) {
    yield* repository.auth.sessionAuthentication.create({
      sessionId: actor.session.id,
      userId: actor.user.id,
      method: "google",
      userEmailId: null,
      accountId: account.id,
      connectionRevision: connection.revision,
      authenticatedAt: yield* DateTime.now,
      expiresAt: actor.session.expiresAt,
      assurance: { version: 1, provider: "google" },
    });
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: actor.user.id,
      eventType: "auth.session_authenticated",
      targetType: "session",
      targetId: actor.session.id,
      metadata: {
        method: "google",
        accountId: account.id,
        connectionRevision: connection.revision,
      },
    });
  });
});
