import { DateTime, Effect, Layer, Redacted } from "effect";
import { TestClock } from "effect/testing";

import { CertificateCrypto } from "@usepreface/crypto";
import { NodeCertificateCrypto } from "@usepreface/crypto/node";
import { describe, expect, it } from "vitest";

import { SamlIdentity } from "../../../src/auth/saml/provider.js";
import { NodeSamlIdentity } from "../../../src/node/saml.js";
import { makeSamlIssuer } from "../../fixtures/saml-issuer.js";

const providers = Layer.mergeAll(
  NodeSamlIdentity.layer.pipe(Layer.provide(NodeCertificateCrypto.layer)),
  NodeCertificateCrypto.layer,
);

describe("SAML SDK adapter", () => {
  it("validates both signatures and takes stable identity and authentication time from the verified assertion", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const issuer = yield* makeSamlIssuer;
        const provider = yield* SamlIdentity;
        const requestId = "_expected-request";
        const authenticatedAt = new Date(Date.now() - 120_000);
        const verified = yield* provider.validateResponse({
          ...issuer,
          requestId,
          response: issuer.response(requestId, { authenticatedAt }),
        });
        expect(JSON.parse(verified.subject)).toEqual([
          "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
          null,
          null,
          "immutable-employee-42",
        ]);
        expect(DateTime.toEpochMillis(verified.authenticatedAt)).toBe(authenticatedAt.getTime());
        const retired = yield* (yield* CertificateCrypto)
          .generateSigningCertificate()
          .pipe(Effect.provide(TestClock.layer()));
        if (issuer.configuration.idp === null) throw new Error("Expected IdP");
        const overlapping = yield* provider.validateResponse({
          ...issuer,
          configuration: {
            ...issuer.configuration,
            idp: {
              ...issuer.configuration.idp,
              signingCertificates: [
                retired.certificate,
                ...issuer.configuration.idp.signingCertificates,
              ],
            },
          },
          requestId,
          response: issuer.response(requestId),
        });
        expect(overlapping.subject).toBe(verified.subject);
        const metadata = yield* provider.metadata(issuer);
        expect(metadata).toContain('AuthnRequestsSigned="true"');
        expect(metadata).not.toContain("PRIVATE KEY");
        const url = new URL(
          yield* provider.authorizationUrl({
            ...issuer,
            requestId,
            relayState: Redacted.make("browser-state"),
            forceAuthentication: true,
          }),
        );
        expect(url.searchParams.get("Signature")).toBeTruthy();
      }).pipe(Effect.provide(providers)),
    );
  });

  it("extracts one configured signed email and publishes overlapping SP certificates", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const issuer = yield* makeSamlIssuer;
        const provider = yield* SamlIdentity;
        if (issuer.configuration.idp === null) throw new Error("Expected IdP");
        const client = {
          ...issuer,
          configuration: {
            ...issuer.configuration,
            idp: { ...issuer.configuration.idp, emailAttribute: "email" },
          },
        };
        const requestId = "_email-request";
        const verified = yield* provider.validateResponse({
          ...client,
          requestId,
          response: issuer.response(requestId, { emailValues: ["alice@company.example"] }),
        });
        expect(verified.email).toBe("alice@company.example");
        expect(
          yield* provider
            .validateResponse({
              ...client,
              requestId,
              response: issuer.response(requestId, {
                emailValues: ["alice@company.example", "other@company.example"],
              }),
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const replacement = yield* (yield* CertificateCrypto).generateSigningCertificate();
        const metadata = yield* provider.metadata({
          ...client,
          additionalSigningCertificates: [replacement.certificate],
        });
        expect((metadata.match(/<ds:X509Certificate>/g) ?? []).length).toBe(2);
        expect(metadata).not.toContain("PRIVATE KEY");
      }).pipe(Effect.provide(providers)),
    );
  });

  it("rejects correctly signed responses for another audience, recipient or request and requires both signatures", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const issuer = yield* makeSamlIssuer;
        const provider = yield* SamlIdentity;
        const requestId = "_expected-request";
        const audience = yield* provider
          .validateResponse({
            ...issuer,
            requestId,
            response: issuer.response(requestId, { audience: "https://another-sp.test" }),
          })
          .pipe(Effect.flip);
        expect(audience).toMatchObject({ code: "INVALID_FLOW" });
        const recipient = yield* provider
          .validateResponse({
            ...issuer,
            requestId,
            response: issuer.response(requestId, { recipient: "https://another-sp.test/acs" }),
          })
          .pipe(Effect.flip);
        expect(recipient).toMatchObject({ code: "INVALID_FLOW" });
        const correlation = yield* provider
          .validateResponse({ ...issuer, requestId, response: issuer.response("_another-request") })
          .pipe(Effect.flip);
        expect(correlation).toMatchObject({ code: "INVALID_FLOW" });
        const unsignedEnvelope = yield* provider
          .validateResponse({
            ...issuer,
            requestId,
            response: issuer.response(requestId, { assertionOnly: true }),
          })
          .pipe(Effect.flip);
        expect(unsignedEnvelope).toMatchObject({ code: "INVALID_FLOW" });
      }).pipe(Effect.provide(providers)),
    );
  });

  it("rejects signature tampering, expired assertions and XML entity declarations", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        const issuer = yield* makeSamlIssuer;
        const provider = yield* SamlIdentity;
        const requestId = "_expected-request";
        const xml = Buffer.from(Redacted.value(issuer.response(requestId)), "base64").toString(
          "utf8",
        );
        const tampered = Redacted.make(
          Buffer.from(xml.replace("immutable-employee-42", "different-employee")).toString(
            "base64",
          ),
        );
        expect(
          yield* provider
            .validateResponse({ ...issuer, requestId, response: tampered })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const expired = issuer.response(requestId, { expiresAt: new Date(Date.now() - 120_000) });
        expect(
          yield* provider
            .validateResponse({ ...issuer, requestId, response: expired })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        const entities = Redacted.make(
          Buffer.from(
            `<!DOCTYPE Response [<!ENTITY secret SYSTEM "file:///etc/passwd">]>${xml}`,
          ).toString("base64"),
        );
        expect(
          yield* provider
            .validateResponse({ ...issuer, requestId, response: entities })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
      }).pipe(Effect.provide(providers)),
    );
  });
});
