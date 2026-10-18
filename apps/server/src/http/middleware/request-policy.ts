import { randomUUID } from "node:crypto";

import { ByteSize, Effect } from "effect";
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
  const routePaths = new Set<string>([
    ...Object.values(PrefaceApi.groups).flatMap((group) =>
      Object.values(group.endpoints).map((endpoint) => endpoint.path),
    ),
    "/api/docs",
    "/api/openapi.json",
    "/health/live",
    "/health/ready",
  ]);
  const routeTemplates = [...routePaths].map((path) => ({ path, segments: path.split("/") }));
  const cors = HttpMiddleware.cors({
    allowedOrigins: (origin) => config.allowedOrigins.has(origin),
    allowedMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    exposedHeaders: ["X-Request-Id", "Retry-After"],
    credentials: true,
    maxAge: 600,
  });

  return <E, R>(httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>) =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const requestId = randomUUID();

      if (config.isDevelopment) yield* Effect.sleep("300 millis");

      const path = request.url.split(/[?#]/, 1)[0] ?? "/";
      const segments = path.split("/");
      const routeName =
        routeTemplates.find(
          (template) =>
            template.segments.length === segments.length &&
            template.segments.every((segment, index) =>
              segment.startsWith(":") ? segments[index] !== "" : segment === segments[index],
            ),
        )?.path ?? "unmatched";

      const samlCallback =
        request.method === "POST" && routeName === "/api/v1/auth/saml/:connectionId/acs";
      const maximumRequestBytes = samlCallback ? 256 * 1024 : maximumBodyBytes;
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

        if (!samlCallback && !permitsMutation(request, config.allowedOrigins))
          return requestErrorResponse("FORBIDDEN");

        const contentLength = request.headers["content-length"];
        if (contentLength !== undefined && Number(contentLength) > maximumRequestBytes)
          return requestErrorResponse("PAYLOAD_TOO_LARGE");
        if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
          const contentType = request.headers["content-type"]
            ?.split(";", 1)[0]
            ?.trim()
            .toLowerCase();
          if (
            contentType !==
              (samlCallback ? "application/x-www-form-urlencoded" : "application/json") ||
            (request.headers["content-encoding"] !== undefined &&
              request.headers["content-encoding"] !== "identity")
          ) {
            return requestErrorResponse("UNSUPPORTED_MEDIA_TYPE");
          }
        }

        return yield* httpEffect;
      }).pipe(
        Effect.provideService(HttpIncomingMessage.MaxBodySize, ByteSize.bytes(maximumRequestBytes)),
        Effect.timeoutOrElse({
          duration: "30 seconds",
          orElse: () => Effect.succeed(requestErrorResponse("REQUEST_TIMEOUT")),
        }),
        Effect.catchCause(respondToCause),
      );

      const result = yield* cors(guarded);
      const response =
        result.status === 429 && result.headers["retry-after"] === undefined
          ? HttpServerResponse.setHeader(result, "retry-after", "60")
          : result;

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
