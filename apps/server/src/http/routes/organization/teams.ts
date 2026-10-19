import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi, CurrentActor } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { CreateTeamInput, UpdateTeamInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";
export const TeamsRoutes = HttpApiBuilder.group(PrefaceApi, "teams", (handlers) =>
  Effect.gen(function* () {
    const teams = (yield* Application).organization.team;
    return handlers.handleAll({
      create: Effect.fn("http.teams.create")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(CreateTeamInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* teams
          .create(yield* CurrentActor, yield* currentOrganizationId, input)
          .pipe(mapInfrastructureError);
      }),
      list: Effect.fn("http.teams.list")(function* ({ query }) {
        return yield* teams
          .list(yield* CurrentActor, yield* currentOrganizationId, query)
          .pipe(mapInfrastructureError);
      }),
      get: Effect.fn("http.teams.get")(function* ({ params }) {
        return yield* teams
          .get(yield* CurrentActor, yield* currentOrganizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      update: Effect.fn("http.teams.update")(function* ({ params, payload }) {
        const input = yield* Schema.decodeUnknownEffect(UpdateTeamInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* teams
          .update(yield* CurrentActor, yield* currentOrganizationId, params.teamId, input)
          .pipe(mapInfrastructureError);
      }),
      archive: Effect.fn("http.teams.archive")(function* ({ params }) {
        return yield* teams
          .archive(yield* CurrentActor, yield* currentOrganizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      access: Effect.fn("http.teams.access")(function* ({ params }) {
        return yield* teams
          .getAccess(yield* CurrentActor, yield* currentOrganizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      roles: Effect.fn("http.teams.roles")(function* ({ params, query }) {
        return yield* teams
          .listRoles(yield* CurrentActor, yield* currentOrganizationId, params.teamId, query)
          .pipe(mapInfrastructureError);
      }),
      members: Effect.fn("http.teams.members")(function* ({ params, query }) {
        return yield* teams.member
          .list(yield* CurrentActor, yield* currentOrganizationId, params.teamId, query)
          .pipe(mapInfrastructureError);
      }),
      addMember: Effect.fn("http.teams.addMember")(function* ({ params }) {
        return yield* teams.member
          .add(yield* CurrentActor, yield* currentOrganizationId, params.teamId, params.memberId)
          .pipe(mapInfrastructureError);
      }),
      removeMember: Effect.fn("http.teams.removeMember")(function* ({ params }) {
        return yield* teams.member
          .remove(yield* CurrentActor, yield* currentOrganizationId, params.teamId, params.memberId)
          .pipe(mapInfrastructureError);
      }),
    });
  }),
);
