import { Context, DateTime, Effect, Layer, Redacted, Ref } from "effect";

import { IdentityError } from "@usepreface/protocol";

import { SamlIdentity } from "../../src/auth/saml/provider.js";

const makeTestSaml = Effect.gen(function* () {
  const identity = yield* Ref.make<{
    readonly issuer: string;
    readonly subject: string;
    readonly email?: string | null;
    readonly authenticatedAt?: DateTime.Utc | null;
    readonly sessionExpiresAt?: DateTime.Utc | null;
    readonly responseId?: string;
    readonly assertionId?: string;
  }>({ issuer: "https://saml.example.test", subject: "immutable-employee-42" });
  const gate = yield* Ref.make<Effect.Effect<void>>(Effect.void);
  return { identity, gate };
});
export class TestSaml extends Context.Service<TestSaml, Effect.Success<typeof makeTestSaml>>()(
  "TestSaml",
) {
  static readonly layer = Layer.effect(TestSaml, makeTestSaml);
}
export const SamlTestProvider = Layer.effect(
  SamlIdentity,
  Effect.gen(function* () {
    const test = yield* TestSaml;
    return SamlIdentity.of({
      validateConfiguration: (idp) => Effect.succeed(idp),
      metadata: (input) =>
        Effect.succeed(
          `<EntityDescriptor entityID="${input.configuration.entityId}">${[input.configuration.signingCertificate, ...(input.additionalSigningCertificates ?? [])].join("\n")}</EntityDescriptor>`,
        ),
      authorizationUrl: Effect.fnUntraced(function* (input) {
        yield* Effect.void;
        if (input.configuration.idp === null)
          return yield* new IdentityError({ code: "INVALID_CONFIGURATION" });
        const url = new URL(input.configuration.idp.signOnUrl);
        url.searchParams.set("RelayState", Redacted.value(input.relayState));
        url.searchParams.set("SAMLRequest", input.requestId);
        url.searchParams.set("ForceAuthn", String(input.forceAuthentication));
        return url.href;
      }),
      validateResponse: Effect.fnUntraced(function* (input) {
        yield* yield* Ref.get(test.gate);
        const identity = yield* Ref.get(test.identity);
        const now = yield* DateTime.now;
        if (identity.authenticatedAt === null)
          return yield* new IdentityError({ code: "INVALID_FLOW" });
        return {
          email: identity.email ?? null,
          issuer: identity.issuer,
          subject: identity.subject,
          authenticatedAt: identity.authenticatedAt ?? now,
          sessionExpiresAt: identity.sessionExpiresAt ?? null,
          validUntil: DateTime.addDuration(now, "5 minutes"),
          responseId: identity.responseId ?? `response-${input.requestId}`,
          assertionId: identity.assertionId ?? `assertion-${input.requestId}`,
        };
      }),
    });
  }),
).pipe(Layer.provideMerge(TestSaml.layer));
