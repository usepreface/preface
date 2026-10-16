import { DateTime, Schema } from "effect";

import { InstanceOwnerId } from "#/identifiers/instance";
import { UserId } from "#/identifiers/user";

export const InstanceOwnerGrantSource = Schema.Literals([
  "bootstrap",
  "owner",
  "operator_recovery",
]);
export type InstanceOwnerGrantSource = typeof InstanceOwnerGrantSource.Type;

const grantFields = {
  userId: UserId,
  grantSource: InstanceOwnerGrantSource,
  grantedByUserId: Schema.NullOr(UserId),
};

const grantActorCheck = Schema.makeFilter<{
  readonly grantSource: InstanceOwnerGrantSource;
  readonly grantedByUserId: UserId | null;
}>(
  (grant) =>
    (grant.grantSource === "owner"
      ? grant.grantedByUserId !== null
      : grant.grantedByUserId === null) || "Only an owner-issued grant has a granting user",
);

export const GrantInstanceOwner = Schema.Struct(grantFields).check(grantActorCheck);
export type GrantInstanceOwner = typeof GrantInstanceOwner.Type;

export const InstanceOwner = Schema.Struct({
  id: InstanceOwnerId,
  installationId: Schema.Literal(1),
  ...grantFields,
  grantedAt: Schema.DateTimeUtcFromDate,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  revokedByUserId: Schema.NullOr(UserId),
  revocationReason: Schema.NullOr(Schema.NonEmptyString),
}).check(
  grantActorCheck,
  Schema.makeFilter((owner) => {
    if (owner.revokedAt === null) {
      return (
        (owner.revokedByUserId === null && owner.revocationReason === null) ||
        "Active grants cannot have revocation metadata"
      );
    }
    return (
      DateTime.toEpochMillis(owner.revokedAt) >= DateTime.toEpochMillis(owner.grantedAt) ||
      "Revocation cannot precede the grant"
    );
  }),
);
export type InstanceOwner = typeof InstanceOwner.Type;

export const RevokeInstanceOwner = Schema.Struct({
  id: InstanceOwner.fields.id,
  revokedByUserId: InstanceOwner.fields.revokedByUserId,
  revocationReason: InstanceOwner.fields.revocationReason,
});
export type RevokeInstanceOwner = typeof RevokeInstanceOwner.Type;
