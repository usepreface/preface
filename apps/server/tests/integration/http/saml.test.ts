import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { NodeCertificateCrypto } from "@usepreface/crypto/node";

import { makeSamlIssuer } from "../../../../../packages/application/tests/fixtures/saml-issuer.js";
import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { HttpTestLayer } from "../../fixtures/http.js";
import { readSamlStart } from "../../fixtures/saml-start.js";

layer(HttpTestLayer, { excludeTestServices: true })("SAML HTTP", (it) => {
  it.effect(
    "accepts signed cross-site form posts and authenticates only after a cookie-bound completion",
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
        const organization = (yield* api.organizations.create({
          payload: { metadata: { name: "Knowledge" }, slug: "knowledge" },
        })).organization;
        const issuer = yield* makeSamlIssuer.pipe(Effect.provide(NodeCertificateCrypto.layer));
        const created = yield* api.organizationIdentityConnections.createSaml({
          params: { organizationId: organization.id },
          payload: { name: "Company SAML" },
        });
        const params = { organizationId: organization.id, connectionId: created.id };
        if (issuer.configuration.idp === null) throw new Error("Expected IdP configuration");
        const configured = yield* api.organizationIdentityConnections.updateSaml({
          params,
          payload: { expectedRevision: created.revision, idp: issuer.configuration.idp },
        });
        const metadata = yield* api.saml.metadata({ params });
        expect(metadata).toContain(configured.configuration.entityId);
        expect(metadata).not.toContain("PRIVATE KEY");
        const http = HttpClient.transformResponse(yield* HttpClient.HttpClient, (response) =>
          response.pipe(Effect.provideService(FetchHttpClient.RequestInit, { redirect: "manual" })),
        );
        const [start, starting] = yield* api.organizationIdentityConnections.test({
          params,
          payload: { expectedRevision: configured.revision },
          responseMode: "decoded-and-response",
        });
        expect(starting.headers["set-cookie"]).toContain("SameSite=Lax");
        const { requestId, relayState } = readSamlStart(start.authorizationUrl);
        const payload = {
          RelayState: relayState,
          SAMLResponse: Redacted.value(
            issuer.response(requestId, { serviceProvider: configured.configuration }),
          ),
        };
        const acs = new URL(configured.configuration.callbackUrl).pathname;
        const duplicate = yield* http.execute(
          HttpClientRequest.post(acs).pipe(
            HttpClientRequest.bodyUrlParams([
              ["RelayState", payload.RelayState],
              ["SAMLResponse", payload.SAMLResponse],
              ["SAMLResponse", payload.SAMLResponse],
            ]),
          ),
        );
        expect(duplicate.status).toBe(400);
        const oversized = yield* http.execute(
          HttpClientRequest.post(acs).pipe(
            HttpClientRequest.bodyText(
              "x".repeat(256 * 1024 + 1),
              "application/x-www-form-urlencoded",
            ),
          ),
        );
        expect(oversized.status).toBe(413);
        const posted = yield* http.execute(
          HttpClientRequest.post(acs).pipe(
            HttpClientRequest.setHeader("origin", "https://saml.example.test"),
            HttpClientRequest.bodyUrlParams(payload),
          ),
        );
        expect(posted.status).toBe(303);
        expect(posted.cookies.cookies.preface_session).toBeUndefined();
        const completion = posted.headers.location;
        if (completion === undefined) throw new Error("Expected completion redirect");
        const missingBrowser = yield* http.execute(
          HttpClientRequest.get(completion).pipe(
            HttpClientRequest.setHeader("cookie", ownerCookie),
          ),
        );
        expect(missingBrowser.status).toBe(401);
        const completed = yield* http.execute(
          HttpClientRequest.get(completion).pipe(
            HttpClientRequest.setHeader(
              "cookie",
              `${ownerCookie}; preface_saml_flow=${starting.cookies.cookies.preface_saml_flow?.value}`,
            ),
          ),
        );
        expect(completed.status).toBe(303);
        expect(completed.headers.location).toBe("/api/docs");
        expect(completed.cookies.cookies.preface_session).toBeUndefined();
        expect((yield* api.accounts.list()).accounts).toEqual([]);
        yield* api.organizationIdentityConnections.activate({
          params,
          payload: { expectedRevision: configured.revision },
        });
        yield* api.authenticationPolicy.update({
          params: { organizationId: organization.id },
          payload: { expectedRevision: 1, samlConnectionIds: [created.id] },
        });

        const [link, linking] = yield* api.organizationIdentityConnections.link({
          params,
          payload: {},
          responseMode: "decoded-and-response",
        });
        const linkRequest = readSamlStart(link.authorizationUrl);
        const linkPost = yield* http.execute(
          HttpClientRequest.post(acs).pipe(
            HttpClientRequest.bodyUrlParams({
              RelayState: linkRequest.relayState,
              SAMLResponse: Redacted.value(
                issuer.response(linkRequest.requestId, {
                  serviceProvider: configured.configuration,
                }),
              ),
            }),
          ),
        );
        expect(linkPost.status).toBe(303);
        if (linkPost.headers.location === undefined) throw new Error("Expected link completion");
        const linked = yield* http.execute(
          HttpClientRequest.get(linkPost.headers.location).pipe(
            HttpClientRequest.setHeader(
              "cookie",
              `${ownerCookie}; preface_saml_flow=${linking.cookies.cookies.preface_saml_flow?.value}`,
            ),
          ),
        );
        expect(linked.status).toBe(303);
        expect((yield* api.accounts.list()).accounts[0]?.provider).toBe("saml");

        const loggingIn = yield* http.execute(
          HttpClientRequest.get(
            `/api/v1/organizations/${organization.id}/identity-connections/${created.id}/saml/login`,
          ),
        );
        expect(loggingIn.status).toBe(303);
        if (loggingIn.headers.location === undefined) throw new Error("Expected SP login redirect");
        const loginRequest = readSamlStart(loggingIn.headers.location);
        const loginPayload = {
          RelayState: loginRequest.relayState,
          SAMLResponse: Redacted.value(
            issuer.response(loginRequest.requestId, { serviceProvider: configured.configuration }),
          ),
        };
        const loginPost = yield* http.execute(
          HttpClientRequest.post(acs).pipe(HttpClientRequest.bodyUrlParams(loginPayload)),
        );
        if (loginPost.headers.location === undefined)
          throw new Error("Expected sign-in completion");
        const loggedIn = yield* http.execute(
          HttpClientRequest.get(loginPost.headers.location).pipe(
            HttpClientRequest.setHeader(
              "cookie",
              `preface_saml_flow=${loggingIn.cookies.cookies.preface_saml_flow?.value}`,
            ),
          ),
        );
        expect(loggedIn.status).toBe(303);
        const session = loggedIn.cookies.cookies.preface_session;
        expect(session?.options?.sameSite).toBe("lax");
        if (!session) throw new Error("Expected normal session cookie");
        const current = yield* http.execute(
          HttpClientRequest.get("/api/v1/auth/session").pipe(
            HttpClientRequest.setHeader("cookie", `preface_session=${session.value}`),
          ),
        );
        expect(current.status).toBe(200);
        const replay = yield* http.execute(
          HttpClientRequest.post(acs).pipe(HttpClientRequest.bodyUrlParams(loginPayload)),
        );
        expect(replay.status).toBe(401);
        const json = yield* http.execute(
          HttpClientRequest.post(acs).pipe(HttpClientRequest.bodyJsonUnsafe(loginPayload)),
        );
        expect(json.status).toBe(415);
      }),
  );
});
