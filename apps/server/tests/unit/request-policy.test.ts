import { expect, layer } from "@effect/vitest";
import { Clock, ConfigProvider, Effect, Fiber, Logger } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/http";
import { TestClock } from "effect/testing";

import { ServerConfig } from "../../src/config.js";
import { RequestLimits } from "../../src/http/middleware/limits.js";
import { makeRequestPolicy } from "../../src/http/middleware/request-policy.js";

layer(RequestLimits.layer)("request latency and access logging", (it) => {
  it.effect(
    "delays every development response, including rejections, health and CORS preflights",
    () =>
      Effect.gen(function* () {
        const policy = yield* makeRequestPolicy.pipe(
          Effect.provide(ServerConfig.layer),
          Effect.provide(
            ConfigProvider.layer(
              ConfigProvider.fromUnknown({
                PUBLIC_URL: "http://localhost:8080",
                NODE_ENV: "development",
              }),
            ),
          ),
        );
        const application = Effect.succeed(HttpServerResponse.empty({ status: 200 }));
        const success = yield* Effect.forkChild(
          policy(application).pipe(
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(new Request("http://localhost:8080/api/docs")),
            ),
          ),
        );
        const health = yield* Effect.forkChild(
          policy(application).pipe(
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(new Request("http://localhost:8080/health/live")),
            ),
          ),
        );
        const rejected = yield* Effect.forkChild(
          policy(application).pipe(
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(
                new Request("http://localhost:8080/api/v1/auth/session", { method: "DELETE" }),
              ),
            ),
          ),
        );
        const preflight = yield* Effect.forkChild(
          policy(application).pipe(
            Effect.provideService(
              HttpServerRequest.HttpServerRequest,
              HttpServerRequest.fromWeb(
                new Request("http://localhost:8080/api/v1/auth/session", {
                  method: "OPTIONS",
                  headers: {
                    origin: "http://localhost:8080",
                    "access-control-request-method": "DELETE",
                  },
                }),
              ),
            ),
          ),
        );

        yield* TestClock.adjust("299 millis");
        expect(success.pollUnsafe()).toBeUndefined();
        expect(health.pollUnsafe()).toBeUndefined();
        expect(rejected.pollUnsafe()).toBeUndefined();
        expect(preflight.pollUnsafe()).toBeUndefined();

        yield* TestClock.adjust("1 milli");
        expect((yield* Fiber.join(success)).status).toBe(200);
        expect((yield* Fiber.join(health)).status).toBe(200);
        expect((yield* Fiber.join(rejected)).status).toBe(403);
        expect((yield* Fiber.join(preflight)).status).toBe(204);
      }),
  );

  it.effect("serves production requests without artificial latency or routine access logs", () => {
    const messages: unknown[] = [];
    return Effect.gen(function* () {
      const policy = yield* makeRequestPolicy.pipe(
        Effect.provide(ServerConfig.layer),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              PUBLIC_URL: "http://localhost:8080",
              NODE_ENV: "production",
            }),
          ),
        ),
      );
      const startedAt = yield* Clock.currentTimeMillis;
      const response = yield* policy(
        Effect.succeed(HttpServerResponse.empty({ status: 200 })),
      ).pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          HttpServerRequest.fromWeb(new Request("http://localhost:8080/api/docs")),
        ),
      );
      const rejected = yield* policy(
        Effect.succeed(HttpServerResponse.empty({ status: 200 })),
      ).pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          HttpServerRequest.fromWeb(
            new Request("http://localhost:8080/api/v1/auth/session", { method: "DELETE" }),
          ),
        ),
      );

      expect(response.status).toBe(200);
      expect(response.headers["x-request-id"]).toBeDefined();
      expect(rejected.status).toBe(403);
      expect(yield* Clock.currentTimeMillis).toBe(startedAt);
      expect(messages).toEqual([]);
    }).pipe(Effect.provide(Logger.layer([Logger.make(({ message }) => messages.push(message))])));
  });
});
