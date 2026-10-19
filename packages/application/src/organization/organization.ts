import { Effect, Schema } from "effect";

import { DatabaseRepository, TransactionService } from "@usepreface/database";
import { OrganizationError, type OrganizationId } from "@usepreface/protocol";
import type { SessionActor, OrganizationDetail } from "@usepreface/protocol/dto";
import { UpdateOrganizationInput } from "@usepreface/protocol/input";

import { OrganizationAccess } from "#/organization/access";
import { organizationAuthPolicyView } from "#/organization/authentication/views";
import { publicAccess, publicMember, publicOrganization } from "#/organization/views";
import { mergeOrganizationMetadata } from "#/profile/metadata";

export const makeOrganizationApplication = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const access = yield* OrganizationAccess;
  const capabilities = Effect.fn("Application.instance.capabilities.get")(function* (
    actor: SessionActor,
  ) {
    yield* access.requireActor(actor);
    const owner = yield* repository.instance.owner.findActiveByUserId(actor.user.id);
    return {
      isInstanceOwner: owner !== undefined,
    };
  });
  const currentId = Effect.fn("Application.organization.currentId")(function* () {
    const organization = yield* repository.organization.organization.find();
    if (organization === undefined)
      return yield* new OrganizationError({ code: "ORGANIZATION_NOT_FOUND" });
    return organization.id;
  });
  const get = Effect.fn("Application.organization.organization.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const resolved = yield* access.requirePermissions(actor, organizationId, ["organization.read"]);
    return {
      organization: publicOrganization(resolved.organization),
      membership: publicMember(resolved.member, resolved.user.metadata, resolved.roles),
      access: publicAccess(resolved),
    } satisfies OrganizationDetail;
  });
  const update = Effect.fn("Application.organization.organization.update")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    input: UpdateOrganizationInput,
  ) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(UpdateOrganizationInput))(
      input,
    ).pipe(Effect.mapError(() => new OrganizationError({ code: "INVALID_INPUT" })));
    return yield* transaction.run(
      Effect.gen(function* () {
        const resolved = yield* access.requirePermissions(
          actor,
          organizationId,
          ["organization.update"],
          { lock: true },
        );
        const organization = yield* repository.organization.organization.update(organizationId, {
          metadata: mergeOrganizationMetadata(resolved.organization.metadata, decoded.metadata),
        });
        if (organization === undefined)
          return yield* Effect.die(new Error("Locked organization update returned no row"));
        yield* repository.audit.event.append({
          organizationId,
          actorKind: "user",
          actorUserId: actor.user.id,
          eventType: "organization.updated",
          targetType: "organization",
          targetId: organizationId,
          metadata: { name: organization.metadata.name },
        });
        return publicOrganization(organization);
      }),
    );
  });
  const getAccess = Effect.fn("Application.organization.organization.getAccess")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    return publicAccess(yield* access.requireMember(actor, organizationId));
  });
  const getAuthPolicy = Effect.fn("Application.organization.authPolicy.get")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
  ) {
    const { policy } = yield* access.requirePermissions(actor, organizationId, [
      "organization.read",
    ]);
    const ids = (yield* repository.organization.authPolicyConnection.listByOrganization(
      organizationId,
    )).map((entry) => entry.identityConnectionId);
    const connections =
      yield* repository.auth.identityConnection.listByOrganization(organizationId);
    return organizationAuthPolicyView(
      policy,
      ids.filter((id) =>
        connections.some((connection) => connection.id === id && connection.provider === "oidc"),
      ),
      ids.filter((id) =>
        connections.some((connection) => connection.id === id && connection.provider === "saml"),
      ),
    );
  });
  return {
    organization: { currentId, get, update, getAccess },
    capabilities: { get: capabilities },
    authPolicy: { get: getAuthPolicy },
  } as const;
});
