import { Effect, Layer, Redacted, Schema } from "effect";

import { IdentityError } from "@usepreface/protocol";
import { OidcConfiguration } from "@usepreface/protocol/model";
import * as oidc from "openid-client";

import { OidcIdentity, OidcIdentityClaims, type OidcClient } from "#/auth/oidc/provider";
import { NodeOidcHttp, OidcHttp } from "#/node/oidc/http";

const providerError = (error: unknown) => {
  const cause = error instanceof oidc.ClientError ? error.cause : error;
  if (error instanceof IdentityError) return error;
  if (cause instanceof IdentityError) return cause;
  const unavailable =
    cause instanceof TypeError ||
    (cause instanceof Error && ["AbortError", "TimeoutError"].includes(cause.name)) ||
    (cause instanceof Response && (cause.status >= 500 || cause.status === 429)) ||
    (error instanceof oidc.ResponseBodyError && (error.status >= 500 || error.status === 429));
  if (error instanceof oidc.ClientError && error.code === undefined && !unavailable) throw cause;
  if (
    !unavailable &&
    !(error instanceof oidc.ClientError) &&
    !(error instanceof oidc.ResponseBodyError) &&
    !(error instanceof oidc.AuthorizationResponseError) &&
    !(error instanceof oidc.WWWAuthenticateChallengeError)
  )
    throw error;
  return new IdentityError({ code: unavailable ? "PROVIDER_UNAVAILABLE" : "INVALID_FLOW" });
};

