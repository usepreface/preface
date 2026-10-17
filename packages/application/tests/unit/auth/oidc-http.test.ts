import { Effect } from "effect";

import { describe, expect, it } from "vitest";

import { NodeOidcHttp, OidcHttp } from "../../../src/node/oidc/http.js";

describe("OIDC outbound destinations", () => {
  it("rejects literal and encoded private addresses before any connection", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const http = yield* OidcHttp;
        yield* Effect.promise(async () => {
          await expect(http.checkUrl("https://127.0.0.1/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
          await expect(http.checkUrl("https://2130706433/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
          await expect(http.checkUrl("https://[::ffff:127.0.0.1]/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
          await expect(http.checkUrl("https://169.254.169.254/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
        });
      }).pipe(Effect.provide(NodeOidcHttp.layer())),
    );
  });
  it("permits an operator-approved private origin without permitting another port or insecure scheme", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const http = yield* OidcHttp;
        yield* Effect.promise(async () => {
          await expect(http.checkUrl("https://127.0.0.1:9443/token")).resolves.toBeUndefined();
          await expect(http.checkUrl("https://127.0.0.1:9444/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
          await expect(http.checkUrl("http://127.0.0.1:9443/token")).rejects.toMatchObject({
            code: "UNSAFE_PROVIDER_URL",
          });
        });
      }).pipe(Effect.provide(NodeOidcHttp.layer(["https://127.0.0.1:9443"]))),
    );
  });
});
