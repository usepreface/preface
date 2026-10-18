# @usepreface/api

Runtime-neutral Effect v4 HTTP contracts for Preface instance setup, sessions and organizations. This private
workspace package supplies `PrefaceApi` to server handlers, generated clients and OpenAPI generation.
It depends only on Effect and `@usepreface/protocol`; importing it does not read configuration,
start a server or acquire persistence.

## Usage

Install workspace dependencies with `pnpm install` from the repository root. With the backend
running at `http://localhost:8080`, a Node client can read setup status:

```ts
import { Effect } from "effect";
import { FetchHttpClient } from "effect/http";
import { HttpApiClient } from "effect/http-api";

import { PrefaceApi } from "@usepreface/api";

const status = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(PrefaceApi, { baseUrl: "http://localhost:8080" });
  return yield* client.instanceSetup.status();
}).pipe(Effect.provide(FetchHttpClient.layer));

console.log(await Effect.runPromise(status));
```

The client base URL is an origin. Paths already include `/api/v1`; do not add the prefix again.
Use `preface-source` for source development or build workspace dependencies before consuming dist.

## Endpoints

| Client method                                    | HTTP route                                | Success                                                |
| ------------------------------------------------ | ----------------------------------------- | ------------------------------------------------------ |
| `instanceSetup.status()`                         | `GET /api/v1/instance/setup`              | `200` `BootstrapStatus`                                |
| `instanceSetup.inspect({ payload })`             | `POST /api/v1/instance/setup/inspect`     | `200` `BootstrapTokenInfo`                             |
| `instanceSetup.requestVerification({ payload })` | `POST /api/v1/instance/setup`             | `202` `BootstrapVerification`                          |
| `instanceSetup.resendVerification({ payload })`  | `POST /api/v1/instance/setup/resend`      | `202` `BootstrapVerification`                          |
| `instanceSetup.complete({ payload })`            | `POST /api/v1/instance/setup/verify`      | `201` `SessionActor`, with a server-set cookie         |
| `session.current()`                              | `GET /api/v1/auth/session`                | `200` `SessionActor`                                   |
| `emailSignIn.request({ payload })`               | `POST /api/v1/auth/email/request`         | `202` `EmailSignInChallenge`, temporary cookie         |
| `emailSignIn.resend({ payload })`                | `POST /api/v1/auth/email/resend`          | `202` `EmailSignInChallenge`, rotated temporary cookie |
| `emailSignIn.verify({ payload })`                | `POST /api/v1/auth/email/verify`          | `201` `SessionActor`, session cookie                   |
| `sessions.list({ query })`                       | `GET /api/v1/auth/sessions`               | `200` `SessionList`                                    |
| `sessions.revoke({ params })`                    | `DELETE /api/v1/auth/sessions/:sessionId` | `204`                                                  |
| `sessions.revokeAll()`                           | `DELETE /api/v1/auth/sessions`            | `204`                                                  |
| `session.revoke()`                               | `DELETE /api/v1/auth/session`             | `204`                                                  |

Inspection accepts `{ token }`. Request verification accepts
`{ token, instanceName, ownerName, email }`. The 202 response contains
`{ challengeId, expiresAt, resendAt }`, never a code or session. Resend accepts
`{ token, challengeId }`. Completion accepts `{ token, challengeId, code }` with the
eight-digit emailed code and requires both operator proof and mailbox access.

Names trim to 1–120 UTF-16 code units; email trims/lowercases without provider-specific
rewriting. Wire credentials are encodable strings; server inputs redact them and
forbid encoding. Never log payloads or validation/client errors containing them.
Proof/code fields are write-only. Public responses select safe fields, with ISO
timestamps decoded by generated clients into Effect `DateTime.Utc`.

`SessionAuthentication` declares the `preface_session` cookie scheme and provides `CurrentActor`
to authenticated handlers. `SetupProtection` declares setup admission middleware. Their server
implementations belong to `apps/server`; neither middleware requires a browser client to read an
HttpOnly cookie. Browsers send the existing cookie normally; cross-origin clients need credentialed
fetch and an explicitly allowed origin. Mutations require the configured trusted Origin and JSON
bodies where applicable. Node clients must supply the Origin header explicitly.

