import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";

export const makeAuthenticationDiscovery = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("Application.auth.discover")(function* () {
    const organization = yield* repository.organization.organization.find();
    if (organization === undefined) return { email: true, google: false, connections: [] };
    const policy = yield* repository.organization.authPolicy.findByOrganizationId(organization.id);
    if (policy === undefined)
      return yield* Effect.die(new Error("Organization has no authentication policy"));
    const google = yield* repository.auth.identityConnection.findGoogle();
    const approved = yield* repository.organization.authPolicyConnection.listByOrganization(
      organization.id,
    );
    const available = yield* repository.auth.identityConnection.listByOrganization(organization.id);
    return {
      email: true,
      google:
        policy.ssoMode === "optional" &&
        policy.allowedMethods.includes("google") &&
        google?.status === "active",
      connections: available
        .filter(
          (connection) =>
            connection.status === "active" &&
            approved.some((entry) => entry.identityConnectionId === connection.id),
        )
        .map((connection) => ({
          connectionId: connection.id,
          provider: connection.provider,
          name: connection.name,
        })),
    };
  });
});
