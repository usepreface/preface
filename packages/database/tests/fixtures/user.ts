import assert from "node:assert/strict";

import { DateTime, Effect } from "effect";

import { Database } from "../../src/index.js";
import { user } from "../../src/schema/auth/user.js";

export const createTestUser = Effect.fnUntraced(function* () {
  const database = yield* Database;
  const createdAt = DateTime.toDateUtc(yield* DateTime.now);
  const [account] = yield* database
    .insert(user)
    .values({
      metadata: { version: 1, name: "Test Owner" },
      createdAt,
      updatedAt: createdAt,
    })
    .returning();

  assert.ok(account);
  return account;
});
