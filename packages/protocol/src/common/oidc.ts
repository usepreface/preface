import { Option, Schema } from "effect";

const HttpsEndpoint = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(2048),
  Schema.isTrimmed(),
  Schema.makeFilter((value: string) => {
    const decoded = Schema.decodeUnknownOption(Schema.URLFromString)(value);
    if (Option.isNone(decoded)) return false;
    const url = decoded.value;
    return url.protocol === "https:" && !url.username && !url.password && !value.includes("#");
  }),
);
export const OidcIssuer = HttpsEndpoint.check(Schema.makeFilter((value) => !value.includes("?")));
export const OidcClientId = Schema.String.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(512),
  Schema.isTrimmed(),
);
export const OidcClientAuthentication = Schema.Literals([
  "client_secret_basic",
  "client_secret_post",
]);
export const OidcMetadata = Schema.Struct({
  authorizationEndpoint: HttpsEndpoint,
  tokenEndpoint: HttpsEndpoint,
  jwksUri: HttpsEndpoint,
});
export const OidcConfiguration = Schema.Struct({
  version: Schema.Literal(1),
  issuer: OidcIssuer,
  clientId: OidcClientId,
  clientAuthenticationMethod: OidcClientAuthentication,
  idTokenSigningAlgorithm: Schema.Literal("RS256"),
  metadata: OidcMetadata,
});
export const IdentityProvider = Schema.Literals(["google", "oidc"]);
