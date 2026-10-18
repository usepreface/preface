import { DateTime, Effect } from "effect";

import { CertificateCrypto } from "@usepreface/crypto";
import { DatabaseRepository } from "@usepreface/database";
import {
  IdentityError,
  type IdentityConnectionId,
  type OrganizationId,
} from "@usepreface/protocol";
import type { SessionActor, CertificateHealth } from "@usepreface/protocol/dto";

import { OrganizationAccess } from "#/organization/access";

export const makeConnectionHealth = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  const access = yield* OrganizationAccess;
  const certificates = yield* CertificateCrypto;
  return Effect.fn("Application.organization.identityConnection.health")(function* (
    actor: SessionActor,
    organizationId: OrganizationId,
    id: IdentityConnectionId,
  ) {
    yield* access.requireOwner(actor, organizationId);
    const connection = yield* repository.auth.identityConnection.findByOrganizationAndId(
      organizationId,
      id,
    );
    if (connection === undefined) return yield* new IdentityError({ code: "CONNECTION_NOT_FOUND" });
    const approved =
      yield* repository.organization.authPolicyConnection.listByOrganization(organizationId);
    const bindings = yield* repository.organization.domain.forConnection(
      organizationId,
      id,
      connection.revision,
    );
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    const health: CertificateHealth[] = [];
    if (connection.provider === "saml") {
      for (const certificate of [
        { role: "sp" as const, pem: connection.configuration.signingCertificate },
        ...(connection.configuration.idp?.signingCertificates ?? []).map((pem) => ({
          role: "idp" as const,
          pem,
        })),
      ]) {
        const details = yield* certificates
          .inspectSigningCertificate(certificate.pem)
          .pipe(Effect.catchTag("CryptoError", () => Effect.succeed(undefined)));
        const status =
          details === undefined
            ? "invalid"
            : DateTime.toEpochMillis(details.expiresAt) <= now
              ? "expired"
              : DateTime.toEpochMillis(details.notBefore) > now
                ? "not_yet_valid"
                : DateTime.toEpochMillis(details.expiresAt) <= now + 30 * 86400000
                  ? "expiring"
                  : "valid";
        health.push({
          role: certificate.role,
          fingerprint: details?.fingerprint ?? null,
          expiresAt: details?.expiresAt ?? null,
          status,
        });
      }
    }
    return {
      id,
      provider: connection.provider,
      status: connection.status,
      revision: connection.revision,
      testedRevision: connection.testedRevision,
      testedAt: connection.testedAt,
      approved: approved.some((entry) => entry.identityConnectionId === id),
      domainProofAvailable: bindings.length > 0,
      certificates: health,
    };
  });
});
