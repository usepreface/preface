import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { DatabaseRepository } from "@usepreface/database";

import { completeTestSetup, createSignedInTestUser } from "../../fixtures/authenticated-user.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("organization HTTP boundary", (it) => {
  it.effect(
    "creates the first organization through the typed contract and enforces protected lifecycle operations",
    () =>
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
        expect(yield* api.instanceCapabilities.get()).toEqual({ isInstanceOwner: true });
        const [created, response] = yield* api.organizations.get({
          responseMode: "decoded-and-response",
        });
        expect(response.status).toBe(200);
        expect(created.organization).toMatchObject({
          metadata: { name: "Knowledge" },
        });
        expect(Object.keys(created.organization)).not.toContain("createdByUserId");
        expect(created.access.isOwner).toBe(true);

        expect(
          (yield* api.organizations.update({ payload: { metadata: { name: "Updated" } } })).metadata
            .name,
        ).toBe("Updated");
        expect((yield* api.organizations.authPolicy({})).allowedMethods).toEqual([
          "email_code",
          "email_link",
        ]);
        expect((yield* api.organizationMembers.list({ query: {} })).members[0]?.id).toBe(
          created.membership.id,
        );
        expect(
          yield* api.organizationMembers.leave({ payload: {} }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
        const role = yield* api.organizationRoles.create({
          payload: { key: "reviewer", name: "Reviewer", permissions: ["organization.read"] },
        });
        yield* api.organizationRoles.update({
          params: { roleId: role.id },
          payload: { name: "Reviewer Updated" },
        });
        const binding = yield* api.organizationRoleBindings.grant({
          payload: { memberId: created.membership.id, roleId: role.id },
        });
        expect(Object.keys(binding)).not.toContain("tokenHash");
        yield* api.organizationRoleBindings.revoke({ params: { bindingId: binding.id } });
        yield* api.organizationRoles.archive({ params: { roleId: role.id } });
        expect(
          (yield* api.organizationRoles.list({ query: { includeArchived: true } })).roles.find(
            (candidate) => candidate.id === role.id,
          )?.archivedAt,
        ).not.toBeNull();
        const preflight = yield* (yield* HttpClient.HttpClient).execute(
          HttpClientRequest.options("/api/v1/organization").pipe(
            HttpClientRequest.setHeaders({
              origin: "https://preface.example.test",
              "access-control-request-method": "PATCH",
              "access-control-request-headers": "content-type",
            }),
          ),
        );
        expect(preflight.headers["access-control-allow-methods"]).toContain("PATCH");
      }),
  );

  it.effect(
    "keeps instance and organization authority distinct across membership, owner grant and transfer",
    () =>
      Effect.gen(function* () {
        const owner = yield* completeTestSetup;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const created = yield* application.organization.organization.get(
          owner.actor,
          yield* application.organization.organization.currentId(),
        );
        const colleague = yield* createSignedInTestUser("colleague@example.test");
        const member = yield* repository.organization.member.create({
          organizationId: created.organization.id,
          userId: colleague.actor.user.id,
        });
        const memberRole = yield* repository.organization.role.findByKey(
          created.organization.id,
          "member",
        );
        if (memberRole === undefined) throw new Error("Expected member role");
        yield* application.organization.roleBinding.grant(owner.actor, created.organization.id, {
          memberId: member.id,
          roleId: memberRole.id,
        });
        const ownerApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_session=${Redacted.value(owner.sessionToken)}`,
              }),
            ),
        });
        const memberApi = yield* HttpApiClient.make(PrefaceApi, {
          transformClient: (client) =>
            HttpClient.mapRequest(
              client,
              HttpClientRequest.setHeaders({
                origin: "https://preface.example.test",
                cookie: `preface_session=${Redacted.value(colleague.sessionToken)}`,
              }),
            ),
        });

        expect(yield* memberApi.instanceCapabilities.get()).toEqual({
          isInstanceOwner: false,
        });
        yield* ownerApi.organizationMembers.suspend({
          params: { memberId: member.id },
          payload: {},
        });
        expect(yield* memberApi.organizations.get({}).pipe(Effect.flip)).toMatchObject({
          _tag: "OrganizationError",
          code: "ORGANIZATION_NOT_FOUND",
        });
        yield* ownerApi.organizationMembers.reinstate({
          params: { memberId: member.id },
          payload: {},
        });
        yield* ownerApi.organizationOwnership.grant({
          params: { memberId: member.id },
          payload: {},
        });
        expect((yield* memberApi.organizations.access({})).isOwner).toBe(true);
        yield* ownerApi.organizationOwnership.revoke({ params: { memberId: member.id } });
        expect((yield* memberApi.organizations.access({})).isOwner).toBe(false);
        yield* ownerApi.organizationOwnership.transfer({ payload: { targetMemberId: member.id } });
        expect((yield* memberApi.organizations.access({})).isOwner).toBe(true);
        expect((yield* ownerApi.organizations.access({})).isOwner).toBe(false);
        yield* memberApi.organizationMembers.remove({
          params: { memberId: created.membership.id },
        });
        expect(yield* ownerApi.organizations.get({}).pipe(Effect.flip)).toMatchObject({
          _tag: "OrganizationError",
          code: "ORGANIZATION_NOT_FOUND",
        });
      }),
  );
});
