import { Schema } from "effect";

export const SamlEntityId = Schema.String.check(
  Schema.isTrimmed(),
  Schema.isMinLength(1),
  Schema.isMaxLength(2048),
  Schema.isPattern(/^(https?:|urn:)[^\s]+$/),
);
export const SamlCertificate = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(16384),
);
export const SamlNameIdFormat = Schema.Literals([
  "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified",
]);
export const SamlIdentityProviderConfiguration = Schema.Struct({
  entityId: SamlEntityId,
  signOnUrl: Schema.String.check(
    Schema.isTrimmed(),
    Schema.isMaxLength(2048),
    Schema.isPattern(/^https:\/\/[^\s?#]+$/),
  ),
  signingCertificates: Schema.Array(SamlCertificate).check(
    Schema.isMinLength(1),
    Schema.isMaxLength(5),
  ),
  nameIdFormat: SamlNameIdFormat,
});
export const SamlConfiguration = Schema.Struct({
  version: Schema.Literal(1),
  entityId: SamlEntityId,
  callbackUrl: Schema.String,
  signingCertificate: SamlCertificate,
  idp: Schema.NullOr(SamlIdentityProviderConfiguration),
});
export type SamlConfiguration = typeof SamlConfiguration.Type;
