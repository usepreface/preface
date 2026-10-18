# @usepreface/application

Effect workflows for Preface instance setup, email sign-in, sessions and organizations. Requires Node.js 24,
Effect v4 and workspace database, crypto and email services. This private package
coordinates business policy, transactions and audit without starting a server.

## Composition

Install workspace dependencies with `pnpm install`. Supply `DatabaseRepository`,
`TransactionService`, completed `DatabaseMigration`, `TokenService`, `TokenCrypto`,
`SecretCrypto`, `EmailJobs`, `GoogleIdentity`, `OidcIdentity` and `AuthenticationLinks` to `Application.layer`. Supply platform crypto from
the Node runtime edge. The server's complete composition is in
[its runtime module](../../apps/server/src/runtime.ts).

`@usepreface/application/node` exports `NodeToken.layer` and `NodeGoogleIdentity.layer`, adapting shared token
primitives while preserving Preface credential formats. Cryptographic operations
belong to `@usepreface/crypto`; durable email intent belongs to `@usepreface/emails`.
Application workflows require neither a delivery provider nor renderer. The server
starts delivery separately, after migrations and startup preparation.
`AuthenticationLinks` supplies the trusted public origin used to build sign-in links.

Supply `DomainDns` for organization-domain verification. The Node entry exports
`NodeDomainDns.layer`, which performs bounded, cancellable TXT resolution. Tests can replace
only this capability. `application.organization.domain` exposes `list`, `create`, `request`,
`verify`, `revoke`, `connectionDomains` and `bind`. Organization mutations require owner
authority and recent local email; `verify(..., "operator")` requires instance ownership.
Verification and exact connection binding are separate and do not grant membership.

## Instance setup

```ts
import { Effect } from "effect";

import { Application } from "@usepreface/application";

// Run within the application's configured Effect runtime.
export const prepareInstance = Effect.gen(function* () {
  const application = yield* Application;
  return yield* application.instance.bootstrap.prepare();
});
```

`application.instance.bootstrap` exposes:

| Method                       | Behavior                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `prepare()`                  | Initialize installation/settings, issue a missing/expired proof, preserve a valid pending proof.           |
| `getStatus()`                | Return `{ state: "setup_required" \| "ready", instanceName }`.                                             |
| `inspectToken(token)`        | Check the current redacted operator proof and return its expiry.                                           |
| `requestVerification(input)` | Store pending account details and enqueue a setup code; return challenge identity, expiry and resend time. |
| `resendVerification(input)`  | Replace the current challenge/code after the shared cooldown.                                              |
| `complete(input)`            | Verify code, atomically create verified owner/session and consume setup authority.                         |
| `reissueToken()`             | Operator-only proof replacement; cancel pending challenge/email; refuse completed setup.                   |

Preparation returns `{ state: "ready" }`, `{ state: "pending", expiresAt }`, or
`{ state: "issued", expiresAt, token }`. Only issuance returns the raw redacted proof.
Replicas serialize on installation; restart cannot reconstruct a pending credential.
A lost startup link requires explicit reissue or expiry. The server builds/prints the
operator URL after commit. Keep replacement behind the local CLI, not a public API.

Decode wire requests through `RequestBootstrapVerificationInput`,
`ResendBootstrapVerificationInput` and `CompleteBootstrapInput` from
`@usepreface/protocol/input`. Names trim, email trims/lowercases, and credentials
become non-encodable `Redacted` values. Sanitize validation failures at transport.

Request accepts `{ token, instanceName, ownerName, email }`. It creates no user/session.
Its challenge, encrypted email job and audit event commit together. The returned
`{ challengeId, expiresAt, resendAt }` contains no code. Verification codes have eight
digits, ten-minute expiry bounded by the operator proof, a one-minute resend cooldown
and five durable attempts. The code HMAC includes challenge identity and uses the
shared independent HMAC key. Replacement invalidates prior code identity. Wrong-code
attempts and failure audit commit before returning `INVALID_CODE`.

Completion accepts `{ token, challengeId, code }` and returns `{ actor, sessionToken }`.
The transaction locks installation, rechecks proof and code, writes the verified user,
verified primary email, owner grant, display name, session, authentication evidence and required audit, then consumes both credentials.
No password credential is created. Audit failure rolls back the entire operation;
concurrent completion admits one winner. Final consumption rechecks expiry.
Completion creates no organization or organization access.

