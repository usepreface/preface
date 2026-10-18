# @usepreface/server

Preface's Node.js 24 backend. Runs migrations and instance preparation before opening its HTTP
listener, serves the shared Effect HTTP API, and provides local operator commands. Development
requires pnpm 12.14.0 and PostgreSQL. Docker Compose includes PostgreSQL.

## Develop locally

From the repository root, with Docker running:

```sh
pnpm services:up
pnpm dev
```

The root workflow starts PostgreSQL and Keycloak, then runs the server, dashboard
and landing page through Turbo. Development PostgreSQL credentials are `preface`
for database, username and password. Stop app watchers with Ctrl+C; run
`pnpm services:down` to stop infrastructure without deleting its data.

Setup generates `.local/development/server.env` with loopback origins, console email,
independent random crypto keys and trust for local Keycloak HTTPS. It runs before
Turbo's persistent dev tasks. The server's `dev` and `preface` scripts load those
fallback values, then optional `apps/server/.env` overrides. Package-local commands
honor shell overrides; root Turbo also passes through `NODE_EXTRA_CA_CERTS`. Existing files and non-empty keys are never rewritten.
Keep the generated crypto keys for as long as the development database is retained.

The server runs on port 8080 and the dashboard on port 3000. On an empty database,
startup creates the installation and default settings and prints a 30-minute operator
link. Open it to enter the instance name, owner name and email, then verify the code
printed by the development email provider. Setup creates the owner session; an
organization can be created immediately or later.

If a pending link is lost or expired, replace it locally:

```sh
pnpm --filter @usepreface/server preface instance setup-link reissue
```

Replacement invalidates the previous proof and refuses an already completed
installation. Treat the printed link as a credential. Its proof is in the URL
fragment; routine request logs omit bodies, cookies and setup credentials.

To run just the backend after services are ready:

```sh
pnpm --filter @usepreface/server dev
pnpm --filter @usepreface/server preface --help
```

