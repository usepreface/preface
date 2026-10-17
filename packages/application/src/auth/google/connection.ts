import { DateTime, Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService, generateUuid7 } from "@usepreface/database";
import { IdentityConnectionId, IdentityError } from "@usepreface/protocol";
import type { SessionActor } from "@usepreface/protocol/dto";
import { SaveGoogleConnectionInput } from "@usepreface/protocol/input";

import { makeIdentitySecrets } from "#/auth/google/secrets";
import { makeIdentityAccess } from "#/auth/identity-access";
import { AuthenticationLinks } from "#/auth/links";
import { OrganizationAccess } from "#/organization/access";
import { isInstallationAuthentication } from "#/security/authentication-method";

export const makeGoogleConnectionApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* makeIdentityAccess;
  const actors = yield* OrganizationAccess;
  const secrets = yield* makeIdentitySecrets;
  const links = yield* AuthenticationLinks;
  const view = Effect.fn("GoogleConnection.view")(function* () {
    const connection = yield* repository.auth.identityConnection.findGoogle();
    return {
      id: connection?.id ?? null,
      name: connection?.name ?? "Google",
      status: connection?.status ?? null,
      revision: connection?.revision ?? 0,
      configuration: connection?.configuration ?? null,
      hasClientSecret: connection !== undefined,
      callbackUrl: new URL("/api/v1/auth/google/callback", links.publicOrigin).href,
      testedRevision: connection?.testedRevision ?? null,
      testedAt: connection?.testedAt ?? null,
    };
  });
  const get = Effect.fn("Application.instance.authentication.google.get")(function* (
    actor: SessionActor,
  ) {
    const { evidence } = yield* actors.requireActor(actor);
    if (!evidence.some((proof) => isInstallationAuthentication(proof.method)))
      return yield* new IdentityError({ code: "REAUTHENTICATION_REQUIRED" });
    if ((yield* repository.instance.owner.findActiveByUserId(actor.user.id)) === undefined)
      return yield* new IdentityError({ code: "FORBIDDEN" });
    return yield* view();
  });
  const save = Effect.fn("Application.instance.authentication.google.save")(function* (
    actor: SessionActor,
    input: SaveGoogleConnectionInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(SaveGoogleConnectionInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.instance.installation.lock();
        yield* access.requireInstanceOwner(actor);
        const previous = yield* repository.auth.identityConnection.findGoogle();
        const current =
          previous === undefined
            ? undefined
            : yield* repository.auth.identityConnection.lockById(previous.id);
        if (decoded.expectedRevision !== (current?.revision ?? 0))
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        const secret =
          decoded.clientSecret ??
          (current === undefined ? undefined : yield* secrets.decryptConnection(current));
        if (secret === undefined) return yield* new IdentityError({ code: "INVALID_INPUT" });
        const now = yield* DateTime.now;
        const id = current?.id ?? Schema.decodeSync(IdentityConnectionId)(generateUuid7());
        const revision = (current?.revision ?? 0) + 1;
        const next = {
          id,
          installationId: 1 as const,
          provider: "google" as const,
          name: decoded.name ?? current?.name ?? "Google",
          status: "draft" as const,
          revision,
          configuration: { version: 1 as const, clientId: decoded.clientId },
          secretsCiphertext: yield* secrets.encryptConnection(id, revision, secret),
          testedRevision: null,
          testedAt: null,
          createdAt: current?.createdAt ?? now,
          updatedAt: now,
        };
        if (current === undefined) yield* repository.auth.identityConnection.createGoogle(next);
        else {
          yield* repository.auth.identityConnection.update(next, current.revision);
          yield* repository.auth.authFlow.revokeByConnection(id);
          yield* repository.auth.sessionAuthentication.revokeByConnection(id);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "auth.connection_configured",
          targetType: "identity_connection",
          targetId: id,
          metadata: { revision },
        });
        return yield* view();
      }),
    );
  });
  const change = Effect.fn("Application.instance.authentication.google.change")(function* (
    actor: SessionActor,
    expectedRevision: number,
    action: "activate" | "disable",
  ) {
    return yield* transaction.run(
      Effect.gen(function* () {
        yield* repository.instance.installation.lock();
        yield* access.requireInstanceOwner(actor);
        const previous = yield* repository.auth.identityConnection.findGoogle();
        if (previous === undefined)
          return yield* new IdentityError({ code: "CONNECTION_UNAVAILABLE" });
        const current = yield* repository.auth.identityConnection.lockById(previous.id);
        if (current === undefined || current.revision !== expectedRevision)
          return yield* new IdentityError({ code: "REVISION_CONFLICT" });
        if (action === "activate" && current.status === "active") return yield* view();
        if (action === "disable" && current.status === "disabled") return yield* view();
        if (
          action === "activate" &&
          (current.status !== "tested" || current.testedRevision !== current.revision)
        )
          return yield* new IdentityError({ code: "CONNECTION_NOT_TESTED" });
        const next =
          action === "activate"
            ? { ...current, status: "active" as const, updatedAt: yield* DateTime.now }
            : {
                ...current,
                status: "disabled" as const,
                revision: current.revision + 1,
                testedRevision: null,
                testedAt: null,
                updatedAt: yield* DateTime.now,
                secretsCiphertext: yield* secrets.encryptConnection(
                  current.id,
                  current.revision + 1,
                  yield* secrets.decryptConnection(current),
                ),
              };
        yield* repository.auth.identityConnection.update(next, current.revision);
        if (action === "disable") {
          yield* repository.auth.authFlow.revokeByConnection(current.id);
          yield* repository.auth.sessionAuthentication.revokeByConnection(current.id);
        }
        yield* repository.audit.event.append({
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType:
            action === "activate" ? "auth.connection_activated" : "auth.connection_disabled",
          targetType: "identity_connection",
          targetId: current.id,
          metadata: { revision: next.revision },
        });
        return yield* view();
      }),
    );
  });
  return {
    get,
    save,
    activate: (actor: SessionActor, revision: number) => change(actor, revision, "activate"),
    disable: (actor: SessionActor, revision: number) => change(actor, revision, "disable"),
  };
});
