import { Effect, type DateTime } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import type { AuthFlow, IdentityConnection } from "@usepreface/protocol/model";

import { isPendingKeyUsable } from "#/auth/saml/keys";
import { OrganizationAccess } from "#/organization/access";

export const makeConnectionTestCompletion = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const actors = yield* OrganizationAccess;

  // The caller holds the connection/organization locks and owns the completion transaction.
  return Effect.fn("ExternalIdentity.completeConnectionTest")(function* (
    flow: AuthFlow,
    connection: IdentityConnection,
    actor: SessionActor,
    now: DateTime.Utc,
  ) {
    yield* actors.requireOwner(actor, connection.organizationId);
    if (flow.signingKeyId !== null) {
      const key = yield* repository.auth.identityConnectionKey.find(flow.signingKeyId, true);
      if (
        connection.provider !== "saml" ||
        key?.identityConnectionId !== connection.id ||
        !isPendingKeyUsable(key, connection.revision, now)
      )
        return yield* new IdentityError({ code: "KEY_UNAVAILABLE" });
      yield* repository.auth.identityConnectionKey.update({ ...key, testedAt: now });
      yield* repository.audit.event.append({
        actorKind: "user",
        actorUserId: actor.user.id,
        organizationId: connection.organizationId,
        eventType: "auth.connection_key_tested",
        targetType: "identity_connection_key",
        targetId: key.id,
        metadata: { connectionId: connection.id, revision: connection.revision },
      });
    } else {
      yield* repository.auth.identityConnection.update(
        {
          ...connection,
          status: connection.status === "active" ? "active" : "tested",
          testedRevision: connection.revision,
          testedAt: now,
          updatedAt: now,
        },
        connection.revision,
      );
    }
    if ((yield* repository.auth.authFlow.consume(flow.id)) === undefined)
      return yield* new IdentityError({ code: "INVALID_FLOW" });
    if (flow.signingKeyId === null)
      yield* repository.audit.event.append({
        actorKind: "user",
        actorUserId: actor.user.id,
        ...(connection.organizationId ? { organizationId: connection.organizationId } : {}),
        eventType: "auth.connection_tested",
        targetType: "identity_connection",
        targetId: connection.id,
        metadata: { revision: connection.revision },
      });
  });
});
