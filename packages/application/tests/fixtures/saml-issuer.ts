import { randomUUID } from "node:crypto";

import { DateTime, Effect, Redacted } from "effect";

import { CertificateCrypto } from "@usepreface/crypto";
import type { SamlConfiguration } from "@usepreface/protocol/model";
import { SignedXml } from "xml-crypto";

export const makeSamlIssuer = Effect.gen(function* () {
  const certificates = yield* CertificateCrypto;
  const signing = yield* certificates.generateSigningCertificate();
  const sp = yield* certificates.generateSigningCertificate();
  const configuration: SamlConfiguration = {
    version: 1,
    entityId: "https://preface.example.test/saml/metadata",
    callbackUrl: "https://preface.example.test/saml/acs",
    signingCertificate: sp.certificate,
    idp: {
      entityId: "https://saml.example.test",
      signOnUrl: "https://saml.example.test/login",
      signingCertificates: [signing.certificate],
      nameIdFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
    },
  };
  return {
    configuration,
    privateKey: sp.privateKey,
    response: (
      requestId: string,
      options: {
        readonly serviceProvider?: Pick<SamlConfiguration, "entityId" | "callbackUrl">;
        readonly recipient?: string;
        readonly audience?: string;
        readonly subject?: string;
        readonly authenticatedAt?: Date;
        readonly expiresAt?: Date;
        readonly assertionOnly?: boolean;
        readonly emailValues?: readonly string[];
      } = {},
    ) => {
      const serviceProvider = options.serviceProvider ?? configuration;
      const now = new Date();
      const expiry = options.expiresAt ?? new Date(now.getTime() + 240_000);
      const assertionId = `_${randomUUID()}`;
      const responseId = `_${randomUUID()}`;
      const xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${responseId}" Version="2.0" IssueInstant="${now.toISOString()}" Destination="${serviceProvider.callbackUrl}" InResponseTo="${requestId}">
<saml:Issuer>https://saml.example.test</saml:Issuer>
<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
<saml:Assertion ID="${assertionId}" Version="2.0" IssueInstant="${now.toISOString()}">
<saml:Issuer>https://saml.example.test</saml:Issuer>
<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">${options.subject ?? "immutable-employee-42"}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData InResponseTo="${requestId}" Recipient="${options.recipient ?? serviceProvider.callbackUrl}" NotOnOrAfter="${expiry.toISOString()}"/></saml:SubjectConfirmation></saml:Subject>
<saml:Conditions NotBefore="${new Date(now.getTime() - 60_000).toISOString()}" NotOnOrAfter="${expiry.toISOString()}"><saml:AudienceRestriction><saml:Audience>${options.audience ?? serviceProvider.entityId}</saml:Audience></saml:AudienceRestriction></saml:Conditions>
<saml:AuthnStatement AuthnInstant="${(options.authenticatedAt ?? now).toISOString()}" SessionIndex="idp-session" SessionNotOnOrAfter="${expiry.toISOString()}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>
<saml:AttributeStatement>${options.emailValues === undefined ? "" : `<saml:Attribute Name="email">${options.emailValues.map((email) => `<saml:AttributeValue>${email}</saml:AttributeValue>`).join("")}</saml:Attribute>`}<saml:Attribute Name="nameID"><saml:AttributeValue>attacker-supplied-attribute</saml:AttributeValue></saml:Attribute></saml:AttributeStatement>
</saml:Assertion></samlp:Response>`;
      const assertionSignature = new SignedXml({
        privateKey: Redacted.value(signing.privateKey),
        publicCert: signing.certificate,
      });
      assertionSignature.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
      assertionSignature.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";
      assertionSignature.addReference({
        xpath: `//*[@ID='${assertionId}']`,
        transforms: [
          "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
          "http://www.w3.org/2001/10/xml-exc-c14n#",
        ],
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
      });
      assertionSignature.computeSignature(xml, {
        location: {
          reference: `//*[@ID='${assertionId}']/*[local-name()='Issuer']`,
          action: "after",
        },
      });
      let signed = assertionSignature.getSignedXml();
      if (!options.assertionOnly) {
        const responseSignature = new SignedXml({
          privateKey: Redacted.value(signing.privateKey),
          publicCert: signing.certificate,
        });
        responseSignature.signatureAlgorithm = assertionSignature.signatureAlgorithm;
        responseSignature.canonicalizationAlgorithm = assertionSignature.canonicalizationAlgorithm;
        responseSignature.addReference({
          xpath: `//*[@ID='${responseId}']`,
          transforms: [
            "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
            "http://www.w3.org/2001/10/xml-exc-c14n#",
          ],
          digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        });
        responseSignature.computeSignature(signed, {
          location: {
            reference: `//*[@ID='${responseId}']/*[local-name()='Issuer']`,
            action: "after",
          },
        });
        signed = responseSignature.getSignedXml();
      }
      return Redacted.make(Buffer.from(signed).toString("base64"));
    },
    requestedAt: DateTime.makeUnsafe(new Date()),
  };
});
