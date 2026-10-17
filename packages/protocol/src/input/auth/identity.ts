import { Schema, SchemaGetter } from "effect";

import { AuthenticationReturnPath } from "#/common/identity";
import { SecretTokenFromString } from "#/common/secret-token";

export const SaveGoogleConnectionInput = Schema.Struct({
  expectedRevision: Schema.Natural,
  clientId: Schema.String.pipe(
    Schema.decodeTo(
      Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512), Schema.isTrimmed()),
      {
        decode: SchemaGetter.transform((value) => value.trim()),
        encode: SchemaGetter.passthrough(),
      },
    ),
  ),
  clientSecret: Schema.optionalKey(
    Schema.RedactedFromValue(Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(512)), {
      disallowEncode: true,
    }),
  ),
  name: Schema.optionalKey(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(120), Schema.isTrimmed()),
  ),
});
export type SaveGoogleConnectionInput = typeof SaveGoogleConnectionInput.Type;
export const GoogleStartInput = Schema.Struct({
  returnPath: Schema.optionalKey(AuthenticationReturnPath),
});
export type GoogleStartInput = typeof GoogleStartInput.Type;
export { UpdateOrganizationAuthPolicyInput as UpdateGooglePolicyInput } from "#/input/organization/authentication";

export const GoogleCallbackInput = Schema.Struct({
  state: SecretTokenFromString,
  browserToken: SecretTokenFromString,
  code: Schema.optionalKey(
    Schema.RedactedFromValue(Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4096)), {
      disallowEncode: true,
    }),
  ),
  error: Schema.optionalKey(Schema.String.check(Schema.isMaxLength(256))),
});
export type GoogleCallbackInput = typeof GoogleCallbackInput.Type;