Encode `actor` with `SessionActor` from `@usepreface/protocol/dto` for ISO timestamps.
It contains only safe user/profile and session identity/expiry. Unwrap `sessionToken`
only at the server cookie boundary; never serialize the entire application result.

`BootstrapError` has `INVALID_INPUT`, `INVALID_TOKEN`, `INVALID_CODE`,
`VERIFICATION_RATE_LIMITED`, `ALREADY_COMPLETED` and `EMAIL_UNAVAILABLE`.
Only the canonical email uniqueness violation maps to `EMAIL_UNAVAILABLE`.
Infrastructure failures remain distinct and must not expose SQL or secret inputs.
A lost successful completion response cannot be replayed for another session.

## Email sign-in

`application.auth.emailSignIn` exposes `request(input)`, `resend(input)` and `verify(input)`.
Decode their inputs with the matching schemas from `@usepreface/protocol/input`.
Request accepts normalized email; resend requires challenge identity and redacted browser token.
Both return `{ challenge: { challengeId, expiresAt }, browserToken }`; the server delivers
`browserToken` only as an HttpOnly temporary cookie. No code or link is returned publicly.

Existing enabled users with a verified, active, login-enabled address receive an encrypted
sign-in email containing an eight-digit code and a trusted fragment link. Unknown/unusable
addresses receive a decoy challenge and no email; sign-in never enrolls a new user. A returning
operator keeps the same identity/ownership after session expiry, even with no organization.

Verification accepts `{ challengeId, browserToken, method: "code", code }` or
`{ challengeId, browserToken, method: "magic_link", token }`, with redacted credentials.
Proofs last ten minutes, allow five failed attempts and are single-use across both methods.
Replacement invalidates the prior proof and email intent. Sign-in has no resend cooldown.
Fresh account/source checks, session/evidence creation, proof consumption and required audit
share a transaction. Wrong-credential attempts commit before the public failure.
Success returns `{ actor, sessionToken }` for cookie delivery only.

`EmailSignInError` codes are `INVALID_INPUT`, `INVALID_PROOF`, `INSTANCE_NOT_READY` and
`ALREADY_AUTHENTICATED` (the server rejects sign-in from a valid authenticated browser).
Storage and crypto failures remain operational failures. The future frontend must consume the
fragment at `/auth/email/verify`; the backend does not render that page.

## Sessions

`application.auth.session.resolve(token)` accepts a redacted credential and returns
`SessionActor`. It freshly checks digest, revocation, absolute/idle expiry and user
usability, usable authentication evidence and its current email or linked-account/connection source. Throttled activity writes cannot revive idle-expired sessions or extend
absolute expiry. Invalid credentials produce `AuthenticationError/UNAUTHENTICATED`;
operational failures retain their type.

`revokeCurrent(actor)` revokes the actor's matching session and writes its audit event
atomically. Repeated calls succeed without another event. Supply authenticated actors,
never request-body identities. The server clears the cookie after success.

`list(actor, { cursor?, limit? })` returns safe active-session pages (25 by default, maximum 100).
`revoke(actor, sessionId)` is scoped to the actor's user. `revokeAll(actor)` revokes sessions and
their evidence with required per-session audit. Issuance and revoke-all share a user-row lock.
Sessions alone imply neither instance ownership nor organization membership.

## Organizations

Only instance owners may create organizations. Supply a cookie-authenticated actor;
workflows recheck current session/user, membership, evidence and role bindings.
Instance ownership does not grant access to another organization's content or administration.

```ts
import { Effect, Schema } from "effect";

import { Application } from "@usepreface/application";
import type { SessionActor } from "@usepreface/protocol/dto";
import { CreateOrganizationInput } from "@usepreface/protocol/input";

export const createOrganizationForOwner = Effect.fn("createOrganizationForOwner")(function* (
  actor: SessionActor,
) {
  const input = yield* Schema.decodeUnknownEffect(CreateOrganizationInput)({
    metadata: { name: "Knowledge" },
    slug: "knowledge",
  });
  return yield* (yield* Application).organization.organization.create(actor, input);
});
```

Creation returns `{ organization, membership, access }` with Effect timestamps. The
transaction creates the creator membership, built-in organization and team role definitions,
explicit owner grant and default local-email auth policy with required audit.
`instance.capabilities.get(actor)` returns `{ canCreateOrganization }`.

`application.organization` exposes:

- `organization`: `create`, `listMine`, `get`, `getAccess`, `update`, `archive`, `restore`.
- `member`: `list`, `suspend`, `reinstate`, `remove`, `leave`.
- `role`: `list`, `create`, `update`, `archive` for custom definitions.
- `roleBinding`: `grant`, `revoke` for direct member assignments.
- `ownership`: protected `grant`, `revoke`, `transfer` workflows.
- `authPolicy.get`: read the currently enforced policy.
- `team`: `create`, `list`, `get`, `getAccess`, `update`, `archive`, `listRoles`, plus `member.add/list/remove`.
- `invitation`: `create`, `list`, `inspect`, `resend`, `revoke`, `requestVerification`, `accept`.

List inputs use an exclusive ID `cursor` and `limit` (default 25, maximum 100).
Organization/role lists accept `includeArchived`; member lists accept `includeRemoved`.
Only owners can discover archived organizations. Normal access remains blocked until restore.

Mutations serialize on organization identity and recheck authority after locking.
Owner removal/suspension/departure/revocation preserves another usable owner.
Transfer grants the target owner, demotes the source to administrator and audits
atomically. Custom roles cannot manufacture ownership or delegate permissions the
actor lacks. Role retirement and member removal revoke assignments transactionally;
suspension preserves them for explicit reinstatement.

Teams use direct memberships and explicitly scoped roles. The authentication workflows below own
SSO and policy editing. Organization content permissions are not implemented. See the
[organization architecture](../../architecture/identity-access/organizations.md) for boundaries.

## Invitations

`invitation.create(actor, organizationId, { email, roleIds, teams? })` requires current member
management and role assignment permissions. It returns a safe invitation summary;
the token is delivered only in the encrypted invitation email. Roles must be active,
delegable and belong to the organization; ownership is excluded. Creating another
pending invitation for that email revokes the previous one atomically. Optional `teams` entries
contain `{ teamId, roleIds? }`; omission of role IDs selects the built-in team member role.
Acceptance rechecks current team state, original inviter authority and all role permissions.

`list(actor, organizationId, { cursor?, limit? })` includes lifecycle history.
`resend(actor, organizationId, invitationId)` rotates the token and retires old proofs;
`revoke` uses the same arguments and permanently closes a pending invitation.

Decode `{ invitationId, token }` with `InvitationTokenInput`. `inspect(input)` returns
organization identity/name and expiry. `requestVerification(input)` emails a code/link
and returns `{ challenge, browserToken }` for a separate HttpOnly cookie.
Decode acceptance with `AcceptInvitationInput`: invitation ID/token, challenge ID,
browser token, display name, and either `method: "code", code` or
`method: "magic_link", proofToken`. `accept(input, actor?)` requires the matching
mailbox proof, rechecks current inviter/roles/policy and returns
`{ actor, sessionToken, organizationId, memberId }`. Deliver the session token only
as a cookie. A supplied signed-in actor must match the invited existing identity.
New identities are created only here or by first-owner setup. Existing profiles are
preserved; suspended members cannot bypass suspension; removed members regain only
approved invitation roles. Audit failure rolls back admission and consumption.
See [invitation architecture](../../architecture/identity-access/invitations.md).

## Profiles and teams

`auth.profile.get(actor)` returns the current safe profile. `update(actor, { metadata })`
merges name/title/bio patches under the user lock; `null` clears title/bio. It preserves
omitted fields, the stored version and image reference. Profile changes require audit.
Email and account authority are separate from presentation metadata.

Team creation requires organization `teams.manage`; the creator joins and receives the
team administrator role atomically. Team member addition accepts an already-active
organization member and grants the built-in team member role. Removal revokes only that
team's grants. Organization removal also removes all team memberships and grants.
Scoped role bindings use `{ memberId, roleId, teamId }`; omit `teamId` for organization
grants. Team role definitions use `scopeKind: "team"`. Team grants cannot grant organization
permissions. See [teams and profiles](../../architecture/identity-access/teams-profiles.md).

## Credential policy

| Policy                    | Value                                       |
| ------------------------- | ------------------------------------------- |
| Operator proof            | 30 minutes                                  |
| Setup code                | 10 minutes, bounded by proof expiry         |
| Organization invitation   | 7 days; resend replaces token and expiry    |
| Invitation email proof    | 10 minutes, bounded by invitation expiry    |
| Email sign-in proof       | 10 minutes; code and link share consumption |
| Setup resend cooldown     | 1 minute                                    |
| Code attempt budget       | 5 per challenge                             |
| Session absolute lifetime | 30 days                                     |
| Session idle timeout      | 7 days                                      |
| Activity write interval   | 5 minutes                                   |

