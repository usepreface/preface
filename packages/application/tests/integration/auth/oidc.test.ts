import { expect, layer } from "@effect/vitest";
import { Effect, Redacted, Ref, Schema } from "effect";

import { DatabaseRepository } from "@usepreface/database";
import { TestDatabase } from "@usepreface/database/testing";
import { UpdateOidcConnectionInput } from "@usepreface/protocol/input";

import { Application } from "../../../src/index.js";
import { ApplicationTestLayer } from "../../fixtures/application.js";
import { TestOidc } from "../../fixtures/oidc-provider.js";
import {
  configureTestOidc,
  linkTestOidc,
  oidcCallbackInput,
  signInTestOidc,
} from "../../fixtures/oidc.js";
import {
  createTestIdentity,
  createTestOrganization,
  admitTestMember,
} from "../../fixtures/organization.js";

layer(ApplicationTestLayer)("Organization OIDC", (it) => {
  it.effect(
    "tests configuration without linking, rejects unknown identity, and admits an explicitly linked member",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        expect(connection.status).toBe("active");
        expect(JSON.stringify(connection)).not.toContain("fixture-client-secret");
        expect((yield* application.auth.account.list(owner.actor)).accounts).toEqual([]);
        const unknown = yield* application.auth.oidc.startSignIn(organization.id, connection.id);
        expect(
          yield* application.auth.oidc
            .callback(yield* oidcCallbackInput(unknown))
            .pipe(Effect.flip),
        ).toMatchObject({ code: "IDENTITY_NOT_LINKED" });

        yield* linkTestOidc(owner.actor, organization.id, connection.id);
        const signedIn = yield* signInTestOidc(organization.id, connection.id);
        expect(signedIn.actor.user.id).toBe(owner.actor.user.id);
        expect(yield* application.instance.capabilities.get(signedIn.actor)).toEqual({
          canCreateOrganization: false,
        });
        expect(
          yield* application.organization.organization
            .create(signedIn.actor, { metadata: { name: "Unexpected" }, slug: "unexpected" })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          yield* application.instance.authentication.google.get(signedIn.actor).pipe(Effect.flip),
        ).toMatchObject({ code: "REAUTHENTICATION_REQUIRED" });
        expect(
          (yield* application.organization.organization.get(signedIn.actor, organization.id))
            .organization.id,
        ).toBe(organization.id);
        const reauthentication = yield* application.auth.oidc.startReauthentication(
          signedIn.actor,
          organization.id,
          connection.id,
        );
        yield* application.auth.oidc.callback(
          yield* oidcCallbackInput(reauthentication),
          signedIn.actor,
        );
        expect((yield* application.auth.session.resolve(signedIn.token)).session).toEqual(
          signedIn.actor.session,
        );
        expect(
          yield* application.organization.identityConnection
            .disable(signedIn.actor, organization.id, connection.id, connection.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "REAUTHENTICATION_REQUIRED" });
      }),
  );

  it.effect(
    "keeps connection authority, account linking and accepted evidence scoped to their organization",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const other = yield* application.organization.organization.create(owner.actor, {
          metadata: { name: "Other" },
          slug: "other",
        });
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const outsider = yield* createTestIdentity("outsider@example.test", "Outsider");
        expect(
          yield* application.auth.oidc
            .startLink(outsider.actor, organization.id, connection.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "ORGANIZATION_NOT_FOUND" });
        expect(
          yield* application.organization.identityConnection
            .get(owner.actor, other.organization.id, connection.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "CONNECTION_NOT_FOUND" });
        expect(
          yield* application.organization.authPolicy
            .update(owner.actor, other.organization.id, {
              expectedRevision: 1,
              oidcConnectionIds: [connection.id],
            })
            .pipe(Effect.flip),
        ).toMatchObject({ code: "CONNECTION_UNAVAILABLE" });
        yield* linkTestOidc(owner.actor, organization.id, connection.id);
        const signedIn = yield* signInTestOidc(organization.id, connection.id);
        expect(
          yield* application.organization.organization
            .get(signedIn.actor, other.organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
        expect(
          (yield* application.organization.authPolicy.methods(
            signedIn.actor,
            other.organization.id,
          )).oidc,
        ).toEqual([]);
        const policy = yield* application.organization.authPolicy.get(owner.actor, organization.id);
        yield* application.organization.authPolicy.update(owner.actor, organization.id, {
          expectedRevision: policy.revision,
          oidcConnectionIds: [],
        });
        expect((yield* application.auth.session.resolve(signedIn.token)).user.id).toBe(
          owner.actor.user.id,
        );
        expect(
          yield* application.organization.organization
            .get(signedIn.actor, organization.id)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "AUTHENTICATION_REQUIRED" });
      }),
  );

  it.effect(
    "enforces browser binding, callback protocol and one-time consumption without claiming a mismatched flow",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const started = yield* application.auth.oidc.startLink(
          owner.actor,
          organization.id,
          connection.id,
        );
        const input = yield* oidcCallbackInput(started);
        expect(
          yield* application.auth.google.callback(input, owner.actor).pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        expect(
          yield* application.auth.oidc
            .callback(
              { ...input, browserToken: Redacted.make("wrong-browser".repeat(4)) },
              owner.actor,
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
        yield* application.auth.oidc.callback(input, owner.actor);
        expect(
          yield* application.auth.oidc.callback(input, owner.actor).pipe(Effect.flip),
        ).toMatchObject({ code: "INVALID_FLOW" });
      }),
  );

  it.effect(
    "preserves email and Google policy edits, rejects identity replacement and invalidates old trust revisions",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        yield* linkTestOidc(owner.actor, organization.id, connection.id);
        const signedIn = yield* signInTestOidc(organization.id, connection.id);
        const policy = yield* application.organization.authPolicy.get(owner.actor, organization.id);
        const unchanged = yield* application.organization.authPolicy.update(
          owner.actor,
          organization.id,
          { expectedRevision: policy.revision, googleEnabled: false },
        );
        expect(unchanged.oidcConnectionIds).toEqual([connection.id]);
        expect(unchanged.allowedMethods).toContain("email_code");
        expect(
          yield* application.organization.identityConnection
            .updateOidc(
              owner.actor,
              organization.id,
              connection.id,
              yield* Schema.decodeUnknownEffect(UpdateOidcConnectionInput)({
                expectedRevision: connection.revision,
                issuer: "https://replacement.example.test",
              }),
            )
            .pipe(Effect.flip),
        ).toMatchObject({ code: "IDENTITY_CONFIGURATION_IMMUTABLE" });
        const renamed = yield* application.organization.identityConnection.updateOidc(
          owner.actor,
          organization.id,
          connection.id,
          { expectedRevision: connection.revision, name: "Company login" },
        );
        expect(renamed.revision).toBe(connection.revision);
        expect((yield* application.auth.session.resolve(signedIn.token)).user.id).toBe(
          owner.actor.user.id,
        );
        const refreshed = yield* application.organization.identityConnection.refreshMetadata(
          owner.actor,
          organization.id,
          connection.id,
          connection.revision,
        );
        expect(refreshed.status).toBe("draft");
        expect(
          yield* application.auth.session.resolve(signedIn.token).pipe(Effect.flip),
        ).toMatchObject({ code: "UNAUTHENTICATED" });
        expect(
          yield* application.organization.identityConnection
            .activate(owner.actor, organization.id, connection.id, refreshed.revision)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "CONNECTION_NOT_TESTED" });
        expect((yield* application.auth.session.resolve(owner.sessionToken)).user.id).toBe(
          owner.actor.user.id,
        );
      }),
  );

  it.effect(
    "denies conflicting identities and revokes external-only sessions on member removal and unlink",
    () =>
      Effect.gen(function* () {
        yield* (yield* TestDatabase).reset;
        const application = yield* Application;
        const repository = yield* DatabaseRepository;
        const { owner, organization } = yield* createTestOrganization;
        const connection = yield* configureTestOidc(owner.actor, organization.id);
        const account = yield* linkTestOidc(owner.actor, organization.id, connection.id);
        const member = yield* createTestIdentity("member@example.test", "Member");
        const membership = yield* admitTestMember(organization.id, member.actor.user.id);
        const conflict = yield* application.auth.oidc.startLink(
          member.actor,
          organization.id,
          connection.id,
        );
        expect(
          yield* application.auth.oidc
            .callback(yield* oidcCallbackInput(conflict), member.actor)
            .pipe(Effect.flip),
        ).toMatchObject({ code: "ACCOUNT_ALREADY_LINKED" });
        const provider = yield* TestOidc;
        yield* Ref.update(provider.identity, (identity) => ({
          ...identity,
          subject: "member-oidc",
        }));
        yield* linkTestOidc(member.actor, organization.id, connection.id);
        const memberLogin = yield* signInTestOidc(organization.id, connection.id);
        yield* application.organization.member.remove(owner.actor, organization.id, membership.id);
        expect(
          yield* application.auth.session.resolve(memberLogin.token).pipe(Effect.flip),
        ).toMatchObject({ code: "UNAUTHENTICATED" });
        yield* Ref.update(provider.identity, (identity) => ({
          ...identity,
          subject: "operator-oidc",
        }));
        const ownerLogin = yield* signInTestOidc(organization.id, connection.id);
        yield* application.auth.account.unlink(owner.actor, account.id);
        expect((yield* repository.auth.account.findById(account.id))?.unlinkedAt).not.toBeNull();
        expect(
          yield* application.auth.session.resolve(ownerLogin.token).pipe(Effect.flip),
        ).toMatchObject({ code: "UNAUTHENTICATED" });
      }),
  );
});
