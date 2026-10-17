# Server runtime

`apps/server` is the Node.js composition root and operator executable. It supplies
configuration, PostgreSQL, security adapters, application workflows and HTTP policy.
It renders API reference pages but no onboarding UI or dashboard. The server defaults
to port 8080; Scalar and OpenAPI are always available.

## Startup and resources

`BackendLive` shares one database pool across migrations, transaction context,
repositories and application workflows. Application acquisition requires completed
migrations. `Startup` then prepares the installation and prints any newly issued
operator link after commit. `Server` requires both `Startup` and the constructed HTTP
application before acquiring the listener. Merging a listener and migrations as
sibling Layers would not establish this order.

Startup failure exits without binding. Existing pending proofs survive restarts;
their raw credentials are not recoverable from storage. The local reissue command
uses the same backend composition without ordinary startup preparation first.
Configuration-free help/version do not acquire PostgreSQL. The proof lifecycle and
first-owner transaction belong to [instance setup](../identity-access/instance-setup.md).

Node receives SIGTERM/SIGINT through the scoped Effect runtime. Shutdown stops new
requests, allows up to 15 seconds for active requests and releases resources. Compose
allows 20 seconds before forcing exit. The scoped email worker starts after startup preparation and stops with the runtime.
A second scoped task removes expired sign-in and invitation proofs in bounded batches.
The operator CLI starts neither worker.

## Request boundary

`HttpApplication` constructs a concrete router effect and wraps it in the request
policy before `HttpServer.serve`. This covers routing, payload decoding, error handling
and operational routes. Stable database/configuration services are captured without
capturing a request scope. `HttpApiBuilder` derives product routes and OpenAPI from
the same contract.

The policy identifies clients from the socket by default. Explicit trusted proxy
CIDRs permit walking `X-Forwarded-For` from the socket through trusted hops, stopping
at the first untrusted address. Invalid trusted forwarding input shares a conservative
unknown-client bucket. Deployment must restrict direct access behind trusted proxies.

Every mutation requires an exact allowed Origin; POST requires uncompressed JSON.
Credentialed CORS permits the configured public origin and explicit additional
origins. Browser SameSite restrictions still apply. Authentication supplies a fresh
actor to protected handlers; cookie lifecycle and revocation are documented in
[sessions](../identity-access/sessions.md).

Request admission uses one-minute process-local windows: 240 general requests per
client, 30 setup-proof inspections, five setup issuance/resend requests and ten setup verification
attempts. Mutating setup endpoints admit at most two concurrent requests before decoding.
The database separately enforces code attempts and resend cooldown across replicas. Setup limits use matched endpoint
identifiers so alternate URL spellings cannot bypass them. Capacity is bounded to
10,000 active buckets; replicas do not share enforcement. Rejections carry 429 and
`Retry-After`. Health probes bypass admission limits.

Bodies have a 32 KiB streaming cap and Node headers a 16 KiB cap. Node allows ten
seconds for headers and 15 seconds for request receipt; the application deadline is
30 seconds. Native parser failures and oversized streaming bodies can close the
connection before the application can write its error response.

Handled responses receive a generated request ID, no-store, no-referrer, nosniff and
frame protection. HTTPS public origins also receive HSTS. Malformed input is sanitized;
operational errors never expose SQL, payloads or native causes. Routine logs contain
request ID, method, bounded route name, status and duration. They omit arbitrary URLs,
queries, credentials and bodies. The one-time operator link is a separate supported
bootstrap output. Metrics/exporters are not currently configured.

## Operational routes and deployment

`/health/live` reports the listener is running. `/health/ready` checks the same database
pool with a two-second deadline. An incomplete setup remains ready so an operator
can finish onboarding. Migrations and preparation were already gated before binding.

`/api/openapi.json` serves the generated product contract and `/api/docs` serves Scalar.
Both are always enabled. Health and local CLI operations are outside product OpenAPI.
Scalar is bundled with the pinned Effect dependency and uses no external fonts/CDN.
Its response-specific CSP permits only hashes of the actual bundled inline scripts,
same-origin API connections and the inline styles Scalar needs. The reference is
marked noindex/no-follow.

Compose runs PostgreSQL with a persistent volume and no published database port,
plus a non-root backend image exposing container port 8080. The host publication
defaults to loopback:8080. The image contains built workspace dependencies and
migrations; landing and UI sources are excluded from its build context.

Organization OIDC uses the existing encryption key and public origin. Its Node adapter enforces
an outbound HTTPS/DNS policy. `OIDC_ALLOWED_PRIVATE_ORIGINS` optionally permits exact internal
provider origins without relaxing TLS verification. See [organization OIDC](../identity-access/oidc.md).

The operator supplies the public origin, PostgreSQL credentials, two independent
crypto keys and selected email provider configuration through deployment secrets.
Production requires a real provider; console delivery additionally requires explicit
`NODE_ENV=development`. Configuration is checked before binding, without a test send. `PUBLIC_URL` is an HTTPS origin except for loopback development and
controls links/cookie security independently of internal proxy HTTP. The application
generates setup/session credentials; no JWT signing key is required. Secret-file
configuration and a deployment initializer are not implemented. Exact variables and
commands belong in the [server README](../../apps/server/README.md).

## Verification and source

HTTP tests compose real application/repositories and migrated PGlite with live sockets.
Unit tests cover admission windows, concurrent capacity and proxy interpretation.
Built PostgreSQL process tests cover startup, replacement/restart, completion refusal
and failure before binding. Migration locking retains its database-owned regressions.

- [Runtime composition](../../apps/server/src/runtime.ts)
- [Startup gate and listener](../../apps/server/src/server.ts)
- [Router composition](../../apps/server/src/http/application.ts)
- [Request policy](../../apps/server/src/http/middleware/request-policy.ts)
- [Reference CSP](../../apps/server/src/http/documentation.ts)
- [Built process tests](../../apps/server/tests/smoke/built.test.mjs)
- [Compose](../../compose.yaml)

Required SSO and offline owner recovery use the existing session, Origin, JSON and no-store response
policies. Recovery secrets are decoded to redacted application inputs and explicitly unwrapped only
for the one-time issuance response. The runtime adds no provider dependency or environment variable.
See [required SSO](../identity-access/required-sso.md).

SAML adds a narrow external-Origin/form-POST exception at its exact ACS route with a 256 KiB
streaming body cap. ACS stages verified context; a same-origin GET completes authentication using
the dedicated Lax flow cookie and original session where required. Normal mutation/cookie policy
is unchanged elsewhere. Runtime supplies Node-SAML and certificate crypto; cleanup includes shared
replay reservations. See [SAML](../identity-access/saml.md) for verification and certificate lifecycle.
