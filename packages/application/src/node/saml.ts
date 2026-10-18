import { DateTime, Effect, Layer, Redacted, Schema } from "effect";

import {
  SAML,
  ValidateInResponseTo,
  generateServiceProviderMetadata,
  type CacheProvider,
} from "@node-saml/node-saml";
import { CertificateCrypto } from "@usepreface/crypto";
import { IdentityError } from "@usepreface/protocol";

import { SamlIdentity, SamlIdentityClaims, type SamlClient } from "#/auth/saml/provider";
import {
  children,
  attribute,
  oneChild,
  parseSamlXml,
  samlNamespace,
  scalarText,
  validateSamlEnvelope,
} from "#/node/saml/xml";

const configuration = (
  client: SamlClient,
  requestId: string,
  requestedAt: string,
  forceAuthn = false,
) => {
  const idp = client.configuration.idp;
  if (idp === null) throw new IdentityError({ code: "INVALID_CONFIGURATION" });
  // The authoritative request record is the atomically claimed database flow. No process cache owns admission.
  const cacheProvider: CacheProvider = {
    saveAsync: async (key, value) =>
      key === requestId ? { value, createdAt: Date.parse(value) } : null,
    getAsync: async (key) => (key === requestId ? requestedAt : null),
    removeAsync: async () => null,
  };
  return new SAML({
    issuer: client.configuration.entityId,
    callbackUrl: client.configuration.callbackUrl,
    entryPoint: idp.signOnUrl,
    idpIssuer: idp.entityId,
    audience: client.configuration.entityId,
    idpCert: [...idp.signingCertificates],
    privateKey: Redacted.value(client.privateKey),
    publicCert: client.configuration.signingCertificate,
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    validateInResponseTo: ValidateInResponseTo.always,
    requestIdExpirationPeriodMs: 10 * 60_000,
    maxAssertionAgeMs: 5 * 60_000,
    acceptedClockSkewMs: 60_000,
    generateUniqueId: () => requestId,
    cacheProvider,
    identifierFormat: idp.nameIdFormat,
    disableRequestedAuthnContext: true,
    // The IdP may mint a persistent identifier; Preface admission remains invitation-only.
    allowCreate: true,
    forceAuthn,
  });
};

