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
        expect(yield* api.instanceCapabilities.get()).toEqual({ canCreateOrganization: true });
        const [created, response] = yield* api.organizations.create({
          payload: { name: " Knowledge ", slug: " KNOWLEDGE " },
          responseMode: "decoded-and-response",
        });
        expect(response.status).toBe(201);
        expect(created.organization).toMatchObject({ name: "Knowledge", slug: "knowledge" });
        expect(Object.keys(created.organization)).not.toContain("createdByUserId");
        expect(created.access.isOwner).toBe(true);
        const params = { organizationId: created.organization.id };
        expect(
          (yield* api.organizations.list({ query: { limit: 1 } })).organizations.map(
            (org) => org.id,
          ),
        ).toEqual([created.organization.id]);
        expect(
          (yield* api.organizations.update({ params, payload: { name: "Updated" } })).name,
        ).toBe("Updated");
        expect((yield* api.organizations.authPolicy({ params })).allowedMethods).toEqual([
          "email_code",
          "email_link",
        ]);
        expect((yield* api.organizationMembers.list({ params, query: {} })).members[0]?.id).toBe(
          created.membership.id,
        );
        expect(
          yield* api.organizationMembers.leave({ params, payload: {} }).pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "LAST_OWNER" });
        const role = yield* api.organizationRoles.create({
          params,
          payload: { key: "reviewer", name: "Reviewer", permissions: ["organization.read"] },
        });
        yield* api.organizationRoles.update({
          params: { ...params, roleId: role.id },
          payload: { name: "Reviewer Updated" },
        });
        const binding = yield* api.organizationRoleBindings.grant({
          params,
          payload: { memberId: created.membership.id, roleId: role.id },
        });
        expect(Object.keys(binding)).not.toContain("tokenHash");
        yield* api.organizationRoleBindings.revoke({
          params: { ...params, bindingId: binding.id },
        });
        yield* api.organizationRoles.archive({ params: { ...params, roleId: role.id } });
        expect(
          (yield* api.organizationRoles.list({
            params,
            query: { includeArchived: true },
          })).roles.find((candidate) => candidate.id === role.id)?.archivedAt,
        ).not.toBeNull();
        yield* api.organizations.archive({ params, payload: {} });
        expect(yield* api.organizations.get({ params }).pipe(Effect.flip)).toMatchObject({
          _tag: "OrganizationError",
          code: "ORGANIZATION_ARCHIVED",
        });
        yield* api.organizations.restore({ params, payload: {} });
        expect((yield* api.organizations.get({ params })).organization.archivedAt).toBeNull();
        const preflight = yield* (yield* HttpClient.HttpClient).execute(
          HttpClientRequest.options(`/api/v1/organizations/${created.organization.id}`).pipe(
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
        const created = yield* application.organization.organization.create(owner.actor, {
          name: "Knowledge",
          slug: "knowledge",
        });
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
        const params = { organizationId: created.organization.id };
        expect(yield* memberApi.instanceCapabilities.get()).toEqual({
          canCreateOrganization: false,
        });
        expect(
          yield* memberApi.organizations
            .create({ payload: { name: "Forbidden", slug: "forbidden" } })
            .pipe(Effect.flip),
        ).toMatchObject({ _tag: "OrganizationError", code: "FORBIDDEN" });
        yield* ownerApi.organizationMembers.suspend({
          params: { ...params, memberId: member.id },
          payload: {},
        });
        expect(yield* memberApi.organizations.get({ params }).pipe(Effect.flip)).toMatchObject({
          _tag: "OrganizationError",
          code: "ORGANIZATION_NOT_FOUND",
        });
        yield* ownerApi.organizationMembers.reinstate({
          params: { ...params, memberId: member.id },
          payload: {},
        });
        yield* ownerApi.organizationOwnership.grant({
          params: { ...params, memberId: member.id },
          payload: {},
        });
        expect((yield* memberApi.organizations.access({ params })).isOwner).toBe(true);
        yield* ownerApi.organizationOwnership.revoke({
          params: { ...params, memberId: member.id },
        });
        expect((yield* memberApi.organizations.access({ params })).isOwner).toBe(false);
        yield* ownerApi.organizationOwnership.transfer({
          params,
          payload: { targetMemberId: member.id },
        });
        expect((yield* memberApi.organizations.access({ params })).isOwner).toBe(true);
        expect((yield* ownerApi.organizations.access({ params })).isOwner).toBe(false);
        yield* memberApi.organizationMembers.remove({
          params: { ...params, memberId: created.membership.id },
        });
        expect(yield* ownerApi.organizations.get({ params }).pipe(Effect.flip)).toMatchObject({
          _tag: "OrganizationError",
          code: "ORGANIZATION_NOT_FOUND",
        });
      }),
  );
});