Logout resolves a cookie if present and succeeds for absent/invalid sessions. It does not promise
successful revocation after a storage failure. Bootstrap proofs and sessions are separate authorities.
There is no HTTP reissue endpoint, bearer-token API or dashboard in this slice.

Email request accepts `{ email }`; resend accepts `{ challengeId }` with the temporary
`preface_sign_in` cookie. Verification accepts `{ challengeId, method: "code", code }`
or `{ challengeId, method: "magic_link", token }` with that same cookie. The response
contains only challenge identity/expiry. Unknown or unavailable recipients receive the
same public shape and no email; this is not signup. Existing authenticated browsers
cannot start or complete ordinary sign-in. The link fragment belongs to the future UI.

Session listing accepts optional `cursor` and `limit` (1–100, default 25) and returns
`{ sessions, nextCursor }`. Each session exposes `id`, `createdAt`, `lastSeenAt`,
`expiresAt` and `isCurrent`. Revocation is user-scoped; a missing/other-user session is
an idempotent no-op. Revoke-all includes the current session and clears its cookie.

## Organization endpoints

All paths below are relative to `/api/v1` and require the session cookie.
`organizationId`, `memberId`, `roleId` and `bindingId` are UUIDv7 identities. Creation
requires instance ownership; organization operations use current membership,
authentication policy and permissions. Instance ownership alone grants no tenant access.

| Client method                                            | Method and route                                                  | Result                                |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------- |
| `instanceCapabilities.get()`                             | `GET /instance/capabilities`                                      | `{ canCreateOrganization }`           |
| `organizations.create({ payload })`                      | `POST /organizations`                                             | `201` `OrganizationDetail`            |
| `organizations.list({ query })`                          | `GET /organizations`                                              | `OrganizationList`                    |
| `organizations.get({ params })`                          | `GET /organizations/:organizationId`                              | `OrganizationDetail`                  |
| `organizations.access({ params })`                       | `GET /organizations/:organizationId/access`                       | `OrganizationAccessInfo`              |
| `organizations.update({ params, payload })`              | `PATCH /organizations/:organizationId`                            | `PublicOrganization`                  |
| `organizations.archive({ params, payload: {} })`         | `POST /organizations/:organizationId/archive`                     | `PublicOrganization`                  |
| `organizations.restore({ params, payload: {} })`         | `POST /organizations/:organizationId/restore`                     | `PublicOrganization`                  |
| `organizations.authPolicy({ params })`                   | `GET /organizations/:organizationId/auth-policy`                  | `PublicOrganizationAuthPolicy`        |
| `organizationMembers.list({ params, query })`            | `GET /organizations/:organizationId/members`                      | `OrganizationMemberList`              |
| `organizationMembers.suspend({ params, payload: {} })`   | `POST /organizations/:organizationId/members/:memberId/suspend`   | `204`                                 |
| `organizationMembers.reinstate({ params, payload: {} })` | `POST /organizations/:organizationId/members/:memberId/reinstate` | `204`                                 |
| `organizationMembers.remove({ params })`                 | `DELETE /organizations/:organizationId/members/:memberId`         | `204`                                 |
| `organizationMembers.leave({ params, payload: {} })`     | `POST /organizations/:organizationId/leave`                       | `204`                                 |
| `organizationRoles.list({ params, query })`              | `GET /organizations/:organizationId/roles`                        | `OrganizationRoleList`                |
| `organizationRoles.create({ params, payload })`          | `POST /organizations/:organizationId/roles`                       | `201` `PublicOrganizationRole`        |
| `organizationRoles.update({ params, payload })`          | `PATCH /organizations/:organizationId/roles/:roleId`              | `PublicOrganizationRole`              |
| `organizationRoles.archive({ params })`                  | `DELETE /organizations/:organizationId/roles/:roleId`             | `204`                                 |
| `organizationRoleBindings.grant({ params, payload })`    | `POST /organizations/:organizationId/role-bindings`               | `201` `PublicOrganizationRoleBinding` |
| `organizationRoleBindings.revoke({ params })`            | `DELETE /organizations/:organizationId/role-bindings/:bindingId`  | `204`                                 |
| `organizationOwnership.grant({ params, payload: {} })`   | `PUT /organizations/:organizationId/owners/:memberId`             | `204`                                 |
| `organizationOwnership.revoke({ params })`               | `DELETE /organizations/:organizationId/owners/:memberId`          | `204`                                 |
| `organizationOwnership.transfer({ params, payload })`    | `POST /organizations/:organizationId/ownership/transfer`          | `204`                                 |

