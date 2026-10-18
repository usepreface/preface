import { Effect } from "effect";
import { Atom } from "effect/reactivity";

import { requestFields } from "#/lib/request-fields";

import { ApiClient, mutation } from "./client";
import { QueryKeys } from "./query-keys";

export const sessionAtom = ApiClient.runtime
  .atom(
    Effect.gen(function* () {
      const client = yield* ApiClient;
      return yield* client.session
        .current()
        .pipe(Effect.catchTag("AuthenticationError", () => Effect.succeed(null)));
    }),
  )
  .pipe(Atom.keepAlive, ApiClient.runtime.factory.withReactivity([QueryKeys.authority]));
export const statusAtom = ApiClient.query(
  "instanceSetup",
  "status",
  requestFields({
    reactivityKeys: [QueryKeys.instance],
  }),
);
export const capabilitiesAtom = ApiClient.query(
  "instanceCapabilities",
  "get",
  requestFields({
    reactivityKeys: [QueryKeys.authority],
  }),
);
export const logoutMutation = mutation((client) => client.session.revoke);
