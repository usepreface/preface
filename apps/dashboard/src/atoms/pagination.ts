import { Effect } from "effect";

// Choice forms need the complete directory, including grants on later API pages.
export const collectPages = Effect.fnUntraced(function* <A, Cursor extends string, E, R>(
  load: (
    cursor?: Cursor,
  ) => Effect.Effect<{ readonly values: readonly A[]; readonly nextCursor: Cursor | null }, E, R>,
) {
  const values: A[] = [];
  const seen = new Set<string>();
  let cursor: Cursor | undefined;
  do {
    const page = yield* load(cursor);
    values.push(...page.values);
    if (page.nextCursor === null) return values;
    if (seen.has(page.nextCursor)) return yield* Effect.die(new Error("Repeated directory cursor"));
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (true);
});
