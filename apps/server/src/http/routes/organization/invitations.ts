import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { RequestError } from "@usepreface/protocol";
import { CreateInvitationInput } from "@usepreface/protocol/input";

import { mapInfrastructureError } from "#/http/errors";
import { currentOrganizationId } from "#/http/organization";

export const OrganizationInvitationsRoutes = HttpApiBuilder.group(
  PrefaceApi,
  "organizationInvitations",
  (handlers) =>
    Effect.gen(function* () {
      const invitations = (yield* Application).organization.invitation;
      return handlers.handleAll({
        delivery: Effect.fn("http.organizationInvitations.delivery")(function* ({ params }) {
          return yield* invitations
            .delivery(yield* CurrentActor, yield* currentOrganizationId, params.invitationId)
            .pipe(mapInfrastructureError);
        }),
        create: Effect.fn("http.organizationInvitations.create")(function* ({ payload }) {
          const input = yield* Schema.decodeUnknownEffect(CreateInvitationInput)(payload).pipe(
            Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
          );
          return yield* invitations
            .create(yield* CurrentActor, yield* currentOrganizationId, input)
            .pipe(mapInfrastructureError);
        }),
        list: Effect.fn("http.organizationInvitations.list")(function* ({ query }) {
          return yield* invitations
            .list(yield* CurrentActor, yield* currentOrganizationId, query)
            .pipe(mapInfrastructureError);
        }),
        resend: Effect.fn("http.organizationInvitations.resend")(function* ({ params }) {
          return yield* invitations
            .resend(yield* CurrentActor, yield* currentOrganizationId, params.invitationId)
            .pipe(mapInfrastructureError);
        }),
        revoke: Effect.fn("http.organizationInvitations.revoke")(function* ({ params }) {
          return yield* invitations
            .revoke(yield* CurrentActor, yield* currentOrganizationId, params.invitationId)
            .pipe(mapInfrastructureError);
        }),
      });
    }),
);
