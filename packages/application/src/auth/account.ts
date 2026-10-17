import { Effect } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { IdentityError, type AccountId } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";

import { makeIdentityAccess } from "#/auth/identity-access";
import { OrganizationAccess } from "#/organization/access";
export const makeAccountApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* makeIdentityAccess;
  const actors = yield* OrganizationAccess;
  const list = Effect.fn("Application.auth.account.list")(function* (actor: SessionActor) {
    yield* actors.requireActor(actor);
    const accounts = yield* repository.auth.account.listByUserId(actor.user.id);
    const summaries = [];
    for (const account of accounts) {
      const connection = yield* repository.auth.identityConnection.findById(
        account.identityConnectionId,
      );
      if (connection === undefined) continue;
      const member =
        connection.provider === "oidc"
          ? yield* repository.organization.member.findByUserId(
              connection.organizationId,
              actor.user.id,
            )
          : undefined;
      const organization =
        connection.provider === "oidc"
          ? yield* repository.organization.organization.findById(connection.organizationId)
          : undefined;
      summaries.push({
        id: account.id,
        provider: connection.provider,
        connectionId: connection.id,
        organizationId: connection.organizationId ?? null,
        providerEmail: account.providerEmail,
        providerEmailVerified: account.providerEmailVerified,
        connectionAvailable:
          connection.status === "active" &&
          (connection.provider === "google" ||
            (member !== undefined &&
              member.removedAt === null &&
              member.suspendedAt === null &&
              organization?.archivedAt === null)),
        linkedAt: account.createdAt,
        lastUsedAt: account.lastUsedAt,
        unlinkedAt: account.unlinkedAt,
      });
    }
    return { accounts: summaries };
  });
  const unlink = Effect.fn("Application.auth.account.unlink")(function* (
    actor: SessionActor,
    id: AccountId,
  ) {
    yield* transaction.run(
      Effect.gen(function* () {
        const previous = yield* repository.auth.account.findById(id);
        if (previous === undefined || previous.userId !== actor.user.id)
          return yield* new IdentityError({ code: "ACCOUNT_NOT_FOUND" });
        const connection = yield* repository.auth.identityConnection.lockById(
          previous.identityConnectionId,
        );
        yield* repository.auth.user.lockById(actor.user.id);
        yield* access.requireRecentEmail(actor);
        const account = yield* repository.auth.account.unlink(id, actor.user.id);
        if (account === undefined) return;
        yield* repository.auth.sessionAuthentication.revokeByAccount(id);
        yield* repository.auth.authFlow.revokeByUser(actor.user.id);
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          ...(connection?.organizationId ? { organizationId: connection.organizationId } : {}),
          eventType: "auth.account_unlinked",
          targetType: "account",
          targetId: id,
          metadata: { connectionId: account.identityConnectionId },
        });
      }),
    );
  });
  return { list, unlink };
});