const makeOidcIdentity = Effect.gen(function* () {
  const http = yield* OidcHttp;
  // Public keys only; bounded and partitioned by exact issuer/JWKS URI. No credentials are cached.
  const keys = new Map<string, oidc.ExportedJWKSCache>();
  const configuration = (input: OidcClient, signal?: AbortSignal) => {
    const settings = input.configuration;
    const secret = Redacted.value(input.clientSecret);
    const config = new oidc.Configuration(
      {
        issuer: settings.issuer,
        authorization_endpoint: settings.metadata.authorizationEndpoint,
        token_endpoint: settings.metadata.tokenEndpoint,
        jwks_uri: settings.metadata.jwksUri,
        id_token_signing_alg_values_supported: ["RS256"],
        response_types_supported: ["code"],
      },
      settings.clientId,
      { id_token_signed_response_alg: "RS256" },
      settings.clientAuthenticationMethod === "client_secret_basic"
        ? oidc.ClientSecretBasic(secret)
        : oidc.ClientSecretPost(secret),
    );
    config.timeout = 10;
    config[oidc.customFetch] = (url, options) =>
      http.fetch(url, {
        ...options,
        ...(signal === undefined
          ? {}
          : { signal: AbortSignal.any([signal, ...(options.signal ? [options.signal] : [])]) }),
      });
    oidc.enableNonRepudiationChecks(config);
    return config;
  };
  return OidcIdentity.of({
    discover: Effect.fn("OidcIdentity.discover")(
      function* (input) {
        const metadata = yield* Effect.tryPromise({
          try: async (signal) => {
            const config = await oidc.discovery(
              new URL(input.issuer),
              input.clientId,
              undefined,
              undefined,
              {
                [oidc.customFetch]: (url, options) =>
                  http.fetch(url, {
                    ...options,
                    signal: AbortSignal.any([signal, ...(options.signal ? [options.signal] : [])]),
                  }),
                timeout: 10,
              },
            );
            const serverMetadata = config.serverMetadata();
            if (
              serverMetadata.issuer !== input.issuer ||
              !serverMetadata.authorization_endpoint ||
              !serverMetadata.token_endpoint ||
              !serverMetadata.jwks_uri
            )
              throw new IdentityError({ code: "INVALID_CONFIGURATION" });
            if (
              !serverMetadata.response_types_supported?.includes("code") ||
              !serverMetadata.code_challenge_methods_supported?.includes("S256") ||
              !serverMetadata.id_token_signing_alg_values_supported?.includes("RS256") ||
              !(
                serverMetadata.token_endpoint_auth_methods_supported ?? ["client_secret_basic"]
              ).includes(input.clientAuthenticationMethod)
            )
              throw new IdentityError({ code: "UNSUPPORTED_PROVIDER" });
            await Promise.all(
              [
                serverMetadata.authorization_endpoint,
                serverMetadata.token_endpoint,
                serverMetadata.jwks_uri,
              ].map(http.checkUrl),
            );
            return serverMetadata;
          },
          catch: (error) => {
            const mapped = providerError(error);
            return mapped.code === "INVALID_FLOW"
              ? new IdentityError({ code: "INVALID_CONFIGURATION" })
              : mapped;
          },
        });
        return yield* Schema.decodeUnknownEffect(OidcConfiguration)({
          ...input,
          version: 1,
          idTokenSigningAlgorithm: "RS256",
          metadata: {
            authorizationEndpoint: metadata.authorization_endpoint,
            tokenEndpoint: metadata.token_endpoint,
            jwksUri: metadata.jwks_uri,
          },
        }).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_CONFIGURATION" })));
      },
      Effect.timeoutOrElse({
        duration: "15 seconds",
        orElse: () => Effect.fail(new IdentityError({ code: "PROVIDER_UNAVAILABLE" })),
      }),
    ),
    authorizationUrl: Effect.fn("OidcIdentity.authorizationUrl")((input) =>
      Effect.try({
        try: () =>
          oidc.buildAuthorizationUrl(configuration(input), {
            redirect_uri: input.redirectUri,
            scope: "openid email",
            response_type: "code",
            state: Redacted.value(input.state),
            nonce: Redacted.value(input.nonce),
            code_challenge: input.codeChallenge,
            code_challenge_method: "S256",
            ...(input.reauthenticate ? { prompt: "login", max_age: "0" } : {}),
          }).href,
        catch: providerError,
      }),
    ),
    exchangeAndVerify: Effect.fn("OidcIdentity.exchangeAndVerify")(
      function* (input) {
        const claims = yield* Effect.tryPromise({
          try: async (signal) => {
            const config = configuration(input, signal);
            const cacheKey = JSON.stringify([
              input.configuration.issuer,
              input.configuration.metadata.jwksUri,
            ]);
            const cached = keys.get(cacheKey);
            if (cached !== undefined) oidc.setJwksCache(config, cached);
            const callback = new URL(input.redirectUri);
            callback.searchParams.set("code", Redacted.value(input.code));
            callback.searchParams.set("state", Redacted.value(input.state));
            const tokens = await oidc.authorizationCodeGrant(config, callback, {
              expectedState: Redacted.value(input.state),
              expectedNonce: Redacted.value(input.nonce),
              pkceCodeVerifier: Redacted.value(input.verifier),
              idTokenExpected: true,
              ...(input.reauthenticate ? { maxAge: 0 } : {}),
            });
            const cache = oidc.getJwksCache(config);
            if (cache !== undefined) {
              if (keys.size >= 100 && !keys.has(cacheKey)) {
                const oldest = keys.keys().next().value;
                if (oldest !== undefined) keys.delete(oldest);
              }
              keys.set(cacheKey, cache);
            }
            return tokens.claims();
          },
          catch: providerError,
        });
        return yield* Schema.decodeUnknownEffect(OidcIdentityClaims)({
          issuer: claims?.iss,
          subject: claims?.sub,
          email: claims?.email ?? null,
          emailVerified: claims?.email_verified ?? null,
        }).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
      },
      Effect.timeoutOrElse({
        duration: "15 seconds",
        orElse: () => Effect.fail(new IdentityError({ code: "PROVIDER_UNAVAILABLE" })),
      }),
    ),
  });
});
export const NodeOidcIdentity = {
  layerWithTransport: Layer.effect(OidcIdentity, makeOidcIdentity),
  layer: (allowedPrivateOrigins: readonly string[] = []) =>
    Layer.effect(OidcIdentity, makeOidcIdentity).pipe(
      Layer.provide(NodeOidcHttp.layer(allowedPrivateOrigins)),
    ),
};
