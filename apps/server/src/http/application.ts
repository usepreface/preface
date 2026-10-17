import { NodeHttpServer } from "@effect/platform-node";
import { Context, Effect, Layer } from "effect";
import { HttpRouter } from "effect/http";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import type { Database } from "@usepreface/database";

import { ServerConfig } from "#/config";
import { DocumentationRoutes } from "#/http/documentation";
import { RequestLimits } from "#/http/middleware/limits";
import { makeRequestPolicy } from "#/http/middleware/request-policy";
import { SessionAuthenticationLive } from "#/http/middleware/session-authentication";
import { SetupProtectionLive } from "#/http/middleware/setup-protection";
import { HealthRoutes } from "#/http/routes/health";
import { InstanceSetupRoutes } from "#/http/routes/instance-setup";
import { SessionRoutes } from "#/http/routes/session";

const ProductRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return HttpApiBuilder.layer(
      PrefaceApi,
      config.docsEnabled ? { openapiPath: "/api/openapi.json" } : undefined,
    ).pipe(
      Layer.provide(
        Layer.mergeAll(InstanceSetupRoutes, SessionRoutes).pipe(
          Layer.provideMerge(Layer.mergeAll(SessionAuthenticationLive, SetupProtectionLive)),
        ),
      ),
    );
  }),
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
