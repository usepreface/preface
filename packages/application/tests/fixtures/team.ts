import { Effect } from "effect";

import { Application } from "../../src/index.js";
import { createTestOrganization } from "./organization.js";

export const createTestTeam = Effect.gen(function* () {
  const fixture = yield* createTestOrganization;
  const team = yield* (yield* Application).organization.team.create(
    fixture.owner.actor,
    fixture.organization.id,
    { metadata: { name: "Engineering", description: "Build the product" }, slug: "engineering" },
  );
  return { ...fixture, team };
});
