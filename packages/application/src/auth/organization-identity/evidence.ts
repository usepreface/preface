import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { Account, OrganizationIdentityConnection } from "@usepreface/protocol/model";
export const makeOrganizationIdentityEvidence = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("OrganizationIdentity.recordEvidence")(function* (
    actor: SessionActor,
    account: Account,
    connection: OrganizationIdentityConnection,
    providerAuthenticatedAt: DateTime.Utc | null,
    providerSessionExpiresAt: DateTime.Utc | null,
  ) {
    yield* repository.auth.sessionAuthentication.create({
      sessionId: actor.session.id,
      userId: actor.user.id,
      method: connection.provider,
      userEmailId: null,
      accountId: account.id,
      connectionRevision: connection.revision,
      authenticatedAt: yield* DateTime.now,
      providerAuthenticatedAt,
      expiresAt:
        providerSessionExpiresAt === null
          ? actor.session.expiresAt
          : DateTime.makeUnsafe(
              Math.min(
                DateTime.toEpochMillis(actor.session.expiresAt),
                DateTime.toEpochMillis(providerSessionExpiresAt),
              ),
            ),
      assurance: { version: 1, provider: connection.provider },
    });
    yield* repository.audit.event.append({
      actorKind: "user",
      actorUserId: actor.user.id,
      organizationId: connection.organizationId,
      eventType: "auth.session_authenticated",
      targetType: "session",
      targetId: actor.session.id,
      metadata: {
        method: connection.provider,
        accountId: account.id,
        connectionRevision: connection.revision,
      },
    });
  });
});