Creation accepts `{ metadata: { name, description? }, slug }`; organization update accepts
`metadata` and/or `slug`. Metadata patches preserve omitted fields; `description: null` clears it.
Public organization, user and team responses include metadata with `version: 1`.
Custom-role creation accepts `{ key, name, permissions, scopeKind? }` (default organization); update accepts name and/or
permissions. Names trim; slugs/keys trim and lowercase. Direct grants accept
`{ memberId, roleId, teamId? }`; supplying `teamId` requires a team-scoped role and active
team membership. Role listing accepts `scopeKind` (default organization). Transfer accepts `{ targetMemberId }`. Built-ins are protected.

Lists use `cursor` and `limit` (1–100, default 25) and return their named array plus
`nextCursor`. Organization and role lists accept `includeArchived`; member lists
accept `includeRemoved`. Archived organization discovery is owner-only. Detail returns
`{ organization, membership, access }`; access is `{ memberId, isOwner, permissions }`.

Owner-only transitions preserve a usable owner. Custom roles/assignments are bounded
by the actor's delegation rights. Invitations own additional admission; there is no
direct member-creation endpoint. Owners can opt into Google with the policy editor below; organization OIDC is available as described below; required SSO and recovery are described below; organization SAML is described below. These endpoints are backend-only.

`OrganizationError` codes map invalid input to 400, insufficient authority/evidence
to 403, scoped missing organization/member/role/binding to 404, and lifecycle or
uniqueness conflicts to 409. Outsiders and removed/suspended memberships receive
`ORGANIZATION_NOT_FOUND`; completed instance ownership is not membership.

## Invitations

| Method | Path                                                              | Result                                                    |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| POST   | `/organizations/:organizationId/invitations`                      | 201 `PublicInvitation`                                    |
| GET    | `/organizations/:organizationId/invitations`                      | `InvitationList`                                          |
| POST   | `/organizations/:organizationId/invitations/:invitationId/resend` | `PublicInvitation`                                        |
| DELETE | `/organizations/:organizationId/invitations/:invitationId`        | 204                                                       |
| POST   | `/invitations/inspect`                                            | `InvitationPreview`                                       |
| POST   | `/invitations/verification/request`                               | 202 challenge identity/expiry; browser cookie             |
| POST   | `/invitations/accept`                                             | 201 `{ actor, organizationId, memberId }`; session cookie |

Paths use the same `/api/v1` prefix. Typed-client groups are `organizationInvitations`
and `invitations`. Management requires cookie authentication; listing/revocation need
`members.manage`, creation/resend also need `roles.assign`. Creation takes
`{ email, roleIds, teams? }` (1–20 unique organization role IDs); optional team entries are
`{ teamId, roleIds? }`, with built-in team member as the default. Up to 20 unique teams
are allowed. All assignments are revalidated at acceptance. Resend takes `{}`. Lists use `cursor` and
`limit` and return `{ invitations, nextCursor }`, including lifecycle history.

Inspect and verification request take `{ invitationId, token }`. Acceptance adds
`challengeId`, `displayName`, and either `{ method: "code", code }` or
`{ method: "magic_link", proofToken }`. Browser binding is cookie-only. A matching
existing session is supported; account mismatch is rejected. No raw credentials
are returned in JSON. New accounts require a valid invitation and mailbox proof.
All POST routes require the exact trusted Origin and JSON.

`InvitationError` codes: `INVALID_INPUT` (400), `INVALID_INVITATION`/`INVALID_PROOF`
(401), `INVITATION_NOT_FOUND` (404), and `ACCOUNT_MISMATCH`, `RECIPIENT_UNAVAILABLE`,
`INVITER_NOT_AUTHORIZED`, `ASSIGNMENT_UNAVAILABLE` (409). Management also returns
normal organization/authentication errors. Operational failures remain private.

