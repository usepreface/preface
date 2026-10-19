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
authority and a current authenticated session; `verify(..., "operator")` requires instance ownership.
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
| `getStatus()`                | Return `{ state: "setup_required" \| "ready", organizationName }`.                                         |
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

Request accepts `{ token, organizationName, ownerName, email }`. It creates no user/session.
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
Completion creates the sole organization and explicitly grants its owner membership.

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
Storage and crypto failures remain operational failures. The dashboard consumes the
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

Installation verification initializes the sole organization, owner membership,
built-in roles and default policy atomically. There is no general organization-create,
list, select, archive or restore workflow. `application.organization.organization`
exposes `currentId`, `get`, `getAccess` and `update`; internal callers pass the resolved
organization ID explicitly. `update` patches versioned presentation metadata.

Current membership, permissions, authentication policy and last-owner protection
remain authoritative. `application.instance.capabilities.get(actor)` returns
`{ isInstanceOwner }`; it does not grant organization membership. Organization/member,
role, team, ownership and invitation workflows remain grouped under the existing
application aggregate. See the [organization architecture](../../architecture/identity-access/organizations.md).

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

`application.instance.authentication.google` retains the provider-specific aggregate
for `get`, `save`, `test`, `activate` and `disable`. Its connection is organization-owned
and every configuration operation checks current organization ownership. Save accepts
`SaveGoogleConnectionInput`; secrets stay redacted and encrypted. Test the exact revision
before activation, then enable Google in the single authentication policy.

`auth.account.startGoogle` explicitly links the current member; `auth.google.start`
starts signed-out sign-in. Callback completion checks browser binding, current
membership, account conflicts and policy. Invitation-authorized enrollment can admit a
new user; ordinary provider authentication cannot create membership. Unlink revokes its
source evidence. Administrative email reauthentication is not part of this API.

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

The dashboard connects these workflows. Image uploads and global account recovery
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
All mutations require current organization ownership and a current authenticated session. Discovery occurs
outside SQL, followed by fresh locked authority/revision checks and required audit. Test the exact
revision in a browser before activation. After first activation, issuer/client ID are immutable;
use another connection to replace the identity space. Trust changes invalidate testing/evidence;
display-name-only changes preserve them. No hard deletion is exposed.

Approve an active connection with `organization.authPolicy.update(actor, organizationId,
{ expectedRevision, oidcConnectionIds })`; the list replaces accepted OIDC connections. Omission
preserves it, including when editing only Google. Email remains enabled. `methods` returns safe
approved connection labels, availability and current-user link state to active members.

`auth.oidc.startLink(actor, organizationId, connectionId, {})` requires active membership and a verified
email address. `startSignIn(organizationId, connectionId, {}, actor?)` rejects authenticated browsers and
resolves a stable binding or verified email with current membership at completion. `startReauthentication(actor, organizationId,
connectionId, {})` proves the current user again. The server owns flow cookies and calls
`callback(input, actor?)`; successful sign-in credentials are for cookie delivery only. Linking
and reauthentication do not extend session lifetime. Only invitation-authorized OIDC enrollment creates users/memberships; verified email can attach an identity to an existing user without merging user records. Organization access requires the exact approved connection.

See [OIDC architecture](../../architecture/identity-access/oidc.md) for transactions, outbound
restrictions and supported limits. Adapter HTTPS tests require `openssl` to generate an ephemeral
certificate; they change certificate trust only inside their test process and clean it up.

## Required SSO and owner recovery

The organization can require approved OIDC/SAML authentication within its configured
`ssoMaxAgeSeconds`. Email and Google do not satisfy enterprise SSO, but email sign-in
remains available for identity confirmation and explicit recovery. Administrative
actions do not impose an additional five-minute email or provider step-up.

`authPolicy.readiness` reports active approved connections, owner account linking,
policy-valid SSO evidence and offline recovery preparation. Enabling enforcement
requires the owner's recovery credential and an authentication that satisfies the
resulting policy. Mutations preserve a recoverable owner and current actor access.

`authRecovery.get`, `rotate`, `revoke` and `recover` retain one-time offline recovery.
Recovery checks a current owner session and credential, consumes the credential,
changes required SSO to optional and writes audits/notifications atomically.
Provider renewal remains available when required SSO evidence reaches the configured
age; it does not extend the Preface session lifetime. See the [required SSO architecture](../../architecture/identity-access/required-sso.md).

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
Invitation-authorized external enrollment creates users/memberships and applies the invitation’s currently valid role/team assignments. Required SSO and offline recovery work
with approved SAML connections through the same policy and safeguards.

The initial profile requires signed Response and Assertion, RSA-SHA256/SHA512, plaintext assertions,
and persistent or explicitly unspecified stable NameID. Certificates must remain valid. Call
`rotateSigningKey(actor, organizationId, connectionId, expectedRevision)` before SP expiry, import
the new metadata into the IdP, and retest. Trust changes revoke evidence and preserve the final
owner recovery path. See [SAML architecture](../../architecture/identity-access/saml.md) for certificate
rollover, browser transport, replay protection and unsupported profiles.

## External enrollment and discovery

`auth.external.invitation.methods({ invitationId, token })` returns eligible provider choices.
`start({ invitationId, token, connectionId, displayName, returnPath? }, actor?)` starts direct
OIDC/SAML or enabled Google enrollment. Inputs use `InvitationAuthenticationInput`; credentials
are redacted. A callback returns `nextAction: "continue" | "verify_email"`, a flow ID and safe
return path. Completed credentials remain internal cookie-delivery values.

When verification is needed, `auth.external.status`, `request`, `verify` and `resume` use a
flow ID and the original redacted browser token. `request` returns a challenge; `verify`
also takes challenge ID and redacted code. Provider proof is encrypted and browser-bound,
so code verification does not repeat the provider exchange. Direct admission uses exact
connection-domain authority, a fresh emailed invitation, or the inline mailbox proof.

`auth.discover()` returns the sole organization's supported methods independently of
account existence. The server resolves the organization for all public requests.
`organization.authPolicy.methods` reports current member policy requirements without
granting content access or changing a selected organization.

`AuthenticationLinks` optionally accepts `dashboardOrigin` for frontend email/return URLs.
Keep `publicOrigin` as the provider callback origin. The runtime validates those origins.
See [enrollment architecture](../../architecture/identity-access/enrollment.md) for authority,
transactions, proof expiry and restrictions. Canonical email changes, new factors and SCIM
remain outside these workflows.

## Audit history

`application.audit.list(actor, organizationId, query?)` returns a scoped event page;
`exportCsv` returns a bounded CSV page with a continuation cursor. Supply `null` for the narrow
instance-administration scope. Organization scope requires current `audit.read`; instance scope
requires instance ownership and a current authenticated session. See [audit architecture](../../architecture/identity-access/audit.md).
`organization.domain.inspectForOperator` permits reviewing a claim before manual approval;
`revoke(..., true)` withdraws operator approval without granting organization content access.

`organization.identityConnection.health` reports configured trust and certificate expiry.
`organization.identityConnection.keys` supports `list`, `prepare`, browser-bound `test`, `activate`
and `retire` for staged SAML SP rollover. The candidate is usable for seven days; activation needs a
successful test within 15 minutes. Activation preserves the IdP trust revision and current evidence.
`auth.connectionMaintenance(cursor?)` scans up to 100 connections, queues deduplicated certificate
expiry notices transactionally and returns the next cursor. Runtime maintenance also scrubs expired
pending keys. `organization.invitation.delivery` exposes safe delivery diagnostics to invitation managers.
