import { DateTime, Schema } from "effect";

import { InstallationId } from "#/identifiers/instance";

export const Installation = Schema.Struct({
  id: Schema.Literal(1),
  installationId: InstallationId,
  createdAt: Schema.DateTimeUtcFromDate,
  bootstrapCompletedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  bootstrapTokenHash: Schema.NullOr(Schema.NonEmptyString),
  bootstrapTokenIssuedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  bootstrapTokenExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
}).check(
  Schema.makeFilter((installation) => {
    const {
      bootstrapTokenHash: hash,
      bootstrapTokenIssuedAt: issuedAt,
      bootstrapTokenExpiresAt: expiresAt,
    } = installation;
    if (hash === null && issuedAt === null && expiresAt === null) return true;
    if (installation.bootstrapCompletedAt !== null)
      return "Completed bootstrap must clear its token";
    if (hash === null || issuedAt === null || expiresAt === null)
      return "Bootstrap token fields must be present together";
    return (
      DateTime.toEpochMillis(expiresAt) > DateTime.toEpochMillis(issuedAt) ||
      "Bootstrap token expiry must follow issuance"
    );
  }),
);
export type Installation = typeof Installation.Type;

export const IssueBootstrapToken = Schema.Struct({
  hash: Schema.NonEmptyString,
  expiresAt: Schema.DateTimeUtcFromDate,
});
export type IssueBootstrapToken = typeof IssueBootstrapToken.Type;