## Teams and profiles

All paths use `/api/v1` and cookie authentication. Team directory listing requires
`teams.read`; creation requires `teams.manage`. Team detail, editing, archival, member
and role operations use current team permissions. Organization `teams.manage` explicitly
supplies team administration without requiring team membership.

| Client method                                                         | Method and path                                            |
| --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `profile.get()` / `profile.update({ payload })`                       | GET / PATCH `/users/me`                                    |
| `teams.create({ params, payload })` / `teams.list({ params, query })` | POST / GET `/organizations/:organizationId/teams`          |
| `teams.get({ params })` / `teams.update({ params, payload })`         | GET / PATCH `/organizations/:organizationId/teams/:teamId` |
| `teams.archive({ params, payload: {} })`                              | POST `…/:teamId/archive`                                   |
| `teams.access({ params })`                                            | GET `…/:teamId/access`                                     |
| `teams.roles({ params, query })`                                      | GET `…/:teamId/roles`                                      |
| `teams.members({ params, query })`                                    | GET `…/:teamId/members`                                    |
| `teams.addMember({ params, payload: {} })`                            | PUT `…/:teamId/members/:memberId`                          |
| `teams.removeMember({ params })`                                      | DELETE `…/:teamId/members/:memberId`                       |

Team create/update payloads follow the organization metadata/slug shape. Profiles accept
`{ metadata: { name?, title?, bio? } }`; `null` clears title/bio. Image/logo metadata is
optional presentation data; upload and image editing routes are not available. Team member
responses include safe user metadata and current scoped roles. Lists use the existing cursor
contract; role lists use organization role IDs and include only team definitions.

`TeamError` maps invalid input to 400, insufficient authority to 403, missing team to 404,
and archive/slug/member conflicts to 409. `ProfileError/INVALID_INPUT` maps to 400.

## Errors and documentation

Bootstrap errors retain `_tag: "BootstrapError"` and their domain code. Invalid input maps to `400`,
invalid proof/code to `401`, cooldown to `429`, and completed setup/unavailable email to `409`. Missing or invalid sessions
return `AuthenticationError` with `UNAUTHENTICATED` at `401`.

Email sign-in errors use `_tag: "EmailSignInError"`: `INVALID_INPUT` (400),
`INVALID_PROOF` (401), `INSTANCE_NOT_READY` and `ALREADY_AUTHENTICATED` (409).

Transport failures use `RequestError` and a closed code: `INVALID_INPUT` (`400`), `FORBIDDEN` (`403`),
`NOT_FOUND` (`404`), `REQUEST_TIMEOUT` (`408`), `PAYLOAD_TOO_LARGE` (`413`), `UNSUPPORTED_MEDIA_TYPE`
(`415`), `RATE_LIMITED` (`429`), `INTERNAL_ERROR` (`500`), or `SERVICE_UNAVAILABLE` (`503`).
Error code/status definitions live alongside protocol errors. The API derives status-specific schemas
and exports `requestErrorStatuses` for the server. Rate-limit responses include
`Retry-After`; all handled server responses include `X-Request-Id` and `Cache-Control: no-store`.
There is no additional success/error envelope. Infrastructure causes and raw validation issues
are never public error fields.

OpenAPI is generated from `PrefaceApi`. The server serves it at `/api/openapi.json` and serves
Scalar at `/api/docs` always. Health routes and operator commands are server concerns and
are absent from the product specification. Endpoint status variants have narrowed code schemas
so documentation and generated-client decoding agree with the actual HTTP status.

## Google and reauthentication

All routes use `/api/v1`. `google.methods()` reads installation-wide availability;
`google.start({ payload: {} })` begins signed-out login. The shared GET Google callback is a browser
redirect endpoint returning 303; follow authorization URLs in the browser holding the flow cookie.
Successful sign-in sets the existing session cookie. Never log authorization URLs or callback queries.

`identityConnections.getGoogle/saveGoogle/testGoogle/activateGoogle/disableGoogle` use
`/instance/authentication/google` and its `/test`, `/activate`, `/disable` actions. Save is PUT with
`{ expectedRevision, clientId, clientSecret?, name? }`; first save uses revision zero and requires
the secret. Action payloads contain `expectedRevision`. Test returns `GoogleStartResult`; other
operations return `PublicGoogleConnection` without secrets. Instance ownership and recent email
proof are enforced by application workflows.

