import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";

import { HttpApplication } from "../../src/http/application.js";
import { BackendTestLayer } from "./backend.js";

export const HttpTestLayer = Layer.unwrap(
  Effect.gen(function* () {
    const application = yield* HttpApplication;
    return HttpServer.serve(application.handle);
  }),
).pipe(
  Layer.provideMerge(HttpApplication.layer.pipe(Layer.provideMerge(BackendTestLayer))),
  Layer.provideMerge(NodeHttpServer.layerTest),
);
