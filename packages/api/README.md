# @usepreface/api

Runtime-neutral Effect v4 HTTP contracts for Preface instance setup and sessions. This private
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
There is no HTTP reissue endpoint, organization API, bearer-token API or dashboard in this slice.

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
