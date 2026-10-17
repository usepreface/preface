import { Crypto, Effect, Layer, Predicate } from "effect";
import type { Types } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/http";
import { HttpApiScalar } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

import { ServerConfig } from "#/config";

const DocumentationPolicy = HttpRouter.middleware(
  Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto;
    let cached: HttpServerResponse.HttpServerResponse | undefined;

    return (httpEffect: Effect.Effect<HttpServerResponse.HttpServerResponse, Types.unhandled>) =>
      Effect.gen(function* () {
        if (cached !== undefined) return cached;
        const response = yield* httpEffect;
        if (!Predicate.isTagged(response.body, "Uint8Array")) return response;
        const html = new TextDecoder().decode(response.body.body);
        const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
        const hashes = yield* Effect.forEach(scripts, (script) =>
          crypto.digest("SHA-256", new TextEncoder().encode(script[1] ?? "")).pipe(
            Effect.map((bytes) => `'sha256-${Buffer.from(bytes).toString("base64")}'`),
            Effect.orDie,
          ),
        );

        cached = HttpServerResponse.setHeaders(response, {
          "x-robots-tag": "noindex, nofollow",
          // Scalar creates inline styles. Script execution is restricted to these exact bundled scripts.
          "content-security-policy": `default-src 'none'; script-src ${hashes.join(" ")}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
        });
        return cached;
      });
  }),
);

export const DocumentationRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* ServerConfig;
    return config.docsEnabled
      ? HttpApiScalar.layer(PrefaceApi, {
          path: "/api/docs",
          scalar: { withDefaultFonts: false, showOperationId: true, theme: "default" },
        }).pipe(Layer.provide(DocumentationPolicy.layer))
      : Layer.empty;
  }),
);
