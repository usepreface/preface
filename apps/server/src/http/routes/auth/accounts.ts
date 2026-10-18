import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { CurrentActor, PrefaceApi } from "@usepreface/api";
import { Application } from "@usepreface/application";

import { googleFlowCookie } from "#/http/cookies/browser-proof";
import { mapInfrastructureError } from "#/http/errors";
export const AccountsRoutes = HttpApiBuilder.group(PrefaceApi, "accounts", (handlers) =>
  Effect.gen(function* () {
    const account = (yield* Application).auth.account;
    return handlers.handleAll({
      list: Effect.fn("http.accounts.list")(function* () {
        return yield* account.list(yield* CurrentActor).pipe(mapInfrastructureError);
      }),
      startGoogle: Effect.fn("http.accounts.startGoogle")(function* ({ payload }) {
        const result = yield* account
          .startGoogle(yield* CurrentActor, payload)
          .pipe(mapInfrastructureError);
        yield* googleFlowCookie.set(result.browserToken, result.expiresAt);
        return { authorizationUrl: result.authorizationUrl, expiresAt: result.expiresAt };
      }),
      unlink: Effect.fn("http.accounts.unlink")(function* ({ params }) {
        yield* account.unlink(yield* CurrentActor, params.accountId).pipe(mapInfrastructureError);
      }),
    });
  }),
);