export const NodeSamlIdentity = {
  layer: Layer.effect(
    SamlIdentity,
    Effect.gen(function* () {
      const certificates = yield* CertificateCrypto;
      return SamlIdentity.of({
        validateConfiguration: Effect.fn("SamlIdentity.validateConfiguration")(function* (idp) {
          const url = yield* Schema.decodeUnknownEffect(Schema.URLFromString)(idp.signOnUrl).pipe(
            Effect.mapError(() => new IdentityError({ code: "INVALID_CONFIGURATION" })),
          );
          if (url.protocol !== "https:" || url.username || url.password || url.hash || url.search)
            return yield* new IdentityError({ code: "INVALID_CONFIGURATION" });
          return {
            ...idp,
            signingCertificates: yield* certificates
              .validateSigningCertificates(idp.signingCertificates)
              .pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_CONFIGURATION" }))),
          };
        }),
        metadata: Effect.fn("SamlIdentity.metadata")((client) =>
          Effect.try({
            try: () =>
              generateServiceProviderMetadata({
                issuer: client.configuration.entityId,
                callbackUrl: client.configuration.callbackUrl,
                privateKey: Redacted.value(client.privateKey),
                publicCerts: [client.configuration.signingCertificate],
                identifierFormat:
                  client.configuration.idp?.nameIdFormat ??
                  "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
                wantAssertionsSigned: true,
                signatureAlgorithm: "sha256",
                digestAlgorithm: "sha256",
                signMetadata: false,
              }),
            catch: () => new IdentityError({ code: "INVALID_CONFIGURATION" }),
          }),
        ),
        authorizationUrl: Effect.fn("SamlIdentity.authorizationUrl")(function* (input) {
          const now = yield* DateTime.now;
          yield* certificates
            .validateSigningCertificates([input.configuration.signingCertificate])
            .pipe(Effect.mapError(() => new IdentityError({ code: "CONNECTION_UNAVAILABLE" })));
          return yield* Effect.tryPromise({
            try: () =>
              configuration(
                input,
                input.requestId,
                DateTime.formatIso(now),
                input.forceAuthentication,
              ).getAuthorizeUrlAsync(Redacted.value(input.relayState), undefined, {}),
            catch: () => new IdentityError({ code: "INVALID_CONFIGURATION" }),
          });
        }),
        validateResponse: Effect.fn("SamlIdentity.validateResponse")(function* (input) {
          const now = yield* DateTime.now;
          if (input.configuration.idp === null)
            return yield* new IdentityError({ code: "INVALID_CONFIGURATION" });
          yield* certificates
            .validateSigningCertificates(input.configuration.idp.signingCertificates)
            .pipe(Effect.mapError(() => new IdentityError({ code: "CONNECTION_UNAVAILABLE" })));
          const result = yield* Effect.tryPromise({
            try: async () => {
              const raw = Redacted.value(input.response);
              if (
                raw.length === 0 ||
                raw.length > 180_000 ||
                raw.length % 4 !== 0 ||
                !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)
              )
                throw new IdentityError({ code: "INVALID_FLOW" });
              const xml = Buffer.from(raw, "base64").toString("utf8");
              const idp = input.configuration.idp;
              if (idp === null) throw new IdentityError({ code: "INVALID_FLOW" });
              const response = validateSamlEnvelope(
                xml,
                input.requestId,
                input.configuration.callbackUrl,
                idp.entityId,
              );
              const { profile, loggedOut } = await configuration(
                input,
                input.requestId,
                DateTime.formatIso(input.requestedAt),
              ).validatePostResponseAsync({ SAMLResponse: raw });
              if (loggedOut || !profile?.getAssertionXml)
                throw new IdentityError({ code: "INVALID_FLOW" });
              const assertion = parseSamlXml(profile.getAssertionXml(), "Assertion", samlNamespace);
              if (scalarText(oneChild(assertion, "Issuer")) !== idp.entityId)
                throw new IdentityError({ code: "INVALID_FLOW" });
              const subject = oneChild(assertion, "Subject");
              const name = oneChild(subject, "NameID");
              const format =
                name.getAttribute("Format") ||
                "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified";
              const qualifier = name.getAttribute("NameQualifier") || null;
              const spQualifier = name.getAttribute("SPNameQualifier") || null;
              if (
                format !== idp.nameIdFormat ||
                (qualifier !== null && qualifier !== idp.entityId) ||
                (spQualifier !== null && spQualifier !== input.configuration.entityId)
              )
                throw new IdentityError({ code: "INVALID_FLOW" });
              const confirmation = oneChild(subject, "SubjectConfirmation");
              const confirmationData = oneChild(confirmation, "SubjectConfirmationData");
              if (
                attribute(confirmation, "Method") !== "urn:oasis:names:tc:SAML:2.0:cm:bearer" ||
                attribute(confirmationData, "Recipient") !== input.configuration.callbackUrl ||
                attribute(confirmationData, "InResponseTo") !== input.requestId
              )
                throw new IdentityError({ code: "INVALID_FLOW" });
              let email: string | null = null;
              if (idp.emailAttribute !== undefined) {
                const attributes = children(assertion, "AttributeStatement")
                  .flatMap((statement) => children(statement, "Attribute"))
                  .filter((entry) => entry.getAttribute("Name") === idp.emailAttribute);
                if (attributes.length > 1) throw new IdentityError({ code: "INVALID_FLOW" });
                if (attributes[0] !== undefined) {
                  const values = children(attributes[0], "AttributeValue");
                  if (values.length !== 1 || values[0] === undefined)
                    throw new IdentityError({ code: "INVALID_FLOW" });
                  email = scalarText(values[0]);
                }
              }
              const conditions = oneChild(assertion, "Conditions");
              const authentication = oneChild(assertion, "AuthnStatement");
              return {
                email,
                issuer: idp.entityId,
                subject: JSON.stringify([format, qualifier, spQualifier, scalarText(name)]),
                authenticatedAt: attribute(authentication, "AuthnInstant"),
                sessionExpiresAt: authentication.getAttribute("SessionNotOnOrAfter") || null,
                responseId: attribute(response, "ID"),
                assertionId: attribute(assertion, "ID"),
                assertionIssuedAt: attribute(assertion, "IssueInstant"),
                responseIssuedAt: attribute(response, "IssueInstant"),
                validUntil: [
                  attribute(confirmationData, "NotOnOrAfter"),
                  attribute(conditions, "NotOnOrAfter"),
                ],
              };
            },
            catch: () => new IdentityError({ code: "INVALID_FLOW" }),
          });
          const dates = yield* Schema.decodeUnknownEffect(
            Schema.Struct({
              authenticatedAt: Schema.DateTimeUtcFromString,
              sessionExpiresAt: Schema.NullOr(Schema.DateTimeUtcFromString),
              assertionIssuedAt: Schema.DateTimeUtcFromString,
              responseIssuedAt: Schema.DateTimeUtcFromString,
              validUntil: Schema.Array(Schema.DateTimeUtcFromString),
            }),
          )(result).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
          const nowMs = DateTime.toEpochMillis(now);
          const issuedAt = Math.min(
            DateTime.toEpochMillis(dates.assertionIssuedAt),
            DateTime.toEpochMillis(dates.responseIssuedAt),
          );
          const validUntil = Math.min(
            ...dates.validUntil.map(DateTime.toEpochMillis),
            issuedAt + 5 * 60_000,
          );
          if (
            validUntil <= nowMs ||
            DateTime.toEpochMillis(dates.assertionIssuedAt) > nowMs + 60_000 ||
            DateTime.toEpochMillis(dates.responseIssuedAt) > nowMs + 60_000 ||
            DateTime.toEpochMillis(dates.authenticatedAt) > nowMs + 60_000 ||
            (dates.sessionExpiresAt !== null &&
              DateTime.toEpochMillis(dates.sessionExpiresAt) <= nowMs)
          )
            return yield* new IdentityError({ code: "INVALID_FLOW" });
          return yield* Schema.decodeUnknownEffect(Schema.toType(SamlIdentityClaims))({
            ...result,
            authenticatedAt: dates.authenticatedAt,
            sessionExpiresAt: dates.sessionExpiresAt,
            validUntil: DateTime.makeUnsafe(validUntil),
          }).pipe(Effect.mapError(() => new IdentityError({ code: "INVALID_FLOW" })));
        }),
      });
    }),
  ),
} as const;
