import { Schema } from "effect";

import { CredentialDigest } from "#/common/credential-digest";
import { DisplayName as InstanceDisplayName } from "#/common/display-name";
import { DisplayName as UserDisplayName } from "#/common/display-name";
import { EmailAddress as UserEmail } from "#/common/email";
import { BootstrapChallengeId } from "#/identifiers/bootstrap";
import { EmailJobId } from "#/identifiers/email";

export const CreateBootstrapChallenge = Schema.Struct({
  id: BootstrapChallengeId,
  bootstrapTokenHash: CredentialDigest,
  instanceName: InstanceDisplayName,
  ownerName: UserDisplayName,
  email: UserEmail,
  codeHash: CredentialDigest,
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