`accounts.list/startGoogle/unlink` map to GET `/users/me/accounts`, POST its `/google/start`, and
DELETE `/:accountId`. `reauthentication.startGoogle` maps to POST `/auth/reauthentication/google/start`.
All starts accept `{ returnPath?: "/api/docs" }`. Account responses include safe provider email,
link history and connection availability; they contain neither stable provider subjects nor tokens.

`reauthentication.requestEmail/resendEmail/verifyEmail` map to POST
`/auth/reauthentication/email/request`, `/resend`, `/verify`. Request takes `{}`; resend and verify
reuse the email sign-in wire payloads with a separate browser cookie and existing session.
Issuance returns 202 `EmailSignInChallenge`; verification returns 204 without replacing the session.

`authenticationPolicy.methods({ params })` reads GET
`/organizations/:organizationId/authentication/methods`. Its response distinguishes Google
preference, global availability and effective availability. `authenticationPolicy.update` PATCHes
`/organizations/:organizationId/auth-policy` with `{ expectedRevision, googleEnabled }` and returns
`PublicOrganizationAuthPolicy`. Organization ownership, recent email and active global configuration
are required to enable; both email methods remain enabled.

Expected failures use `IdentityError` and closed code/status mappings. Expired/replayed browser
flows are 401, unavailable configuration and revision/account conflicts are 409, recent-proof or
authority failures are 403, and provider unavailability is 503. Infrastructure causes remain private.

## Verification

```sh
pnpm --filter @usepreface/api typecheck
pnpm --filter @usepreface/api lint
pnpm --filter @usepreface/api test
pnpm --filter @usepreface/api build
```

Contract tests cover versioned paths, authentication metadata, error statuses, write-only fields
and the wire/redacted-input boundary. Actual typed-client, cookie, middleware and startup behavior
is tested in the server package.

## Organization OIDC

All paths use `/api/v1`. The `organizationIdentityConnections` client group exposes:

- `list`/`create`: GET/POST `/organizations/:organizationId/identity-connections`.
- `get`/`update`: GET/PATCH the connection's `/:connectionId` path.
- `test`, `activate`, `disable`, `refreshMetadata`: POST its `/test`, `/activate`, `/disable`,
  `/refresh-metadata` action, with `{ expectedRevision }`.
- `link`/`reauthenticate`: POST its `/link/start` or `/reauthenticate/start`, with `{}` or the
  supported return path.

Creation returns 201 and takes `{ name, issuer, clientId, clientSecret,
clientAuthenticationMethod }`. The supported authentication methods are `client_secret_basic`
and `client_secret_post`. Update takes expected revision and optional name/issuer/client ID/
secret/authentication method. Issuer/client ID cannot change after first activation. Configuration
responses include versioned discovered endpoints, test/activation timestamps and secret presence;
never credentials. Reads require organization ownership; mutations also need recent email.

`oidc.start` POSTs `/organizations/:organizationId/identity-connections/:connectionId/sign-in/start`
from a signed-out browser. `oidc.callback` is GET `/auth/oidc/callback`, a browser redirect endpoint
returning 303. Starts return authorization URL/expiry and set the server-owned `preface_oidc_flow`
cookie. Follow the URL in the same browser; successful sign-in sets the normal session cookie.
Callback completion currently redirects only to `/api/docs`.

The existing policy PATCH accepts `{ expectedRevision, oidcConnectionIds }`, optionally alongside
`googleEnabled`. Omission preserves each setting; the connection list replaces OIDC approvals and
accepts up to 20 distinct same-organization connections. Policy responses include connection IDs.
Member method discovery returns an `oidc` array of `{ id, name, available, linked }`. The existing
account list includes OIDC provider/connection/organization summaries, and DELETE account unlinks
with recent email proof. Email remains available for global login. Required SSO and recovery are described below.

## Required organization SSO

