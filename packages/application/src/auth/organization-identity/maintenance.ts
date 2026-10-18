import { DateTime, Effect } from "effect";

import { CertificateCrypto } from "@usepreface/crypto";
import { DatabaseRepository, TransactionService } from "@usepreface/database";
import type { IdentityConnectionId } from "@usepreface/protocol";

import { makeOrganizationSecurityNotifications } from "#/organization/authentication/notifications";

export const makeConnectionMaintenance = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const transaction = yield* TransactionService;
  const certificates = yield* CertificateCrypto;
  const notify = yield* makeOrganizationSecurityNotifications;
  return Effect.fn("Application.auth.connectionMaintenance")(function* (
    after?: IdentityConnectionId,
  ) {
    const connections = yield* repository.auth.identityConnection.scanSaml(after);
    for (const connection of connections) {
      if (connection.status === "disabled") continue;
      const now = DateTime.toEpochMillis(yield* DateTime.now);
      const pems = [
        connection.configuration.signingCertificate,
        ...(connection.configuration.idp?.signingCertificates ?? []),
      ];
      for (const pem of pems) {
        const details = yield* certificates
          .inspectSigningCertificate(pem)
          .pipe(Effect.catchTag("CryptoError", () => Effect.succeed(undefined)));
        if (
          details === undefined ||
          DateTime.toEpochMillis(details.expiresAt) > now + 30 * 86400000
        )
          continue;
        yield* transaction.run(
          Effect.gen(function* () {
            const current = yield* repository.auth.identityConnection.lockById(connection.id);
            if (
              current?.provider !== "saml" ||
              current.revision !== connection.revision ||
              current.status === "disabled" ||
              ![
                current.configuration.signingCertificate,
                ...(current.configuration.idp?.signingCertificates ?? []),
              ].includes(pem)
            )
              return;
            const organization = yield* repository.organization.organization.lockById(
              current.organizationId,
            );
            if (
              organization === undefined ||
              organization.archivedAt !== null ||
              (yield* repository.audit.event.hasCertificateWarning(current.id, details.fingerprint))
            )
              return;
            yield* notify(
              organization,
              "sso-certificate-expiring",
              `${current.id}:${details.fingerprint.replaceAll(":", "").slice(0, 32)}`,
              { connectionName: current.name, certificateExpiresAt: details.expiresAt },
            );
            yield* repository.audit.event.append({
              actorKind: "system",
              actorUserId: null,
              organizationId: organization.id,
              eventType: "auth.connection_certificate_expiring",
              targetType: "identity_connection",
              targetId: current.id,
              metadata: { revision: current.revision, fingerprint: details.fingerprint },
            });
          }),
        );
      }
    }
    return connections.length === 100 ? connections[connections.length - 1]?.id : undefined;
  });
});
