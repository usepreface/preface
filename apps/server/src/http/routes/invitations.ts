import { Effect, Redacted, Schema } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";
import { InvitationError, RequestError } from "@usepreface/protocol";
import { InvitationTokenInput, AcceptInvitationInput } from "@usepreface/protocol/input";

import {
  readInvitationCookie,
  setInvitationCookie,
  clearInvitationCookie,
} from "#/http/cookies/invitation";
import { readSessionCookie, setSessionCookie } from "#/http/cookies/session";
import { mapInfrastructureError } from "#/http/errors";

export const InvitationsRoutes = HttpApiBuilder.group(PrefaceApi, "invitations", (handlers) =>
  Effect.gen(function* () {
    const application = yield* Application;
    const invitations = application.organization.invitation;
    return handlers.handleAll({
      inspect: Effect.fn("http.invitations.inspect")(function* ({ payload }) {
        const input = yield* Schema.decodeUnknownEffect(InvitationTokenInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        return yield* invitations.inspect(input).pipe(mapInfrastructureError);
      }),
      requestVerification: Effect.fn("http.invitations.requestVerification")(function* ({
        payload,
      }) {
        const input = yield* Schema.decodeUnknownEffect(InvitationTokenInput)(payload).pipe(
          Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })),
        );
        const result = yield* invitations.requestVerification(input).pipe(mapInfrastructureError);
        yield* setInvitationCookie(result.browserToken, result.challenge.expiresAt);
        return result.challenge;
      }),
      accept: Effect.fn("http.invitations.accept")(function* ({ payload }) {
        const browserToken = yield* readInvitationCookie;
        if (browserToken === undefined)
          return yield* new InvitationError({ code: "INVALID_PROOF" });
        const input = yield* Schema.decodeUnknownEffect(AcceptInvitationInput)({
          ...payload,
          browserToken: Redacted.value(browserToken),
        }).pipe(Effect.mapError(() => new RequestError({ code: "INVALID_INPUT" })));
        const sessionToken = yield* readSessionCookie;
        const actor =
          sessionToken === undefined
            ? undefined
            : yield* application.auth.session.resolve(sessionToken).pipe(
                Effect.catchTag("AuthenticationError", () => Effect.succeed(undefined)),
                mapInfrastructureError,
              );
        const result = yield* invitations.accept(input, actor).pipe(mapInfrastructureError);
        yield* setSessionCookie(result.sessionToken, result.actor.session.expiresAt);
        yield* clearInvitationCookie;
        return {
          actor: result.actor,
          organizationId: result.organizationId,
          memberId: result.memberId,
        };
      }),
    });
  }),
);
