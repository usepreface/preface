import { NodeHttpServer } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import { HttpServer } from "effect/http";

import { HttpApplication } from "../../src/http/application.js";
import { BackendTestLayer } from "./backend.js";

export const makeHttpTestLayer = (backend: typeof BackendTestLayer = BackendTestLayer) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const application = yield* HttpApplication;
      return HttpServer.serve(application.handle);
    }),
  ).pipe(
    Layer.provideMerge(HttpApplication.layer.pipe(Layer.provideMerge(backend))),
    Layer.provideMerge(NodeHttpServer.layerTest),
  );

export const HttpTestLayer = makeHttpTestLayer();
