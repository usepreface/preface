import { createServer } from "node:http";

import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";

import { ServerConfig } from "#/config";
import { HttpApplication } from "#/http/application";
import { BackendLive } from "#/runtime";
import { Startup } from "#/startup";

// The listener Layer is constructed only after routes and committed startup preparation are ready.
export const Server = Layer.unwrap(
  Effect.gen(function* () {
    yield* Startup;
    const config = yield* ServerConfig;
    const application = yield* HttpApplication;

    return HttpServer.serve(application.handle).pipe(
      HttpServer.withLogAddress,
      Layer.provide(
        NodeHttpServer.layerServer(
          () =>
            createServer({
              maxHeaderSize: 16 * 1024,
              headersTimeout: 10_000,
              requestTimeout: 15_000,
              connectionsCheckingInterval: 1_000,
              keepAliveTimeout: 5_000,
            }),
          { host: config.host, port: config.port, gracefulShutdownTimeout: "15 seconds" },
        ),
      ),
    );
  }),
).pipe(Layer.provide(Layer.mergeAll(Startup.layer, HttpApplication.layer)));

export const ServerLive = Server.pipe(Layer.provide(BackendLive));
