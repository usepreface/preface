import { Schema } from "effect";

import { DisplayNameInput } from "#/common/display-name";
import { IdentityRevision } from "#/common/identity";
import { SamlIdentityProviderConfiguration } from "#/common/saml";
import { SecretTokenFromString } from "#/common/secret-token";
import { AuthFlowId } from "#/identifiers/identity";

export const CreateSamlConnectionInput = Schema.Struct({ name: DisplayNameInput });
export type CreateSamlConnectionInput = typeof CreateSamlConnectionInput.Type;
export const UpdateSamlConnectionInput = Schema.Struct({
  expectedRevision: IdentityRevision,
  name: Schema.optionalKey(DisplayNameInput),
  idp: Schema.optionalKey(SamlIdentityProviderConfiguration),
});
export type UpdateSamlConnectionInput = typeof UpdateSamlConnectionInput.Type;
export const SamlCallbackInput = Schema.Struct({
  relayState: SecretTokenFromString,
  response: Schema.RedactedFromValue(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(180000)),
    { disallowEncode: true },
  ),
});
export type SamlCallbackInput = typeof SamlCallbackInput.Type;
export const CompleteSamlFlowInput = Schema.Struct({
  flowId: AuthFlowId,
  browserToken: SecretTokenFromString,
});
export type CompleteSamlFlowInput = typeof CompleteSamlFlowInput.Type;
