# @usepreface/server

Preface's Node.js 24 backend. Runs migrations and instance preparation before opening its HTTP
listener, serves the shared Effect HTTP API, and provides local operator commands. Development
requires pnpm 12.14.0 and PostgreSQL. Docker Compose includes PostgreSQL.

## Run with Docker Compose

From the repository root:

```sh
cp .env.example .env
# Edit .env: replace POSTGRES_PASSWORD and set PUBLIC_URL for this installation.
docker compose up --build --detach --wait
docker compose logs server
```

The server binds to loopback on port 3000 by default. PostgreSQL has a persistent volume and no
published host port. For public deployment, terminate HTTPS at your reverse proxy and configure
`PUBLIC_URL` with its external origin. Change `SERVER_BIND_ADDRESS` deliberately if the proxy
cannot reach the default loopback binding. Back up the PostgreSQL volume before upgrades.

On an empty database, startup commits the installation, default settings and a 30-minute setup
proof, then prints its one-time operator link. Restarting preserves a valid pending proof. If the
output is lost, replace it explicitly:

```sh
docker compose exec server preface instance setup-link reissue
```

Replacement invalidates the previous proof and refuses an already completed installation.
Treat the printed link as a credential. Its proof is in the URL fragment, outside HTTP request
paths and queries. Routine logs never contain request bodies, cookies or setup credentials.

**This phase implements the backend only.** The printed `/setup#token=…` URL reserves the future
onboarding page; this server does not render `/setup` or a dashboard. Until that UI exists, use
the same-origin Scalar reference at `/api/docs` to inspect the proof and complete setup, sending
the fragment's token in the JSON request body. Completion creates the first owner and sets a
session cookie. It creates no organization. Sign-in, invitations, email verification, password
reset and organization creation remain subsequent features.

## Develop locally

Copy `apps/server/.env.example` to `apps/server/.env` and configure an existing local PostgreSQL
database. The server's commands load that package-local `.env` explicitly; imports never load it.

```sh
pnpm --filter @usepreface/server dev
pnpm --filter @usepreface/server preface --help
pnpm --filter @usepreface/server preface instance setup-link reissue
pnpm exec turbo run build --filter=@usepreface/server
pnpm --filter @usepreface/server start
```

The Docker image uses the built CLI and production dependencies, includes database migrations,
and runs as the unprivileged `node` user. `preface --help` and `preface --version` require neither
deployment configuration nor a database connection.

## HTTP API

The [API package](../../packages/api/README.md) owns the transport contract and typed client.

| Method | Path                             | Behavior                                                     |
| ------ | -------------------------------- | ------------------------------------------------------------ |
| GET    | `/api/v1/instance/setup`         | Read safe setup status and instance name.                    |
| POST   | `/api/v1/instance/setup/inspect` | Check a proof without consuming it.                          |
| POST   | `/api/v1/instance/setup`         | Create the first owner and session; return 201 and a cookie. |
| GET    | `/api/v1/auth/session`           | Resolve the current cookie into a safe actor; otherwise 401. |
| DELETE | `/api/v1/auth/session`           | Revoke the current session and clear its cookie; return 204. |
| GET    | `/health/live`                   | Check that the listener is running.                          |
| GET    | `/health/ready`                  | Check PostgreSQL, with a two-second deadline.                |
| GET    | `/api/openapi.json`              | Generated product API document.                              |
| GET    | `/api/docs`                      | Bundled Scalar reference.                                    |

Pending instance setup is healthy: an operator must be able to finish onboarding. No listener
opens if migrations or startup preparation fail. Shutdown stops admission, allows up to 15 seconds
for active requests, and releases scoped resources. Compose allows 20 seconds before forcing exit.

Scalar is bundled with the pinned Effect dependency and needs no third-party CDN or fonts. Its
CSP permits only the exact bundled script hashes; API connections stay on the same origin. Both
documentation routes can be disabled with `API_DOCS_ENABLED=false`. Health routes are separate
from the product OpenAPI document. Proof replacement is exclusively a local CLI command.

## Configuration

