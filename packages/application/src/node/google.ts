import { Effect, Layer, Redacted, Schema } from "effect";

import { IdentityError } from "@usepreface/protocol";
import * as oidc from "openid-client";

import { GoogleIdentity, GoogleIdentityClaims, type GoogleClient } from "#/auth/google/provider";

const configuration = (input: GoogleClient) => {
  const config = new oidc.Configuration(
    {
      issuer: "https://accounts.google.com",
      authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      token_endpoint: "https://oauth2.googleapis.com/token",
      jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
      id_token_signing_alg_values_supported: ["RS256"],
      response_types_supported: ["code"],
    },
    input.clientId,
    { client_secret: Redacted.value(input.clientSecret), id_token_signed_response_alg: "RS256" },
  );
  config.timeout = 10;
  // Verify signatures even on ID tokens received directly from the TLS token endpoint.
  oidc.enableNonRepudiationChecks(config);
  return config;
};
export const NodeGoogleIdentity = {
  layer: Layer.sync(GoogleIdentity, () => {
    // Only the fixed Google issuer's public signing keys are cached, never credentials.
    let jwksCache: oidc.ExportedJWKSCache | undefined;
    return GoogleIdentity.of({
      authorizationUrl: Effect.fn("GoogleIdentity.authorizationUrl")((input) =>
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
              prompt: "select_account",
            }).href,
          catch: () => new IdentityError({ code: "INVALID_INPUT" }),
        }),
      ),
      exchangeAndVerify: Effect.fn("GoogleIdentity.exchangeAndVerify")(
        function* (input) {
          const claims = yield* Effect.tryPromise({
            try: async (signal) => {
              const config = configuration(input);
              // The provider and all destinations are fixed; never follow credential-bearing redirects.
              config[oidc.customFetch] = (url, options) =>
                fetch(url, {
                  ...options,
                  body: options?.body ?? null,
                  redirect: "error",
                  signal: AbortSignal.any([signal, ...(options?.signal ? [options.signal] : [])]),
                });
              const callback = new URL(input.redirectUri);
              callback.searchParams.set("code", Redacted.value(input.code));
              callback.searchParams.set("state", Redacted.value(input.state));
              if (jwksCache !== undefined) oidc.setJwksCache(config, jwksCache);
              const tokens = await oidc.authorizationCodeGrant(config, callback, {
                expectedState: Redacted.value(input.state),
                expectedNonce: Redacted.value(input.nonce),
                pkceCodeVerifier: Redacted.value(input.verifier),
                idTokenExpected: true,
              });
              jwksCache = oidc.getJwksCache(config);
              return tokens.claims();
            },
            catch: (error) => {
              const cause = error instanceof oidc.ClientError ? error.cause : error;
              const unavailable =
                cause instanceof TypeError ||
                (cause instanceof Error &&
                  (cause.name === "AbortError" || cause.name === "TimeoutError")) ||
                (cause instanceof Response && (cause.status >= 500 || cause.status === 429)) ||
                (error instanceof oidc.ResponseBodyError &&
                  (error.status >= 500 || error.status === 429));
              return new IdentityError({
                code: unavailable ? "PROVIDER_UNAVAILABLE" : "INVALID_FLOW",
              });
            },
          });
          return yield* Schema.decodeUnknownEffect(GoogleIdentityClaims)({
            subject: claims?.sub,
            email: claims?.email ?? null,
            emailVerified: claims?.email_verified ?? null,
            hostedDomain: claims?.hd ?? null,
            validUntil: claims?.exp === undefined ? null : new Date(claims.exp * 1000),
          }).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
        },
        Effect.timeoutOrElse({
          duration: "15 seconds",
          orElse: () => Effect.fail(new IdentityError({ code: "PROVIDER_UNAVAILABLE" })),
        }),
      ),
    });
  }),
} as const;