All following paths are relative to `/api/v1` and use the existing session cookie and trusted-Origin
mutation policy. `authenticationPolicy.readiness` reads
`GET /organizations/:organizationId/auth-policy/readiness` as a current owner, even before satisfying
SSO. It returns `policyRevision`, `ready`, typed `blockers`, approved connection availability and
owner link/recovery readiness. Member `authenticationPolicy.methods` adds `ssoMode`,
`ssoMaxAgeSeconds`, `authenticationSatisfied`, `emailSatisfiesOrganization` and `nextAction`.
Email login stays available even when it cannot authorize organization access.

After testing/activating/approving a connection, linking the owner's account, completing provider
reauthentication and issuing an offline recovery credential, enable SSO through the existing
`authenticationPolicy.update` PATCH with:

```json
{
  "expectedRevision": 2,
  "ssoMode": "required",
  "ssoMaxAgeSeconds": 43200,
  "recoveryCredential": "<credential-returned-by-rotation>"
}
```

The credential is checked but not consumed. Local email and provider authentication must both be
within five minutes. The age range is 300–604,800 seconds, with 43,200 as the default. Policy responses
include mode/age and no credentials. The approved organization connections satisfy SSO; installation
Google and email do not. Expired provider authentication requires the existing OIDC reauthentication
flow, without extending the Preface session's absolute expiry.

`organizationAuthRecovery` exposes the current owner's recovery credential:

- `get`: GET `/organizations/:organizationId/auth-recovery`, returning `{ credential: null }` or
  `{ credential: { id, createdAt } }`.
- `rotate`: POST its `/rotate` action with `{}`, returning `{ id, createdAt, recoveryCredential }`.
  This is the only response containing the secret. Store it in a password manager; the response
  uses `Cache-Control: no-store`. Rotation revokes the previous credential.
- `revoke`: DELETE the base path, returning 204. Removing the final required recovery path fails.
- `recover`: POST its `/recover` action with `{ expectedRevision, recoveryCredential }`, returning
  the updated public authentication policy. Requires current ownership and recent local email,
  but no provider proof. It consumes the owner-bound credential and makes SSO optional atomically
  with audit and owner notifications. It does not restore an archived organization.

Normal rotation/revocation require owner access satisfying current policy and recent local email.
Recovery status/readiness and credential redemption use narrowly scoped owner checks. Credential
redemption cannot grant membership or ownership. Credentials have no automatic expiry and are
revoked on owner suspension, removal or demotion. A lost issuance response requires another rotation.
After recovery, issue a new credential before re-enabling required SSO.

Invitation acceptance now includes `nextAction: "continue" | "authenticate_with_sso"`. Mailbox
verification admits the member; required SSO must still be completed before organization access.
Signed-out callers receive no organization provider directory.

## Organization SAML

The existing connection list/get and lifecycle endpoints return OIDC or SAML connection DTOs.
SAML uses these additional `organizationIdentityConnections` actions, relative to `/api/v1`:

- `createSaml`: POST `/organizations/:organizationId/identity-connections/saml` with `{ name }`.
  Returns 201, including generated SP certificate, entity ID, ACS URL, metadata URL and `idp: null`.
- `updateSaml`: PATCH the connection's `/:connectionId/saml` path with `{ expectedRevision, name?, idp? }`.
- `rotateSigningKey`: POST its `/:connectionId/saml/rotate-signing-key` path with `{ expectedRevision }`.
  Returns a draft requiring new IdP metadata import and testing.

The `idp` object contains `entityId`, HTTPS `signOnUrl`, `signingCertificates` (one to five PEM
certificates) and `nameIdFormat` (`urn:oasis:names:tc:SAML:2.0:nameid-format:persistent` or
`urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified`). Import returned SP metadata into the IdP,
configure the IdP values, then use the existing test/activate actions. Issuer and NameID format
cannot change after first activation. Signing keys remain private; only certificates are public.
Approve through policy PATCH `{ expectedRevision, samlConnectionIds }`. Discovery adds a `saml`
array with the same safe method summaries as `oidc`; combined approvals are limited to 20.

