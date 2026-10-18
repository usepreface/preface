import { Effect, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import { AuthenticationDiscoveryInput } from "@usepreface/protocol/input";

export const makeAuthenticationDiscovery = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.auth.discover")(function* (input: AuthenticationDiscoveryInput) {
    const decoded = yield* Schema.decodeUnknownEffect(Schema.toType(AuthenticationDiscoveryInput))(
      input,
    ).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_INPUT" })));
    const google = yield* repository.auth.identityConnection.findGoogle();
    const explicit =
      decoded.organizationSlug === undefined
        ? undefined
        : yield* repository.organization.organization.findBySlug(decoded.organizationSlug);
    const domains =
      decoded.organizationSlug === undefined
        ? yield* repository.organization.domain.discover(
            decoded.email.slice(decoded.email.lastIndexOf("@") + 1),
          )
        : [];
    const organizationIds =
      explicit === undefined
        ? [...new Set(domains.map((entry) => entry.organizationId))]
        : [explicit.id];
    const connections: {
      readonly organizationId: OrganizationId;
      readonly connectionId: IdentityConnectionId;
      readonly provider: "oidc" | "saml";
      readonly name: string;
    }[] = [];
    let email = true;
    let googleAvailable = google?.status === "active";
    // Domain discovery is independent of account existence or private membership lists.
    if (domains.length <= 50)
      for (const organizationId of organizationIds) {
        const organization = yield* repository.organization.organization.findById(organizationId);
        if (organization === undefined || organization.archivedAt !== null) continue;
        const policy =
          yield* repository.organization.authPolicy.findByOrganizationId(organizationId);
        if (policy === undefined) continue;
        if (explicit !== undefined) {
          email = policy.ssoMode !== "required";
          googleAvailable = googleAvailable && email && policy.allowedMethods.includes("google");
        }
        const approved =
          yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
        const available =
          yield* repository.auth.identityConnection.listByOrganization(organizationId);
        for (const connection of available) {
          if (
            connection.status !== "active" ||
            !approved.some((entry) => entry.identityConnectionId === connection.id)
          )
            continue;
          const trusted =
            explicit !== undefined ||
            (yield* repository.organization.domain.forConnection(
              organizationId,
              connection.id,
              connection.revision,
            )).some(
              (entry) => entry.domain === decoded.email.slice(decoded.email.lastIndexOf("@") + 1),
            );
          if (trusted)
            connections.push({
              organizationId,
              connectionId: connection.id,
              provider: connection.provider,
              name: explicit === undefined ? "Single sign-on" : connection.name,
            });
        }
      }
    return {
      email,
      google: googleAvailable,
      connections,
      requiresOrganizationSelection:
        new Set(connections.map((entry) => entry.organizationId)).size > 1,
    };
  });
});
