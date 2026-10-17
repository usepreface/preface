import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";

import { makeOrganizationIdentityAccess } from "#/auth/organization-identity/access";

export const makeOidcAccess = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* makeOrganizationIdentityAccess;
  const requireConnection = Effect.fn("OidcAccess.requireConnection")(function* (
    organizationId: OrganizationId,
    connectionId: IdentityConnectionId,
    lock = false,
  ) {
    const previous = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      connectionId,
    );
    const connection =
      lock && previous !== undefined
        ? yield* repository.auth.identityConnection.lockById(connectionId)
        : previous;
    if (
      connection === undefined ||
      connection.provider !== "oidc" ||
      connection.organizationId !== organizationId
    )
      return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    return connection;
  });
  return { ...access, requireConnection };
});
