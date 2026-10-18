import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

import { completeTestSetup, createSignedInTestUser } from "../../fixtures/authenticated-user.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("Audit HTTP boundary", (it) => {
  it.effect("encodes scoped history and exports through the public contract", () =>
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
      const created = yield* api.organizations.create({
        payload: { metadata: { name: "Knowledge" }, slug: "knowledge" },
      });
      const params = { organizationId: created.organization.id };
      const history = yield* api.audit.organization({
        params,
        query: { limit: 1, eventType: "organization.created" },
      });
      expect(history.events[0]?.organizationId).toBe(params.organizationId);
      expect(history.events[0]?.eventType).toBe("organization.created");
      expect(history.nextCursor).toBeNull();
      expect((yield* api.audit.exportOrganization({ params, query: {} })).content).toContain(
        "organization.created",
      );
      const instance = yield* api.audit.instance({ query: {} });
      expect(instance.events.some((event) => event.eventType === "organization.created")).toBe(
        false,
      );
      const outsider = yield* createSignedInTestUser("outsider@example.test");
      const denied = yield* HttpApiClient.make(PrefaceApi, {
        transformClient: (client) =>
          HttpClient.mapRequest(
            client,
            HttpClientRequest.setHeader(
              "cookie",
              `preface_session=${Redacted.value(outsider.sessionToken)}`,
            ),
          ),
      });
      expect(
        yield* denied.audit.organization({ params, query: {} }).pipe(Effect.flip),
      ).toMatchObject({ code: "ORGANIZATION_NOT_FOUND" });
    }),
  );
});
