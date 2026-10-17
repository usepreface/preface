import { Schema } from "effect";

import { BootstrapChallengeId } from "#/identifiers/bootstrap";
import { EmailJobId } from "#/identifiers/email";
import { InstanceDisplayName } from "#/values/instance";
import { UserDisplayName, UserEmail } from "#/values/user";

export const CreateBootstrapChallenge = Schema.Struct({
  id: BootstrapChallengeId,
  bootstrapTokenHash: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)),
  instanceName: InstanceDisplayName,
  ownerName: UserDisplayName,
  email: UserEmail,
  codeHash: Schema.String.check(Schema.isPattern(/^[0-9a-f]{64}$/)),
  emailJobId: EmailJobId,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type CreateBootstrapChallenge = typeof CreateBootstrapChallenge.Type;

export const BootstrapChallenge = Schema.Struct({
  ...CreateBootstrapChallenge.fields,
  installationId: Schema.Literal(1),
  attempts: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 5 })),
  createdAt: Schema.DateTimeUtcFromDate,
});
export type BootstrapChallenge = typeof BootstrapChallenge.Type;
