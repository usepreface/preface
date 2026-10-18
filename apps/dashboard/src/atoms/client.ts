import { Effect } from "effect";
import { FetchHttpClient, HttpClient } from "effect/http";
import { AtomHttpApi, Reactivity } from "effect/reactivity";

import { PrefaceApi } from "@usepreface/api";

import { requestFields } from "#/lib/request-fields";

// Relative API paths support a same-origin reverse proxy without exposing deployment secrets.
export class ApiClient extends AtomHttpApi.Service<ApiClient>()("@usepreface/dashboard/ApiClient", {
  api: PrefaceApi,
  baseUrl: import.meta.env.VITE_API_URL || window.location.origin,
  httpClient: FetchHttpClient.layer,
  transformClient: (client) =>
    HttpClient.transform(client, (response) =>
      Effect.provideService(response, FetchHttpClient.RequestInit, { credentials: "include" }),
    ),
}) {}

// Each mounted mutation owns its atom. Concurrent dialogs must not interrupt each other's requests.
export const mutation =
  <Input, A, E>(
    select: (client: ApiClient["Service"]) => (input: Input) => Effect.Effect<A, E>,
    invalidates: (input: Input) => readonly string[] = () => [],
  ) =>
  () =>
    ApiClient.runtime.fn<Input>()(
      Effect.fnUntraced(function* (input) {
        const client = yield* ApiClient;
        return yield* Reactivity.mutation(select(client)(requestFields(input)), invalidates(input));
      }),
    );
