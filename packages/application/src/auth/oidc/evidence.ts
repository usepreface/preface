import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { Account, OidcConnection } from "@usepreface/protocol/model";
export const makeOidcEvidence = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.auth.oidc.recordEvidence")(function* (
    actor: SessionActor,
    account: Account,
    connection: OidcConnection,
  ) {
    yield* repository.auth.sessionAuthentication.create({
      sessionId: actor.session.id,
      userId: actor.user.id,
      method: "oidc",
      userEmailId: null,
      accountId: account.id,
      connectionRevision: connection.revision,
      authenticatedAt: yield* DateTime.now,
      expiresAt: actor.session.expiresAt,
      assurance: { version: 1, provider: "oidc" },
    });
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: actor.user.id,
      organizationId: connection.organizationId,
      eventType: "auth.session_authenticated",
      targetType: "session",
      targetId: actor.session.id,
      metadata: {
        method: "oidc",
        accountId: account.id,
        connectionRevision: connection.revision,
      },
    });
  });
});