The existing sign-in/start, link/start and reauthenticate/start paths dispatch by provider; the
compatible typed sign-in client name remains `oidc.start`. SAML starts set `preface_saml_flow`.
The `saml` group adds public GET metadata at the returned URL, POST `/auth/saml/:connectionId/acs`
with form-encoded `SAMLResponse` and `RelayState`, and GET `/auth/saml/complete?flowId=...`.
Follow authorization and redirects in the same browser. ACS stages verification and redirects;
it never sets an authentication session. Completion requires the flow cookie and original
session for authenticated actions. Only successful signed-out sign-in sets a normal session cookie.

Both Response and Assertion must be signed. Encrypted assertions, unsolicited login and SLO are
unsupported. The [SAML architecture](../../architecture/identity-access/saml.md) describes the exact
profile, certificate lifecycle and shared required-SSO/owner-recovery guarantees.

## Organization domains

Authenticated organization owners manage `/api/v1/organizations/:organizationId/domains`.
Create with `{ domain }`; verification request/confirm and revocation take
`{ expectedRevision }`. Request returns `{ domain, recordName, recordValue, expiresAt }` for
the DNS TXT instruction. Claims last one year after verification; challenges last 30 minutes.
Instance owners may manually approve the exact claim through
`POST /api/v1/instance/organizations/:organizationId/domains/:domainId/approve`.
Connection `/domains` GET/PUT reads or replaces approved claims with
`{ expectedRevision, domainIds }`. Only verified claims for that organization are accepted.
These mutations require recent local email and do not create accounts or memberships.

## Direct invitation SSO and continuation

`POST /api/v1/invitations/inspect` accepts invitation ID/token and returns organization/expiry,
`methods: [{ connectionId, provider, name }]` and `ssoRequired`. Start the chosen method with
`POST /api/v1/invitations/authentication/start` and
`{ invitationId, token, connectionId, displayName, returnPath? }`. The server sets the provider
flow cookie and returns `{ authorizationUrl, expiresAt }`. Follow that URL in the same browser.

A callback either sets the normal session or redirects to an inline email-verification route,
setting a separate HttpOnly continuation cookie. Use `GET /api/v1/auth/external/flows/:flowId`
to read `{ flowId, provider, nextAction, maskedEmail, expiresAt }`. Request a code with a JSON
`{}` POST to its `/email/request`, then submit `{ challengeId, code }` to `/email/verify`.
`/complete` can resume a previously verified flow with a JSON `{}` POST. Completion returns
`{ nextAction, redirectTo }` and delivers a session only through its cookie. All these POSTs
require a trusted Origin. Flow IDs alone are insufficient authority.

`POST /api/v1/auth/discovery` accepts `{ email, organizationSlug? }` and returns email/Google
availability plus eligible enterprise connections. It does not disclose whether an account or
membership exists. Authenticated organization selection uses a JSON `{}` POST to
`/api/v1/auth/organizations/:organizationId/select`, returning current authentication requirements.

## Audit history

`GET /api/v1/organizations/:organizationId/audit-events` requires `audit.read`; built-in owners
and administrators have it. `GET /api/v1/instance/audit-events` requires recent-email-authenticated
instance ownership and returns only instance administration and operator domain decisions.
List responses are `{ events, nextCursor }`; limits default to 25 and cap at 100. Filters are
`eventType`, `actorUserId`, `targetId`, `after`, `before` and the returned opaque JSON `cursor`.
Each path's `/export` returns `{ contentType, filename, content, nextCursor }` containing a CSV
page of at most 1,000 events. Continue with `nextCursor` when present; exports retain scope checks.

Instance owners review a domain before manual approval with
`GET /api/v1/instance/organizations/:organizationId/domains/:domainId` and can withdraw manual
approval with its `/revoke` POST and `{ expectedRevision }`. This grants no organization membership.

Organization connection owners can read `GET /api/v1/organizations/:organizationId/identity-connections/:connectionId/health`.
Staged SAML rollover uses `/saml/keys` to list/prepare, then `/:keyId/test`, `/:keyId/activate` and
`/:keyId/retire` with `expectedRevision`. Import the overlapping metadata at the IdP before testing.
All mutations require recent email authentication. Key responses contain no private keys.
Invitation managers can inspect `GET /api/v1/organizations/:organizationId/invitations/:invitationId/delivery`
for safe current-job status and retry diagnostics.
