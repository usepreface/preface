import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi, CurrentActor } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { CreateTeamInput, UpdateTeamInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
export const TeamsRoutes = HttpApiBuilder.group(PrefaceApi, "teams", (handlers) =>
  Effect.gen(function* () {
    const teams = (yield* Application).organization.team;
    return handlers.handleAll({
      create: Effect.fn("http.teams.create")(function* ({ params, payload }) {
        const input = yield* Schema.decodeUnknownEffect(CreateTeamInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* teams
          .create(yield* CurrentActor, params.organizationId, input)
          .pipe(mapInfrastructureError);
      }),
      list: Effect.fn("http.teams.list")(function* ({ params, query }) {
        return yield* teams
          .list(yield* CurrentActor, params.organizationId, query)
          .pipe(mapInfrastructureError);
      }),
      get: Effect.fn("http.teams.get")(function* ({ params }) {
        return yield* teams
          .get(yield* CurrentActor, params.organizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      update: Effect.fn("http.teams.update")(function* ({ params, payload }) {
        const input = yield* Schema.decodeUnknownEffect(UpdateTeamInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* teams
          .update(yield* CurrentActor, params.organizationId, params.teamId, input)
          .pipe(mapInfrastructureError);
      }),
      archive: Effect.fn("http.teams.archive")(function* ({ params }) {
        return yield* teams
          .archive(yield* CurrentActor, params.organizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      access: Effect.fn("http.teams.access")(function* ({ params }) {
        return yield* teams
          .getAccess(yield* CurrentActor, params.organizationId, params.teamId)
          .pipe(mapInfrastructureError);
      }),
      roles: Effect.fn("http.teams.roles")(function* ({ params, query }) {
        return yield* teams
          .listRoles(yield* CurrentActor, params.organizationId, params.teamId, query)
          .pipe(mapInfrastructureError);
      }),
      members: Effect.fn("http.teams.members")(function* ({ params, query }) {
        return yield* teams.member
          .list(yield* CurrentActor, params.organizationId, params.teamId, query)
          .pipe(mapInfrastructureError);
      }),
      addMember: Effect.fn("http.teams.addMember")(function* ({ params }) {
        return yield* teams.member
          .add(yield* CurrentActor, params.organizationId, params.teamId, params.memberId)
          .pipe(mapInfrastructureError);
      }),
      removeMember: Effect.fn("http.teams.removeMember")(function* ({ params }) {
        return yield* teams.member
          .remove(yield* CurrentActor, params.organizationId, params.teamId, params.memberId)
          .pipe(mapInfrastructureError);
      }),
    });
  }),
);