Opaque tokens use 32 random bytes and purpose-separated SHA-256 digests. Shared crypto
owns secure randomness, constant-time verification, HMAC and encryption. Keep its two
independent keys stable across replicas/restarts and back them up with the database.

## Google identity

Supply `GoogleIdentity` to `Application.layer`; the Node entry exports `NodeGoogleIdentity.layer`
backed by `openid-client`. The adapter validates the code/PKCE/nonce exchange and signed identity
against fixed Google endpoints. Tokens and provider credentials are not public results.

`instance.authentication.google` exposes `get`, `save`, `test`, `activate` and `disable`.
Save input comes from `SaveGoogleConnectionInput`: expected revision (zero for first save), client
ID, optional redacted client secret and name. First save requires the secret; omission on update
preserves it. A save creates a draft/new revision and invalidates prior flows/evidence. Complete
the returned test authorization URL in a browser, then activate its tested revision. Mutations
require current instance ownership and email evidence no older than five minutes.

`auth.account.list(actor)` returns safe connection summaries. `startGoogle(actor, {})` starts
explicit linking; `unlink(actor, accountId)` retains history and revokes Google evidence. Linking
and unlinking require recent email proof. `auth.google.start({}, actor?)` is signed-out only;
`callback(input, actor?)` is for the server's browser-bound transport. Callback results can contain
an internal session token: unwrap only for cookie delivery. Unknown Google identities create no
users or memberships. Provider email never merges accounts or replaces Preface email/profile.

`auth.reauthentication.google(actor, {})` adds Google proof for the current user.
`auth.reauthentication.email.request/resend/verify` uses existing email proof inputs and binds them
to the current session. Success adds email evidence without a new session or expiry extension.
`organization.authPolicy.methods/update` exposes effective availability and revision-checked
`{ expectedRevision, googleEnabled }` updates. Only organization owners may update; email remains
available and global Google configuration must be active to enable it.

See [Google architecture](../../architecture/identity-access/google.md) for transactions,
revocation, test behavior, safe errors and remaining enterprise SSO limits.

## Verification

```sh
pnpm --filter @usepreface/application typecheck
pnpm --filter @usepreface/application lint
pnpm --filter @usepreface/application test
pnpm --filter @usepreface/application test:built
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/application test
```

Tests compose real repositories, crypto, encrypted email intent and deterministic clocks.
They cover proof/code replacement, expiry, concurrent completion/attempts, audit rollback
and session lifecycle. The explicit PostgreSQL lane uses disposable test configuration
and sequential files; never target a deployment database. Built tests exercise packaged
migrations and the verification/session lifecycle.

Backend-connected onboarding/sign-in UI, image uploads, global account recovery
are not implemented. See the [instance setup architecture](../../architecture/identity-access/instance-setup.md)
and [server README](../../apps/server/README.md) for current transport and deployment.

## Organization OIDC

Supply `OidcIdentity` to `Application.layer`. The Node entry exports
`NodeOidcIdentity.layer(allowedPrivateOrigins?)`, using the existing `openid-client` dependency.
It supports HTTPS discovery, authorization code/PKCE S256, RS256 ID tokens and
`client_secret_basic`/`client_secret_post`. Private origins require an operator allowlist;
TLS verification remains enabled. The adapter performs no network request at construction.

`organization.identityConnection` exposes `list`, `get`, `createOidc`, `updateOidc`, `test`,
`activate`, `disable` and `refreshMetadata`. Creation takes actor, organization ID and decoded
`CreateOidcConnectionInput`; updates use `UpdateOidcConnectionInput`. Inputs redact secrets.
All mutations require current organization ownership and recent local email. Discovery occurs
outside SQL, followed by fresh locked authority/revision checks and required audit. Test the exact
revision in a browser before activation. After first activation, issuer/client ID are immutable;
use another connection to replace the identity space. Trust changes invalidate testing/evidence;
display-name-only changes preserve them. No hard deletion is exposed.

Approve an active connection with `organization.authPolicy.update(actor, organizationId,
{ expectedRevision, oidcConnectionIds })`; the list replaces accepted OIDC connections. Omission
preserves it, including when editing only Google. Email remains enabled. `methods` returns safe
approved connection labels, availability and current-user link state to active members.

