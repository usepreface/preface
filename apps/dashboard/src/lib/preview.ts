import { Schema } from "effect";

/*
 * Until the API is wired, screens with several states (an expired code, an empty list, a
 * confirmation dialog…) read the state to show from `?state=` in the URL, so every design state
 * can be opened directly. When a route is connected to real data its states come from the query
 * instead, and the search param goes away.
 */
export const previewSearch = Schema.toStandardSchemaV1(
  Schema.Struct({ state: Schema.optional(Schema.String) }),
);

/** The requested state if this screen supports it, otherwise `undefined` (the default screen). */
export function previewState<const State extends string>(
  states: readonly State[],
  requested: string | undefined,
): State | undefined {
  return states.find((state) => state === requested);
}
