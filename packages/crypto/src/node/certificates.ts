import "reflect-metadata";
import { X509Certificate, webcrypto } from "node:crypto";

import { DateTime, Effect, Layer, Redacted } from "effect";

import { X509CertificateGenerator, KeyUsagesExtension, KeyUsageFlags } from "@peculiar/x509";

import { CertificateCrypto } from "#/certificates";
import { CryptoError } from "#/errors";

export const NodeCertificateCrypto = {
  layer: Layer.succeed(
    CertificateCrypto,
    CertificateCrypto.of({
      generateSigningCertificate: Effect.fn("CertificateCrypto.generateSigningCertificate")(
        function* () {
          const now = yield* DateTime.now;
          const expiresAt = DateTime.addDuration(now, "365 days");
          return yield* Effect.tryPromise({
            try: async () => {
              const keys = await webcrypto.subtle.generateKey(
                {
                  name: "RSASSA-PKCS1-v1_5",
                  modulusLength: 2048,
                  publicExponent: new Uint8Array([1, 0, 1]),
                  hash: "SHA-256",
                },
                true,
                ["sign", "verify"],
              );
              const certificate = await X509CertificateGenerator.createSelfSigned(
                {
                  name: "CN=Preface signing certificate",
                  keys,
                  notBefore: DateTime.toDateUtc(DateTime.subtractDuration(now, "1 minute")),
                  notAfter: DateTime.toDateUtc(expiresAt),
                  extensions: [new KeyUsagesExtension(KeyUsageFlags.digitalSignature, true)],
                },
                webcrypto,
              );
              const privateKey = Buffer.from(
                await webcrypto.subtle.exportKey("pkcs8", keys.privateKey),
              ).toString("base64");
              return {
                privateKey: Redacted.make(
                  `-----BEGIN PRIVATE KEY-----\n${privateKey.match(/.{1,64}/g)?.join("\n")}\n-----END PRIVATE KEY-----`,
                ),
                certificate: certificate.toString("pem"),
                expiresAt,
              };
            },
            catch: () => new CryptoError({ operation: "certificate" }),
          });
        },
      ),
      validateSigningCertificates: Effect.fn("CertificateCrypto.validateSigningCertificates")(
        function* (certificates) {
          const now = DateTime.toEpochMillis(yield* DateTime.now);
          return yield* Effect.try({
            try: () =>
              certificates.map((pem) => {
                if (
                  (pem.match(/-----BEGIN CERTIFICATE-----/g) ?? []).length !== 1 ||
                  !pem.trim().endsWith("-----END CERTIFICATE-----")
                )
                  throw new Error("Expected one certificate");
                const certificate = new X509Certificate(pem);
                if (
                  certificate.publicKey.asymmetricKeyType !== "rsa" ||
                  (certificate.publicKey.asymmetricKeyDetails?.modulusLength ?? 0) < 2048 ||
                  certificate.validFromDate.getTime() > now ||
                  certificate.validToDate.getTime() <= now
                )
                  throw new Error("Unusable signing certificate");
                return certificate.toString();
              }),
            catch: () => new CryptoError({ operation: "certificate" }),
          });
        },
      ),
    }),
  ),
} as const;
