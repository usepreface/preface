import { Schema } from "effect";

import { ConnectionStatus, GoogleConfiguration, IdentityRevision } from "#/common/identity";
import { IdentityConnectionId } from "#/identifiers/identity";
export const IdentityConnection = Schema.Struct({
  id: IdentityConnectionId,
  installationId: Schema.Literal(1),
  provider: Schema.Literal("google"),
  name: Schema.NonEmptyString,
  status: ConnectionStatus,
  revision: IdentityRevision,
  configuration: GoogleConfiguration,
  secretsCiphertext: Schema.NonEmptyString,
  testedRevision: Schema.NullOr(IdentityRevision),
  testedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  createdAt: Schema.DateTimeUtcFromDate,
  updatedAt: Schema.DateTimeUtcFromDate,
});
export type IdentityConnection = typeof IdentityConnection.Type;
