import { randomUUID } from "node:crypto";

import { ByteSize, Clock, Effect } from "effect";
import {
  HttpIncomingMessage,
  HttpMiddleware,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";

import { PrefaceApi } from "@usepreface/api";

import { ServerConfig } from "#/config";
import { requestErrorResponse, respondToCause } from "#/http/errors";
import { clientAddress } from "#/http/middleware/client-address";
import { RequestLimits } from "#/http/middleware/limits";
import { permitsMutation } from "#/http/middleware/origin";

export const maximumBodyBytes = 32 * 1024;

export const makeRequestPolicy = Effect.gen(function* () {
  const config = yield* ServerConfig;
  const limits = yield* RequestLimits;
  const routePaths = new Set([
    ...Object.values(PrefaceApi.groups).flatMap((group) =>
      Object.values(group.endpoints).map((endpoint) => endpoint.path),
    ),
    "/api/docs",
    "/api/openapi.json",
    "/health/live",
    "/health/ready",
  ]);
  const cors = HttpMiddleware.cors({
    allowedOrigins: (origin) => config.allowedOrigins.has(origin),
    allowedMethods: ["GET", "HEAD", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: ["X-Request-Id", "Retry-After"],
    credentials: true,
    maxAge: 600,
  });

  return <E, R>(httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const requestId = randomUUID();
      const startedAt = yield* Clock.currentTimeMillis;
      const path = request.url.split(/[?#]/, 1)[0] ?? "/";

      const guarded = Effect.gen(function* () {
        const health = path === "/health/live" || path === "/health/ready";
        if (!health) {
          const address = clientAddress(request, config.trustedProxyNetworks);
          const retryAfter = yield* limits.check("global", address);
          if (retryAfter !== undefined)
            return HttpServerResponse.setHeader(
              requestErrorResponse("RATE_LIMITED"),
              "retry-after",
              String(retryAfter),
            );
        }

        if (!permitsMutation(request, config.allowedOrigins))
          return requestErrorResponse("FORBIDDEN");

        const contentLength = request.headers["content-length"];
        if (contentLength !== undefined && Number(contentLength) > maximumBodyBytes)
          return requestErrorResponse("PAYLOAD_TOO_LARGE");
        if (request.method === "POST") {
          const contentType = request.headers["content-type"]
            ?.split(";", 1)[0]
            ?.trim()
            .toLowerCase();
          if (
            contentType !== "application/json" ||
            (request.headers["content-encoding"] !== undefined &&
              request.headers["content-encoding"] !== "identity")
          ) {
            return requestErrorResponse("UNSUPPORTED_MEDIA_TYPE");
          }
        }

        return yield* httpEffect;
      }).pipe(
        Effect.provideService(HttpIncomingMessage.MaxBodySize, ByteSize.kibibytes(32)),
        Effect.timeoutOrElse({
          duration: "30 seconds",
          orElse: () => Effect.succeed(requestErrorResponse("REQUEST_TIMEOUT")),
        }),
        Effect.catchCause(respondToCause),
      );

      const response = yield* cors(guarded);
      const finishedAt = yield* Clock.currentTimeMillis;
      if (!path.startsWith("/health/")) {
        yield* Effect.logInfo("HTTP request", {
          requestId,
          method: request.method,
          route: routePaths.has(path) ? path : "unmatched",
          status: response.status,
          durationMs: finishedAt - startedAt,
        });
      }

      return HttpServerResponse.setHeaders(response, {
        "x-request-id": requestId,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "x-frame-options": "DENY",
        "content-security-policy":
          response.headers["content-security-policy"] ??
          "default-src 'none'; frame-ancestors 'none'",
        ...(config.secureCookies ? { "strict-transport-security": "max-age=31536000" } : {}),
      });
    });
});
