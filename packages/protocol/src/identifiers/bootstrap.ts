import { Schema } from "effect";

export const BootstrapChallengeId = Schema.String.check(Schema.isUUID(7)).pipe(
  Schema.brand("BootstrapChallengeId"),
);
export type BootstrapChallengeId = typeof BootstrapChallengeId.Type;
