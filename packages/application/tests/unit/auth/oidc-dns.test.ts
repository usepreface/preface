import type { LookupAddress } from "node:dns";

import { Effect } from "effect";

import { afterEach, describe, expect, it, vi } from "vitest";

import { NodeOidcHttp, OidcHttp } from "../../../src/node/oidc/http.js";

const lookupAddresses = vi.hoisted(() =>
  vi.fn<(hostname: string, options: { all: true; verbatim: true }) => Promise<LookupAddress[]>>(),
);
vi.mock("node:dns/promises", () => ({ lookup: lookupAddresses }));
afterEach(() => vi.resetAllMocks());
describe("OIDC DNS validation", () => {
  it("revalidates DNS on the actual request after a previously public address changes to private", async () => {
    lookupAddresses
      .mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await Effect.runPromise(
      Effect.gen(function* () {
        const http = yield* OidcHttp;
        yield* Effect.promise(async () => {
          await http.checkUrl("https://identity.example.test/token");
          await expect(
            http.fetch("https://identity.example.test/token", {
              method: "GET",
              headers: {},
              body: undefined,
              redirect: "manual",
            }),
          ).rejects.toMatchObject({ code: "UNSAFE_PROVIDER_URL" });
        });
      }).pipe(Effect.provide(NodeOidcHttp.layer())),
    );
    expect(lookupAddresses).toHaveBeenCalledTimes(2);
  });
});