`auth.oidc.startLink(actor, organizationId, connectionId, {})` requires active membership and recent
email. `startSignIn(organizationId, connectionId, {}, actor?)` rejects authenticated browsers and
requires a previously linked identity at completion. `startReauthentication(actor, organizationId,
connectionId, {})` proves the current user again. The server owns flow cookies and calls
`callback(input, actor?)`; successful sign-in credentials are for cookie delivery only. Linking
and reauthentication do not extend session lifetime. No user/membership is created by OIDC and
provider email never merges accounts. Organization access requires the exact approved connection.

See [OIDC architecture](../../architecture/identity-access/oidc.md) for transactions, outbound
restrictions and supported limits. Adapter HTTPS tests require `openssl` to generate an ephemeral
certificate; they change certificate trust only inside their test process and clean it up.

## Required SSO and owner recovery

`organization.authPolicy.update` accepts decoded `UpdateOrganizationAuthPolicyInput`, including
`ssoMode: "optional" | "required"` and `ssoMaxAgeSeconds` (default 43,200; range 300–604,800).
Existing Google policy input names remain aliases. Omitted settings are preserved. The installation
Google connection does not satisfy required organization SSO.

Before enabling, approve an active tested OIDC or SAML connection, link the owner's identity, complete
`auth.oidc.startReauthentication`/callback, and issue a credential through
`organization.authRecovery.rotate(actor, organizationId)`. Save the redacted credential securely;
ordinary reads cannot retrieve it. Pass it as `recoveryCredential` with the current policy revision
and `ssoMode: "required"`. Enablement requires provider authentication and local email evidence no
older than five minutes. `authPolicy.readiness` reports current blockers; `authPolicy.methods`
remains available to active members before satisfying SSO and reports the next action.

`organization.authRecovery.get` returns the current owner's active credential identity/time.
`rotate` replaces it atomically; `revoke` rejects removal of the final required recovery path.
`recover(actor, organizationId, decoded RecoverOrganizationAuthInput)` requires current ownership,
recent email, current policy revision and the offline credential, independently of provider access.
It consumes the credential, makes SSO optional, and commits audit plus owner email jobs together.
Recovery also permits archived organizations without restoring them. There is no automatic fallback.

Invitations still verify the mailbox and admit membership/assignments. Required organizations return
`nextAction: "authenticate_with_sso"`; the member must link and authenticate before using their roles.
Owner/connection/account mutations preserve a prepared recovery owner under the organization lock.
See [required SSO architecture](../../architecture/identity-access/required-sso.md) for boundaries,
credential loss, archival and provider revocation limits.

## Organization SAML

Supply `SamlIdentity` and `CertificateCrypto` to `Application.layer`; Node implementations are
`NodeSamlIdentity.layer` and `NodeCertificateCrypto.layer`. Node-SAML verifies signed XML; the XML
DOM adapter reads only its verified assertion. No new environment variables are required.

`organization.identityConnection.createSaml(actor, organizationId, { name })` returns a draft
with generated signing certificate, fixed entity/ACS URLs and metadata URL. Import that metadata
into the IdP, then call `updateSaml` with decoded `UpdateSamlConnectionInput`: expected revision
and optional name/IdP settings. IdP settings contain entity ID, HTTPS sign-on URL, pinned signing
certificates and stable NameID format. Run `test`, complete the browser transaction, and `activate`
the exact tested revision. Approve it with `{ expectedRevision, samlConnectionIds: [id] }` through
`organization.authPolicy.update`. Existing omitted OIDC/SAML approvals are preserved independently.

`auth.saml.startLink`, `startSignIn` and `startReauthentication` follow their OIDC counterparts.
The transport calls `callback(connectionId, decoded SamlCallbackInput)` for the IdP form POST,
then `complete(decoded CompleteSamlFlowInput, actor?)` on the browser's same-origin return.
Callback only stages encrypted verified context; completion requires the original browser proof
and appropriate session binding. Sign-in credentials are internal cookie-delivery results.
No external identity creates users, memberships or roles. Required SSO and offline recovery work
with approved SAML connections through the same policy and safeguards.

The initial profile requires signed Response and Assertion, RSA-SHA256/SHA512, plaintext assertions,
and persistent or explicitly unspecified stable NameID. Certificates must remain valid. Call
`rotateSigningKey(actor, organizationId, connectionId, expectedRevision)` before SP expiry, import
the new metadata into the IdP, and retest. Trust changes revoke evidence and preserve the final
owner recovery path. See [SAML architecture](../../architecture/identity-access/saml.md) for certificate
rollover, browser transport, replay protection and unsupported profiles.
