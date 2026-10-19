import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Ref } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { TestDomainDns } from "../../fixtures/domain-dns.js";
import { configureTestOidc } from "../../fixtures/oidc.js";
import { createTestIdentity, createTestOrganization } from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("Organization email authority", (it) => {
  it.effect(
    "verifies current DNS challenges, binds exact connection authority and retires it on revocation",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const domain = yield* application.organization.domain.create(owner.actor, organization.id, {
          domain: "company.example.test",
        });
        const replaced = yield* application.organization.domain.request(
          owner.actor,
          organization.id,
          domain.id,
          domain.revision,
        );
        const current = yield* application.organization.domain.request(
          owner.actor,
          organization.id,
          domain.id,
          replaced.domain.revision,
        );
        yield* Ref.set((yield* TestDomainDns).records, [Redacted.value(replaced.token)]);
        expect(
          yield* application.organization.domain
            .verify(owner.actor, organization.id, domain.id, current.domain.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "DOMAIN_VERIFICATION_FAILED" });
        yield* Ref.set((yield* TestDomainDns).records, [Redacted.value(current.token)]);
        const verified = yield* application.organization.domain.verify(
          owner.actor,
          organization.id,
          domain.id,
          current.domain.revision,
        );
        expect(verified.verificationMethod).toBe("dns");
        yield* application.organization.domain.bind(owner.actor, organization.id, connection.id, {
          expectedRevision: connection.revision,
          domainIds: [domain.id],
        });
        expect(
          (yield* repository.organization.domain.forConnection(
            organization.id,
            connection.id,
            connection.revision,
          )).map((entry) => entry.domain),
        ).toEqual(["company.example.test"]);
        yield* application.organization.domain.revoke(
          owner.actor,
          organization.id,
          domain.id,
          verified.revision,
        );
        expect(
          yield* repository.organization.domain.forConnection(
            organization.id,
            connection.id,
            connection.revision,
          ),
        ).toEqual([]);
      }),
  );

  it.effect(
    "keeps manual approval behind instance ownership and rejects revoked domain bindings",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const outsider = yield* createTestIdentity("outsider@example.test", "Outsider");
        const domain = yield* application.organization.domain.create(owner.actor, organization.id, {
          domain: "internal.example.test",
        });
        expect(
          yield* application.organization.domain
            .verify(outsider.actor, organization.id, domain.id, domain.revision, "operator")
            .pipe(Effect.flip),
        ).toMatchObject({ code: "FORBIDDEN" });
        yield* application.organization.domain.verify(
          owner.actor,
          organization.id,
          domain.id,
          domain.revision,
          "operator",
        );
        const claims = yield* application.organization.domain.list(owner.actor, organization.id);
        const verified = claims.domains.find((claim) => claim.id === domain.id);
        if (!verified) throw new Error("Expected verified claim");
        yield* application.organization.domain.revoke(
          owner.actor,
          organization.id,
          domain.id,
          verified.revision,
        );
        expect(
          yield* application.organization.domain
            .bind(owner.actor, organization.id, connection.id, {
              expectedRevision: connection.revision,
              domainIds: [domain.id],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "DOMAIN_NOT_VERIFIED" });
        expect(
          (yield* application.organization.domain.connectionDomains(
            owner.actor,
            organization.id,
            connection.id,
          )).domains,
        ).toEqual([]);
      }),
  );
});
