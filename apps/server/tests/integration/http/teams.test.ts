import { expect, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { HttpClient, HttpClientRequest } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

import { completeTestSetup } from "../../fixtures/authenticated-user.js";
import { HttpTestLayer } from "../../fixtures/http.js";

layer(HttpTestLayer, { excludeTestServices: true })("teams and profile HTTP contracts", (it) => {
  it.effect(
    "round-trips versioned metadata and scoped team roles through the authenticated typed client",
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
        const profile = yield* api.profile.update({
          payload: { metadata: { title: " Engineer ", bio: "Hello" } },
        });
        expect(profile.metadata.title).toBe("Engineer");
        expect((yield* api.profile.get()).metadata.version).toBe(1);
        const created = yield* api.organizations.create({
          payload: {
            metadata: { name: "Knowledge", description: "Shared knowledge" },
            slug: "knowledge",
          },
        });
        const organizationId = created.organization.id;
        const team = yield* api.teams.create({
          params: { organizationId },
          payload: {
            metadata: { name: " Engineering ", description: " Build " },
            slug: " ENGINEERING ",
          },
        });
        expect(team.metadata).toEqual({ version: 1, name: "Engineering", description: "Build" });
        const params = { organizationId, teamId: team.id };
        expect((yield* api.teams.access({ params })).permissions).toContain("team.roles.assign");
        expect(
          (yield* api.teams.roles({ params, query: {} })).roles.map((role) => role.scopeKind),
        ).toEqual(["team", "team"]);
        const role = yield* api.organizationRoles.create({
          params: { organizationId },
          payload: {
            scopeKind: "team",
            key: "team-editor",
            name: "Team editor",
            permissions: ["team.read", "team.update"],
          },
        });
        const grant = yield* api.organizationRoleBindings.grant({
          params: { organizationId },
          payload: {
            teamId: team.id,
            roleId: role.id,
            memberId: created.membership.id,
          },
        });
        expect(grant).toMatchObject({ scopeKind: "team", teamId: team.id });
        expect(
          (yield* api.teams.members({ params, query: {} })).members[0]?.roles.map(
            (assigned) => assigned.key,
          ),
        ).toContain("team-editor");
        expect(
          (yield* api.teams.update({ params, payload: { metadata: { description: null } } }))
            .metadata,
        ).toEqual({ version: 1, name: "Engineering" });
        yield* api.teams.archive({ params, payload: {} });
        expect(yield* api.teams.get({ params }).pipe(Effect.flip)).toMatchObject({
          _tag: "TeamError",
          code: "TEAM_ARCHIVED",
        });
      }),
  );
});
