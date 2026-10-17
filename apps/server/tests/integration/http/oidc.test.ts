import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { makeBackendTestLayer } from "../../fixtures/backend.js";
import { makeHttpTestLayer } from "../../fixtures/http.js";
import { HttpOidcProvider } from "../../fixtures/oidc-provider.js";

layer(makeHttpTestLayer(makeBackendTestLayer(HttpOidcProvider)), { excludeTestServices: true })(
  "Organization OIDC HTTP",
  (it) => {
    it.effect(
      "configures, tests and links through cookie-bound callbacks, then issues the normal session cookie on sign-in",
      () =>
        Effect.gen(function* () {
          const owner = yield* completeTestSetup;
          const ownerCookie = `preface_session=${Redacted.value(owner.sessionToken)}`;
          const api = yield* HttpApiClient.make(PrefaceApi, {
            transformClient: (client) =>
              HttpClient.mapRequest(
                client,
                HttpClientRequest.setHeaders({
                  origin: "https://preface.example.test",
                  cookie: ownerCookie,
                }),
              ),
          });
          const created = yield* api.organizations.create({
            payload: { metadata: { name: "Knowledge" }, slug: "knowledge" },
          });
          const organizationId = created.organization.id;
          const configuration = yield* api.organizationIdentityConnections.create({
            params: { organizationId },
            payload: {
              name: "Company",
              issuer: "https://identity.example.test",
              clientId: "preface-client",
              clientSecret: "owner-secret",
              clientAuthenticationMethod: "client_secret_basic",
            },
          });
          expect(JSON.stringify(configuration)).not.toContain("owner-secret");
          const params = { organizationId, connectionId: configuration.id };
          const [test, testing] = yield* api.organizationIdentityConnections.test({
            params,
            payload: { expectedRevision: configuration.revision },
            responseMode: "decoded-and-response",
          });
          const testCookie = testing.cookies.cookies.preface_oidc_flow?.value;
          if (testCookie === undefined) throw new Error("Expected OIDC test cookie");
          expect(testing.headers["set-cookie"]).toContain("HttpOnly");
          expect(testing.headers["set-cookie"]).toContain("SameSite=Lax");
          expect(
            yield* api.oidc
              .callback({
                query: {
                  state: new URL(test.authorizationUrl).searchParams.get("state") ?? "",
                  code: "code",
                },
              })
              .pipe(Effect.flip),
          ).toMatchObject({ code: "INVALID_FLOW" });
          const http = HttpClient.transformResponse(yield* HttpClient.HttpClient, (response) =>
            response.pipe(
              Effect.provideService(FetchHttpClient.RequestInit, { redirect: "manual" }),
            ),
          );
          const tested = yield* http.execute(
            HttpClientRequest.get("/api/v1/auth/oidc/callback").pipe(
              HttpClientRequest.setUrlParams({
                state: new URL(test.authorizationUrl).searchParams.get("state") ?? "",
                code: "code",
              }),
              HttpClientRequest.setHeader(
                "cookie",
                `${ownerCookie}; preface_oidc_flow=${testCookie}`,
              ),
            ),
          );
          expect(tested.status).toBe(303);
          expect(tested.headers.location).toBe("/api/docs");
          yield* api.organizationIdentityConnections.activate({
            params,
            payload: { expectedRevision: configuration.revision },
          });
          yield* api.authenticationPolicy.update({
            params: { organizationId },
            payload: { expectedRevision: 1, oidcConnectionIds: [configuration.id] },
          });
          const [link, linking] = yield* api.organizationIdentityConnections.link({
            params,
            payload: {},
            responseMode: "decoded-and-response",
          });
          const linked = yield* http.execute(
            HttpClientRequest.get("/api/v1/auth/oidc/callback").pipe(
              HttpClientRequest.setUrlParams({
                state: new URL(link.authorizationUrl).searchParams.get("state") ?? "",
                code: "code",
              }),
              HttpClientRequest.setHeader(
                "cookie",
                `${ownerCookie}; preface_oidc_flow=${linking.cookies.cookies.preface_oidc_flow?.value}`,
              ),
            ),
          );
          expect(linked.status).toBe(303);
          expect((yield* api.accounts.list()).accounts[0]?.provider).toBe("oidc");
          const signedOut = yield* HttpApiClient.make(PrefaceApi, {
            transformClient: (client) =>
              HttpClient.mapRequest(
                client,
                HttpClientRequest.setHeader("origin", "https://preface.example.test"),
              ),
          });
          const [start, starting] = yield* signedOut.oidc.start({
            params,
            payload: {},
            responseMode: "decoded-and-response",
          });
          const login = yield* http.execute(
            HttpClientRequest.get("/api/v1/auth/oidc/callback").pipe(
              HttpClientRequest.setUrlParams({
                state: new URL(start.authorizationUrl).searchParams.get("state") ?? "",
                code: "code",
              }),
              HttpClientRequest.setHeader(
                "cookie",
                `preface_oidc_flow=${starting.cookies.cookies.preface_oidc_flow?.value}`,
              ),
            ),
          );
          expect(login.status).toBe(303);
          const sessionCookie = login.cookies.cookies.preface_session;
          if (sessionCookie === undefined)
            throw new Error("Expected session cookie after OIDC sign-in");
          const current = yield* http.execute(
            HttpClientRequest.get("/api/v1/auth/session").pipe(
              HttpClientRequest.setHeader("cookie", `preface_session=${sessionCookie.value}`),
            ),
          );
          expect(current.status).toBe(200);
          expect(JSON.stringify(yield* current.json)).not.toContain(sessionCookie.value);
        }),
    );
  },
);
