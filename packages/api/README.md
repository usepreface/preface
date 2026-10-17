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

Creation accepts `{ name, slug }`; organization update accepts one or both fields.
Custom-role creation accepts `{ key, name, permissions }`; update accepts name and/or
permissions. Names trim; slugs/keys trim and lowercase. Direct grants accept
`{ memberId, roleId }`; transfer accepts `{ targetMemberId }`. Built-ins are protected.

Lists use `cursor` and `limit` (1–100, default 25) and return their named array plus
`nextCursor`. Organization and role lists accept `includeArchived`; member lists
accept `includeRemoved`. Archived organization discovery is owner-only. Detail returns
`{ organization, membership, access }`; access is `{ memberId, isOwner, permissions }`.

Owner-only transitions preserve a usable owner. Custom roles/assignments are bounded
by the actor's delegation rights. Invitations own additional admission; there is no
direct member-creation endpoint or policy editor. SSO configuration remains pending. These endpoints are backend-only.

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
`{ email, roleIds }` (1–20 unique role IDs); resend takes `{}`. Lists use `cursor` and
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
