import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("Connection operations HTTP", (it) => {
  it.effect("encodes public health and key lifecycle without returning private material", () =>
    Effect.gen(function* () {
      const owner = yield* completeTestSetup;
      const api = yield* HttpApiClient.make(PrefaceApi, {
        transformClient: (client) =>
          HttpClient.mapRequest(
            client,
            HttpClientRequest.setHeaders({
              origin: "https://preface.example.test",
              cookie: `preface_session=${Redacted.value(owner.sessionToken)}`,
            }),
          ),
      });
      const { organization } = yield* api.organizations.create({
        payload: { metadata: { name: "Knowledge" }, slug: "knowledge" },
      });
      const connection = yield* api.organizationIdentityConnections.createSaml({
        params: { organizationId: organization.id },
        payload: { name: "Enterprise SAML" },
      });
      const params = { organizationId: organization.id, connectionId: connection.id };
      const health = yield* api.connectionOperations.health({ params });
      expect(health).toMatchObject({
        status: "draft",
        approved: false,
        certificates: [{ role: "sp", status: "valid" }],
      });
      const key = yield* api.connectionOperations.prepare({
        params,
        payload: { expectedRevision: connection.revision },
      });
      expect(key).not.toHaveProperty("privateKeyCiphertext");
      expect(key.certificate).not.toContain("PRIVATE KEY");
      expect(
        (yield* api.connectionOperations.keys({ params })).keys.map((value) => value.id),
      ).toEqual([key.id]);
      const keyParams = { ...params, keyId: key.id };
      expect(
        yield* api.connectionOperations
          .activate({ params: keyParams, payload: { expectedRevision: connection.revision } })
          .pipe(Effect.flip),
      ).toMatchObject({ code: "KEY_NOT_TESTED" });
      expect(
        yield* api.connectionOperations.retire({
          params: keyParams,
          payload: { expectedRevision: connection.revision },
        }),
      ).toMatchObject({ status: "retired" });
    }),
  );
});
