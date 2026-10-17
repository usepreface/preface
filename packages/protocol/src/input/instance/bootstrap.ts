import { Schema, SchemaGetter } from "effect";

import { BootstrapPasswordValue } from "#/values/bootstrap";
import { InstanceDisplayName } from "#/values/instance";
import { SecretTokenFromString } from "#/values/secret-token";
import { UserDisplayName, UserEmail } from "#/values/user";

const trimmedName = Schema.String.pipe(
  Schema.decodeTo(UserDisplayName, {
    decode: SchemaGetter.transform((name) => name.trim()),
    encode: SchemaGetter.passthrough(),
  }),
);

const canonicalEmail = Schema.String.pipe(
  Schema.decodeTo(UserEmail, {
    decode: SchemaGetter.transform((email) => email.trim().toLowerCase()),
    encode: SchemaGetter.passthrough(),
  }),
);

export const BootstrapPassword = Schema.RedactedFromValue(BootstrapPasswordValue, {
  disallowEncode: true,
});

export const CompleteBootstrapInput = Schema.Struct({
  token: SecretTokenFromString,
  instanceName: Schema.String.pipe(
    Schema.decodeTo(InstanceDisplayName, {
      decode: SchemaGetter.transform((name) => name.trim()),
      encode: SchemaGetter.passthrough(),
    }),
  ),
  ownerName: trimmedName,
  email: canonicalEmail,
  password: BootstrapPassword,
});
export type CompleteBootstrapInput = typeof CompleteBootstrapInput.Type;
