import { Schema, SchemaGetter } from "effect";

import { SecretTokenFromString } from "#/auth/session";
import { UserDisplayName, UserEmail } from "#/model/auth/user";
import { InstanceDisplayName } from "#/model/instance/settings";

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

export const BootstrapPassword = Schema.RedactedFromValue(
  Schema.String.check(Schema.isMinLength(15), Schema.isMaxLength(128)),
  { disallowEncode: true },
);

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

// A client must encode credentials for transmission. Server-side input remains non-encodable.
export const CompleteBootstrapRequest = Schema.Struct({
  token: Schema.toEncoded(SecretTokenFromString).annotate({
    writeOnly: true,
    description: "Current one-time setup proof.",
  }),
  password: Schema.toEncoded(BootstrapPassword).annotate({
    writeOnly: true,
    format: "password",
    description: "15–128 UTF-16 code units; preserved exactly.",
  }),
  instanceName: Schema.toEncoded(CompleteBootstrapInput.fields.instanceName).annotate({
    description: "Instance display name; trimmed to 1–120 characters.",
  }),
  ownerName: Schema.toEncoded(CompleteBootstrapInput.fields.ownerName).annotate({
    description: "First owner's display name; trimmed to 1–120 characters.",
  }),
  email: Schema.toEncoded(CompleteBootstrapInput.fields.email).annotate({
    description: "Account email; trimmed and lowercased on the server.",
  }),
}).annotate({ identifier: "CompleteBootstrapRequest" });
export type CompleteBootstrapRequest = typeof CompleteBootstrapRequest.Type;

export const InspectBootstrapRequest = Schema.Struct({
  token: Schema.toEncoded(SecretTokenFromString).annotate({
    writeOnly: true,
    description: "Setup proof to inspect without consuming it.",
  }),
}).annotate({ identifier: "InspectBootstrapRequest" });
export type InspectBootstrapRequest = typeof InspectBootstrapRequest.Type;

export const BootstrapStatus = Schema.Struct({
  state: Schema.Literals(["setup_required", "ready"]),
  instanceName: InstanceDisplayName,
});
export type BootstrapStatus = typeof BootstrapStatus.Type;

export const BootstrapTokenInfo = Schema.Struct({ expiresAt: Schema.DateTimeUtcFromString });
export type BootstrapTokenInfo = typeof BootstrapTokenInfo.Type;

export class BootstrapError extends Schema.TaggedError<BootstrapError>()("BootstrapError", {
  code: Schema.Literals([
    "INVALID_INPUT",
    "INVALID_TOKEN",
    "ALREADY_COMPLETED",
    "EMAIL_UNAVAILABLE",
  ]),
}) {}
