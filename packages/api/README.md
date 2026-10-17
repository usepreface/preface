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

| Client method                         | HTTP route                            | Success                                        |
| ------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| `instanceSetup.status()`              | `GET /api/v1/instance/setup`          | `200` `BootstrapStatus`                        |
| `instanceSetup.inspect({ payload })`  | `POST /api/v1/instance/setup/inspect` | `200` `BootstrapTokenInfo`                     |
| `instanceSetup.complete({ payload })` | `POST /api/v1/instance/setup`         | `201` `SessionActor`, with a server-set cookie |
| `session.current()`                   | `GET /api/v1/auth/session`            | `200` `SessionActor`                           |
| `session.revoke()`                    | `DELETE /api/v1/auth/session`         | `204`                                          |

Inspection accepts `{ token }`. Completion accepts `token`, `instanceName`, `ownerName`, `email`
and `password`. These wire schemas use strings so clients can encode requests. The server decodes
them into the existing normalized, redacted application inputs. Internal secret-input encoding
remains forbidden. Never log request payloads or client errors that contain payloads.

Names trim to 1–120 UTF-16 code units; email trims/lowercases without provider-specific rewriting.
Passwords remain unchanged and require 15–128 UTF-16 code units. JSON Schema counts Unicode code
points, so Effect emits a conservative length bound; descriptions state the exact server policy.
Password/proof fields are marked write-only. Responses explicitly select safe user/session fields.
JSON timestamps use ISO strings; generated clients decode them to Effect `DateTime.Utc`.

`SessionAuthentication` declares the `preface_session` cookie scheme and provides `CurrentActor`
to authenticated handlers. `SetupProtection` declares setup admission middleware. Their server
implementations belong to `apps/server`; neither middleware requires a browser client to read an
HttpOnly cookie. Browsers send the existing cookie normally; cross-origin clients need credentialed
fetch and an explicitly allowed origin. Mutations require the configured trusted Origin and JSON
bodies where applicable. Node clients must supply the Origin header explicitly.

Logout resolves a cookie if present and succeeds for absent/invalid sessions. It does not promise
successful revocation after a storage failure. Bootstrap proofs and sessions are separate authorities.
There is no HTTP reissue endpoint, sign-in, organization API, bearer-token API or dashboard in this slice.

## Errors and documentation

Bootstrap errors retain `_tag: "BootstrapError"` and their domain code. Invalid input maps to `400`,
invalid proof to `401`, and completed setup/unavailable email to `409`. Missing or invalid sessions
return `AuthenticationError` with `UNAUTHENTICATED` at `401`.

Transport failures use `RequestError` and a closed code: `INVALID_INPUT` (`400`), `FORBIDDEN` (`403`),
`NOT_FOUND` (`404`), `REQUEST_TIMEOUT` (`408`), `PAYLOAD_TOO_LARGE` (`413`), `UNSUPPORTED_MEDIA_TYPE`
(`415`), `RATE_LIMITED` (`429`), `INTERNAL_ERROR` (`500`), or `SERVICE_UNAVAILABLE` (`503`).
Error code/status definitions live alongside protocol errors. The API derives status-specific schemas
and exports `requestErrorStatuses` for the server. Rate-limit responses include
`Retry-After`; all handled server responses include `X-Request-Id` and `Cache-Control: no-store`.
There is no additional success/error envelope. Infrastructure causes and raw validation issues
are never public error fields.

OpenAPI is generated from `PrefaceApi`. The server serves it at `/api/openapi.json` and serves
Scalar at `/api/docs` when enabled. Health routes and operator commands are server concerns and
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
