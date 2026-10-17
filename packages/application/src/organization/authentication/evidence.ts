import { DateTime, Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import type { IdentityConnectionId } from "@usepreface/protocol";
import type { OrganizationAuthPolicy, SessionAuthentication } from "@usepreface/protocol/model";

// Source lifecycle/revision checks belong to listUsableBySessionId. This evaluates organization policy.
export const makeOrganizationAuthenticationEvidence = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return Effect.fn("OrganizationAuthenticationEvidence.evaluate")(function* (
    policy: OrganizationAuthPolicy,
    evidence: readonly SessionAuthentication[],
    connectionIds: readonly IdentityConnectionId[],
    maxAgeSeconds = policy.ssoMaxAgeSeconds,
  ) {
    const now = DateTime.toEpochMillis(yield* DateTime.now);
    let accepted = false;
    let ssoLinkedEvidence = false;
    let freshSso = false;
    for (const proof of evidence) {
      if (proof.method !== "oidc") {
        if (
          policy.ssoMode === "optional" &&
          policy.allowedMethods.includes(
            proof.method === "bootstrap_email_code" ? "email_code" : proof.method,
          )
        )
          accepted = true;
        continue;
      }
      if (!policy.allowedMethods.includes("oidc")) continue;
      const account = yield* repository.auth.account.findById(proof.accountId);
      if (account === undefined || !connectionIds.includes(account.identityConnectionId)) continue;
      ssoLinkedEvidence = true;
      const authenticatedAt = proof.providerAuthenticatedAt;
      if (authenticatedAt !== null && authenticatedAt !== undefined) {
        const age = now - DateTime.toEpochMillis(authenticatedAt);
        if (age >= -60_000 && age <= maxAgeSeconds * 1000) freshSso = true;
      }
      if (policy.ssoMode === "optional") accepted = true;
    }
    return { accepted: accepted || freshSso, freshSso, ssoLinkedEvidence };
  });
});