See the [root development guide](../../README.md#local-development) for service URLs,
Keycloak credentials and generated configuration. To use a separate database/provider,
set overrides in `apps/server/.env` using `.env.example` as the reference.

## Build and deploy

```sh
pnpm exec turbo run build --filter=@usepreface/server
pnpm --filter @usepreface/server start
```

`start` loads only the package-local `.env` and shell configuration; it does not load
local development defaults. Deployment requires PostgreSQL, stable crypto keys and a
real email provider. The root `.env.example` describes the required configuration.

Build the backend image with `docker build -f apps/server/Dockerfile -t preface-server .`.
It runs as the unprivileged `node` user and contains built dependencies and migrations.
The repository Compose file supplies local services only; it does not deploy this
image. Terminate HTTPS at the deployment proxy and set `PUBLIC_URL` to its external
origin. The dashboard is hosted separately and configured through `DASHBOARD_URL`.
The image does not serve dashboard assets. `preface --help` and `preface --version`
require neither deployment configuration nor a database connection.

## HTTP API

The [API package](../../packages/api/README.md) owns the transport contract and typed client.

| Method | Path                             | Behavior                                                             |
| ------ | -------------------------------- | -------------------------------------------------------------------- |
| GET    | `/api/v1/instance/setup`         | Read safe setup status and instance name.                            |
| POST   | `/api/v1/instance/setup/inspect` | Check a proof without consuming it.                                  |
| POST   | `/api/v1/instance/setup`         | Request a setup code; return 202 with challenge/expiry/resend times. |
| POST   | `/api/v1/instance/setup/resend`  | Replace the code after cooldown; return 202.                         |
| POST   | `/api/v1/instance/setup/verify`  | Verify code, create first owner/session; return 201 and cookie.      |
| GET    | `/api/v1/auth/session`           | Resolve the current cookie into a safe actor; otherwise 401.         |
| DELETE | `/api/v1/auth/session`           | Revoke the current session and clear its cookie; return 204.         |
| GET    | `/health/live`                   | Check that the listener is running.                                  |
| GET    | `/health/ready`                  | Check PostgreSQL, with a two-second deadline.                        |
| GET    | `/api/openapi.json`              | Generated product API document.                                      |
| GET    | `/api/docs`                      | Bundled Scalar reference.                                            |

Pending instance setup is healthy: an operator must be able to finish onboarding. No listener
opens if migrations or startup preparation fail. Shutdown stops admission, allows up to 15 seconds
for active requests, and releases scoped resources. Allow at least 20 seconds before forcing container shutdown.

Scalar is bundled with the pinned Effect dependency and needs no third-party CDN or fonts. Its
CSP permits only the exact bundled script hashes; API connections stay on the same origin.
Both documentation routes are always enabled. Health routes are separate from the product OpenAPI
document. Proof replacement is exclusively a local CLI command.

## Configuration

The [database configuration](../../packages/database/README.md#configuration) is required by
`serve` and proof replacement. Secrets use Effect `Config`/`Redacted`.

| Variable               | Default   | Meaning                                                                                                         |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`           | Required  | Canonical HTTPS origin; HTTP allowed only for loopback development. No credentials, subpath, query or fragment. |
| `SERVER_HOST`          | `0.0.0.0` | Node listener address.                                                                                          |
| `SERVER_PORT`          | `8080`    | Node listener port.                                                                                             |
| `CORS_ALLOWED_ORIGINS` | Empty     | Comma-separated additional browser origins. `PUBLIC_URL` is always allowed.                                     |
| `TRUSTED_PROXY_CIDRS`  | Empty     | Comma-separated proxy IP networks trusted for `X-Forwarded-For`.                                                |

Setup also requires `CRYPTO_ENCRYPTION_KEY`, `CRYPTO_HMAC_KEY`, `EMAIL_PROVIDER`,
`EMAIL_FROM` and the selected provider's credentials. Generate each 32-byte base64 key
independently with `openssl rand -base64 32`; keep them stable across replicas/restarts
and preserve them with backups. Legacy `EMAIL_ENCRYPTION_KEY` remains a fallback for
the encryption key in direct server deployments.
The [email README](../../packages/emails/README.md#configuration) documents provider variables.

Production requires a real provider.
For local console delivery, explicitly set both `NODE_ENV=development` and
`EMAIL_PROVIDER=development`; logs then include verification codes. There is no
silent delivery fallback. Configuration errors prevent binding, while transient
provider failures are handled asynchronously by the durable outbox. Startup sends
no test email. The server starts delivery and expired-proof cleanup after preparation; CLI reissue
never starts a worker. Provider acceptance does not prove inbox delivery.

By default, rate limiting uses the TCP peer address and ignores forwarded headers. Behind a proxy,
allow only its actual CIDRs and restrict direct access to the server. Forwarded addresses are
walked from the socket through trusted hops, stopping at the first untrusted address. Invalid
trusted forwarding input shares a conservative unknown-client bucket.

`PUBLIC_URL` controls secure cookies and operator links independently of internal HTTP proxy
connections. The host-only `preface_session` cookie has `HttpOnly`, `SameSite=Lax`, `Path=/` and
absolute expiry. HTTPS installations also use `Secure` and HSTS. Additional CORS origins do not
override browser SameSite rules; use a same-site frontend for cookie authentication.

Migration history contains a regenerated baseline and additive handoff, audit-permission and
SAML-key migrations. Databases using deleted development history need an explicit reset.
Startup never resets a database.

## Request policy

Every mutation requires an exact allowed `Origin`, including non-browser clients. POST, PUT and PATCH bodies
must be uncompressed JSON. Action endpoints accept `{}` where no other input is needed. Use `credentials: "include"` for a browser client on another allowed
origin. Session credentials are accepted only through the cookie, never a JSON field or URL.

Requests have a 32 KiB streaming body cap, a 16 KiB native header cap, ten seconds for headers,
15 seconds for receiving the request and a 30-second application deadline. Responses passing
through the application policy include a generated `X-Request-Id`, `Cache-Control: no-store`,
`nosniff`, no-referrer and frame protection. Native parser failures and oversized streaming bodies
may close the connection before an application response can be written.

Rate windows last one minute: 240 general requests per client, 30 setup-proof inspections, five
setup issuance/resend requests and ten setup code-verification attempts. At most two mutating setup requests
run concurrently before payload decoding. A shared database cooldown and five-attempt
challenge budget independently protect verification across replicas. Rejection returns 429 and `Retry-After`. Health probes
bypass rate limits. These limits are process-local with at most 10,000 active buckets; replicas
need a shared admission layer when distributed enforcement becomes necessary.

Expected domain errors retain their public tagged shape. Malformed input becomes a sanitized
`RequestError`; SQL, validation issues, codes and native causes are omitted. Retryable storage
failures return 503; unexpected failures return 500. Logs contain a request ID, known route name,
method, status and duration, with no arbitrary paths or queries. Do not automatically retry setup
completion: a lost response can follow a committed completion, and the proof cannot be replayed.

Logout is idempotent for an absent, malformed or invalid cookie. Operational failures still fail
the request; a failed revocation is not reported as successful logout.

Organization handlers provide current membership/permission checks, owner-protected
lifecycle operations and transactional audit. Instance owners create organizations;
organization membership authorizes access. Scalar documents the complete contract.
Parameterized request logs retain the route template rather than tenant/resource IDs.
No additional environment variables or provider dependencies are needed.

## Configure Google sign-in

An instance owner configures Google through the authenticated API; no Google environment variables
are required. Use the existing encryption key and `PUBLIC_URL`. Register exactly
`<PUBLIC_URL>/api/v1/auth/google/callback` as the Google OAuth web client redirect URI.

Save client ID/secret at `PUT /api/v1/instance/authentication/google` with `expectedRevision: 0`
for first configuration. The API returns safe draft settings. Start a test at its `/test` action,
open the authorization URL in that browser, then call `/activate` with the tested revision.
Each action requires current instance ownership and recent email proof. The test never switches
or links the operator's account. Secret updates invalidate Google evidence and require retesting.

Organization owners opt in with `PATCH /api/v1/organizations/:organizationId/auth-policy` and
`{ expectedRevision, googleEnabled: true }`. Members explicitly connect Google through
`POST /api/v1/users/me/accounts/google/start`; ordinary Google login starts at
`POST /api/v1/auth/google/start`. Every start returns an authorization URL and sets a separate
HttpOnly browser-flow cookie. Follow the URL in that same browser. The callback sets any new
session only by cookie and returns 303 to the configured dashboard destination, or `/api/docs`
when no dashboard is configured. A valid invitation can enroll a user directly through Google;
an uninvited login cannot create organization membership. See external enrollment below.

Signed-in users can request an email proof at `/api/v1/auth/reauthentication/email/request`,
replace it at `/resend`, and verify code/link at `/verify`. The temporary cookie and current
session are both required. Verification adds email evidence to that session. This permits
Google-authenticated members to access an email-only organization and approve sensitive account
changes. Ordinary signed-out email sign-in remains separate.

Disabling the instance connection invalidates Google evidence everywhere; unlinking an account
invalidates its evidence. Independent email proof remains usable. Maintenance scrubs expired
external-flow context and removes old flows after startup, alongside existing email proofs.
Verified Gmail or matching Workspace hosted-domain claims can supply email ownership proof for
external enrollment. Invitation and membership requirements still apply. Google-side logout and
deprovisioning notifications are not implemented. See [Google architecture](../../architecture/identity-access/google.md).

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

For real PostgreSQL, run `pnpm test:postgres` from the workspace root with a local Docker
runtime. It owns the container, credentials, readiness and cleanup, and runs the database,
email, application and server suites sequentially. Built process tests verify startup, proof replacement,
restart preservation, completed setup refusal and failure before binding. Manual built-process
runs skip their destructive cases without `PREFACE_TEST_POSTGRES_PORT` (and the matching
`PREFACE_TEST_POSTGRES_PASSWORD` when password authentication is used).

For real browser/provider journeys:

```sh
pnpm exec playwright install chromium
pnpm test:auth
```

This lane requires local Docker and `openssl`. It builds the server, starts disposable PostgreSQL,
Keycloak and Mailpit, and uses Chromium with a fresh database, realm and browser context per test.
Mail travels through the real SMTP worker with STARTTLS to Mailpit. Generated test certificates
are explicitly trusted by the backend; browser/controller certificate exceptions apply only to
these local fixtures. The test frontend is a controlled authentication destination, not the dashboard.
See [testing architecture](../../architecture/engineering/development.md#disposable-authentication-journeys)
for coverage and limits. No deployment configuration, live inbox or real provider credentials are used.
Failures retain local Playwright reports/traces under ignored `playwright-report/` and `test-results/`.
They can contain synthetic session credentials; CI retains failure artifacts for three days.

## Organization OIDC

Organization owners configure their providers through `/api/v1/organizations/:organizationId/
identity-connections`. The [API README](../../packages/api/README.md#organization-oidc) documents
payloads and actions. Register the returned callback URL with the provider, run the browser test,
activate the tested revision, approve it through organization policy, then explicitly link accounts.
Email remains available. Unknown identities require verified email and existing membership or a valid invitation; see external enrollment below.

The runtime supplies the OIDC SDK adapter and outbound HTTPS policy. No provider credentials are
required in environment variables; they are encrypted using the existing application key. For a
private-network identity provider, operators may set comma-separated exact HTTPS origins:

```dotenv
OIDC_ALLOWED_PRIVATE_ORIGINS=https://identity.internal.example
```

The default blocks private/special-use addresses, including after DNS changes. An exception permits
only the named origin/port, never insecure HTTP or invalid certificates. Configure Node's trusted
CA certificates in the deployment when an internal CA is used. Redirects and oversized provider
responses are rejected; credentials and callback query values stay out of request logging.

The browser flow cookie is separate from Google. Successful callbacks return 303 to `/api/docs` or the configured dashboard origin
and deliver a new session only in an HttpOnly cookie. See [OIDC architecture](../../architecture/identity-access/oidc.md) for source revocation and limits. Provider logout and immediate external employee revocation notifications
are not implemented.

## Required SSO and recovery

Owners can require approved organization OIDC or SAML connections through the policy editor after preparing
a tested active connection, fresh provider/email evidence and an offline recovery credential.
The [API usage](../../packages/api/README.md#required-organization-sso) documents readiness, policy
settings and `/auth-recovery` endpoints. Existing sessions remain global; email alone cannot access
an organization requiring SSO. Invitation acceptance directs members to complete SSO after verifying
their mailbox. The installation Google connection is not enterprise organization SSO evidence.

If the provider is unavailable, an existing organization owner signs in by email, verifies recently,
and redeems their offline credential. Recovery makes SSO optional, consumes the credential and
queues owner alerts atomically. It grants no new authority and adds no automatic fallback. This
works for archived organizations without restoring them. Recovery secrets are shown only at
rotation; store them securely. No additional environment variables or dependencies are needed.

## Organization SAML

The runtime supplies `NodeSamlIdentity` and certificate crypto using existing public-origin and
application encryption configuration. Credentials are configured per organization, with no SAML
environment variables. Create a named draft, import its metadata into the IdP, configure IdP values,
complete the browser test, activate and approve it. See [API usage](../../packages/api/README.md#organization-saml).

The connection ACS is the only product POST accepting an external Origin and form encoding. Its
streaming body limit is 256 KiB; other product routes retain 32 KiB JSON limits. Both Response and
Assertion signatures are required. The ACS stages an encrypted verified result and returns 303
to cookie-bound same-origin completion. Session and flow cookies remain HttpOnly/SameSite=Lax;
normal session delivery occurs only at completion. Maintenance also expires replay reservations.

Certificates are pinned and must remain valid. Rotate the generated one-year SP signing certificate
before expiry, update the IdP metadata and retest. Trust changes revoke flows/evidence, preserving
required-SSO owner safeguards. [SAML architecture](../../architecture/identity-access/saml.md) documents
IdP rollover, explicit account linking and the constrained supported profile. SLO, encrypted assertions and provider-driven provisioning are separate from this backend.

## External enrollment and frontend destinations

Set optional `DASHBOARD_URL` to the trusted frontend origin, such as `http://localhost:3000`
for local development. Empty/unset configuration keeps `/api/docs` completion. The dashboard
origin is included in trusted mutation/CORS origins. `PUBLIC_URL` remains the backend origin
for provider callback, SAML ACS and metadata. Email/setup URLs use the dashboard when configured.
Use HTTPS and same-site dashboard/API origins in deployments; session cookies stay HttpOnly,
host-only and SameSite=Lax. Arbitrary third-party-site cookie deployments are not supported.

Invitation SSO starts and callbacks support verified implicit linking and direct first-time
admission. Pending provider proof uses the shared encrypted flow and a separate
`preface_external_flow` browser cookie. See [API usage](../../packages/api/README.md#direct-invitation-sso-and-continuation)
and [enrollment architecture](../../architecture/identity-access/enrollment.md). An uninvited
IdP login cannot create membership. Authentication routes are grouped under `http/routes/auth`,
organization administration under `http/routes/organization`, and instance/profile routes under
their owning folders. Browser workflows are implemented in the separate [dashboard](../dashboard/README.md) app.
