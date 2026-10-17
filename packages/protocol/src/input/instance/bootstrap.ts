import { Schema, SchemaGetter } from "effect";

import { BootstrapChallengeId } from "#/identifiers/bootstrap";
import { InstanceDisplayName } from "#/values/instance";
import { SecretTokenFromString } from "#/values/secret-token";
import { UserDisplayName, UserEmail } from "#/values/user";

export const RequestBootstrapVerificationInput = Schema.Struct({
  token: SecretTokenFromString,
  instanceName: Schema.String.pipe(
    Schema.decodeTo(InstanceDisplayName, {
      decode: SchemaGetter.transform((name) => name.trim()),
      encode: SchemaGetter.passthrough(),
    }),
  ),
  ownerName: Schema.String.pipe(
    Schema.decodeTo(UserDisplayName, {
      decode: SchemaGetter.transform((name) => name.trim()),
      encode: SchemaGetter.passthrough(),
    }),
  ),
  email: Schema.String.pipe(
    Schema.decodeTo(UserEmail, {
      decode: SchemaGetter.transform((email) => email.trim().toLowerCase()),
      encode: SchemaGetter.passthrough(),
    }),
  ),
});
export type RequestBootstrapVerificationInput = typeof RequestBootstrapVerificationInput.Type;

export const CompleteBootstrapInput = Schema.Struct({
  token: SecretTokenFromString,
  challengeId: BootstrapChallengeId,
  code: Schema.RedactedFromValue(Schema.String.check(Schema.isPattern(/^\d{8}$/)), {
    disallowEncode: true,
  }),
});
export type CompleteBootstrapInput = typeof CompleteBootstrapInput.Type;

export const ResendBootstrapVerificationInput = Schema.Struct({
  token: SecretTokenFromString,
  challengeId: BootstrapChallengeId,
});
export type ResendBootstrapVerificationInput = typeof ResendBootstrapVerificationInput.Type;