The [database configuration](../../packages/database/README.md#configuration) is required by
`serve` and proof replacement. Secrets use Effect `Config`/`Redacted`.

| Variable               | Default   | Meaning                                                                                                                         |
| ---------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`           | Required  | Canonical HTTPS origin; HTTP allowed only for loopback development. No credentials, subpath, query or fragment.                 |
| `SERVER_HOST`          | `0.0.0.0` | Node listener address.                                                                                                          |
| `SERVER_PORT`          | `3000`    | Node listener port. In Compose, this variable instead controls the host's published port; the container always listens on 3000. |
| `API_DOCS_ENABLED`     | `true`    | Enable Scalar and the OpenAPI JSON route together.                                                                              |
| `CORS_ALLOWED_ORIGINS` | Empty     | Comma-separated additional browser origins. `PUBLIC_URL` is always allowed.                                                     |
| `TRUSTED_PROXY_CIDRS`  | Empty     | Comma-separated proxy IP networks trusted for `X-Forwarded-For`.                                                                |

By default, rate limiting uses the TCP peer address and ignores forwarded headers. Behind a proxy,
allow only its actual CIDRs and restrict direct access to the server. Forwarded addresses are
walked from the socket through trusted hops, stopping at the first untrusted address. Invalid
trusted forwarding input shares a conservative unknown-client bucket.

`PUBLIC_URL` controls secure cookies and operator links independently of internal HTTP proxy
connections. The host-only `preface_session` cookie has `HttpOnly`, `SameSite=Lax`, `Path=/` and
absolute expiry. HTTPS installations also use `Secure` and HSTS. Additional CORS origins do not
override browser SameSite rules; use a same-site frontend for cookie authentication.

## Request policy

Every mutation requires an exact allowed `Origin`, including non-browser clients. POST bodies
must be uncompressed JSON. Use `credentials: "include"` for a browser client on another allowed
origin. Session credentials are accepted only through the cookie, never a JSON field or URL.

Requests have a 32 KiB streaming body cap, a 16 KiB native header cap, ten seconds for headers,
15 seconds for receiving the request and a 30-second application deadline. Responses passing
through the application policy include a generated `X-Request-Id`, `Cache-Control: no-store`,
`nosniff`, no-referrer and frame protection. Native parser failures and oversized streaming bodies
may close the connection before an application response can be written.

Rate windows last one minute: 240 general requests per client, 30 proof inspections, and five
setup completion attempts. At most two completion requests run concurrently, admitted before
payload decoding or password hashing. Rejection returns 429 and `Retry-After`. Health probes
bypass rate limits. These limits are process-local with at most 10,000 active buckets; replicas
need a shared admission layer when distributed enforcement becomes necessary.

Expected domain errors retain their public tagged shape. Malformed input becomes a sanitized
`RequestError`; SQL, validation issues, passwords and native causes are omitted. Retryable storage
failures return 503; unexpected failures return 500. Logs contain a request ID, known route name,
method, status and duration, with no arbitrary paths or queries. Do not automatically retry setup
completion: a lost response can follow a committed completion, and the proof cannot be replayed.

Logout is idempotent for an absent, malformed or invalid cookie. Operational failures still fail
the request; a failed revocation is not reported as successful logout.

## Verification

```sh
pnpm --filter @usepreface/server test
pnpm --filter @usepreface/server typecheck
pnpm --filter @usepreface/server lint
pnpm --filter @usepreface/server test:built
pnpm run check --filter=@usepreface/server...
```

The small HTTP suite uses real application workflows, crypto, repositories and migrated PGlite.
It covers setup/session cookies, unsafe mutations, sanitized errors, request limits, readiness,
OpenAPI and Scalar. Unit tests exercise rate windows, concurrent admission and trusted proxies.

For real PostgreSQL, start the explicit disposable test container described in the database
README, wait for readiness, then run these commands sequentially:

```sh
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/server test
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/server test:built
```

Built process tests verify startup, explicit proof replacement, restart preservation, completed
setup refusal and failure before binding. They are skipped without the explicit disposable
PostgreSQL port; configuration-free CLI help still runs. Never run these destructive fixture
resets against an existing development or deployment database.
