import { Effect } from "effect";

import { describe, expect, it } from "vitest";

import { NodeOidcHttp, OidcHttp } from "../../../src/node/oidc/http.js";
import { acquireOidcHttps } from "../../fixtures/oidc-https.js";

describe("OIDC HTTPS transport", () => {
  it("verifies TLS and sends the intended body while rejecting redirects and oversized responses", async () => {
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const issuer = yield* acquireOidcHttps;
          yield* Effect.gen(function* () {
            const http = yield* OidcHttp;
            yield* Effect.promise(async () => {
              const response = await http.fetch(`${issuer.origin}/token`, {
                method: "POST",
                headers: {
                  authorization: "Basic fixture",
                  "content-type": "application/x-www-form-urlencoded",
                },
                redirect: "manual",
                body: new URLSearchParams({ code: "fixture-code" }),
              });
              expect(await response.json()).toEqual({ accepted: true });
              expect(issuer.requests).toEqual([
                { authorization: "Basic fixture", body: "code=fixture-code" },
              ]);
              await expect(
                http.fetch(`${issuer.origin}/redirect`, {
                  method: "GET",
                  headers: {},
                  body: undefined,
                  redirect: "manual",
                }),
              ).rejects.toMatchObject({ code: "UNSAFE_PROVIDER_URL" });
              await expect(
                http.fetch(`${issuer.origin}/oversized`, {
                  method: "GET",
                  headers: {},
                  body: undefined,
                  redirect: "manual",
                }),
              ).rejects.toMatchObject({ code: "INVALID_CONFIGURATION" });
            });
          }).pipe(Effect.provide(NodeOidcHttp.layer([issuer.origin])));
        }),
      ),
    );
  });
});
