import { NodeHttpServer } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import type { Database } from "@usepreface/database";

import type { ServerConfig } from "#/config";
import { DocumentationRoutes } from "#/http/documentation";
import { RequestLimits } from "#/http/middleware/limits";
import { makeRequestPolicy } from "#/http/middleware/request-policy";
import { SessionAuthenticationLive } from "#/http/middleware/session-authentication";
import { SetupProtectionLive } from "#/http/middleware/setup-protection";
import { EmailSignInRoutes } from "#/http/routes/email-sign-in";
import { HealthRoutes } from "#/http/routes/health";
import { InstanceSetupRoutes } from "#/http/routes/instance-setup";
import { OrganizationMembersRoutes } from "#/http/routes/organization-members";
import { OrganizationOwnershipRoutes } from "#/http/routes/organization-ownership";
import { OrganizationRoleBindingsRoutes } from "#/http/routes/organization-role-bindings";
import { OrganizationRolesRoutes } from "#/http/routes/organization-roles";
import { OrganizationsRoutes, InstanceCapabilitiesRoutes } from "#/http/routes/organizations";
import { SessionRoutes } from "#/http/routes/session";
import { SessionsRoutes } from "#/http/routes/sessions";

const ProductRoutes = HttpApiBuilder.layer(PrefaceApi, { openapiPath: "/api/openapi.json" }).pipe(
  Layer.provide(
    Layer.mergeAll(
      InstanceSetupRoutes,
      SessionRoutes,
      EmailSignInRoutes,
      SessionsRoutes,
      OrganizationsRoutes,
      InstanceCapabilitiesRoutes,
      OrganizationMembersRoutes,
      OrganizationRolesRoutes,
      OrganizationRoleBindingsRoutes,
      OrganizationOwnershipRoutes,
    ).pipe(Layer.provideMerge(Layer.mergeAll(SessionAuthenticationLive, SetupProtectionLive))),
  ),
);

const makeHttpApplication = Effect.gen(function* () {
  const context = yield* Effect.context<Database | ServerConfig>();
  const policy = yield* makeRequestPolicy;
  const routes = yield* HttpRouter.toHttpEffect(
    Layer.mergeAll(ProductRoutes, DocumentationRoutes, HealthRoutes),
  ).pipe(
    Effect.provideService(HttpRouter.RouterConfig, {
      ignoreDuplicateSlashes: false,
      ignoreTrailingSlash: false,
    }),
  );
  return { handle: policy(routes).pipe(Effect.provideContext(context)) } as const;
});

export class HttpApplication extends Context.Service<
  HttpApplication,
  Effect.Success<typeof makeHttpApplication>
>()("@usepreface/server/http/HttpApplication") {
  static readonly layer = Layer.effect(HttpApplication, makeHttpApplication).pipe(
    Layer.provide(RequestLimits.layer),
    Layer.provide(NodeHttpServer.layerHttpServices),
  );
}
