# Backend composition and HTTP boundary

Preface's implemented backend flows are instance preparation, first-owner setup, current-session
resolution and logout. No organization, invitation, sign-in or frontend workflow is wired yet.

## Dependency direction

- `protocol` owns public schemas, persistence models and expected domain errors. Wire request
  schemas encode plain JSON; decoded application inputs wrap credentials in `Redacted` and refuse
  secret serialization. Public session actors contain neither credentials nor storage digests.
- `database` owns PostgreSQL, migrations, transactions and repositories. `checkDatabaseConnection`
  provides a minimal readiness probe using the same pool and normalized storage errors.
- `application` coordinates business rules, crypto and transactional audit. It does not import
  HTTP, cookies, environment configuration or server implementations.
- `api` declares Effect HTTP endpoint groups, response statuses, middleware requirements and
  OpenAPI metadata. It imports only protocol and Effect and can be shared with browser clients.
- `apps/server` supplies Node implementations, configuration, middleware, handlers and commands.
  It is the runtime composition root and owns transport authorization and deployment policy.

## Startup ordering

`BackendLive` shares one database pool across migrations, repositories and application workflows.
Application acquisition requires completed migrations. `Startup` then prepares the instance and
emits any newly issued operator proof after its transaction commits. `Server` requires `Startup`
and the constructed HTTP application before acquiring the Node listener. Merging migration and
listener Layers as siblings would not enforce this order.

Existing valid proofs survive restart. Only the issuer receives the raw credential; digests
cannot reconstruct lost output. Explicit `preface instance setup-link reissue` replaces it without
running ordinary startup preparation first and refuses completed installations. There is no HTTP
replacement route. The supported `/setup#token=…` operator output reserves a future frontend route.

## HTTP composition

`HttpApplication` builds a concrete router effect and wraps it in the request policy before
`HttpServer.serve`. This outer boundary covers routing, schema decoding, error conversion and
operational routes. It captures stable database/configuration services without capturing a
request's scope. `HttpApiBuilder` derives product routes and OpenAPI from the same contract.

Setup admission is attached to matched endpoint identifiers, so alternate URL spellings cannot
bypass proof inspection limits or concurrent password-work admission. The general policy applies
trusted-client rate windows, mutation Origin checks, JSON/body limits, deadlines, CORS and security
headers. Limits are deliberately process-local. Native Node parsing has separate size and time
bounds; native failures can occur before the application boundary exists.

Authentication resolves the cookie through the application for each protected request, then
provides `CurrentActor` to its handler. It does not infer instance ownership or organization
membership. Setup completion unwraps the application-issued session credential only when setting
the cookie after commit; JSON contains only the actor. Logout resolves optional authentication,
revokes a valid session with its audit event, then expires the cookie. Infrastructure failure
remains distinct from unauthenticated state.

The public setup token and password are decoded into application inputs at the handler boundary.
Framework and domain decoding failures are sanitized before logging or responding. Storage and
security causes can contain secrets and are never serialized into HTTP errors or routine logs.
Routine logs use bounded route names, request IDs, status and duration. The one-time operator
link is an explicit bootstrap output, separate from routine request logging.

Health routes are independent of OpenAPI. Readiness checks the pool after startup; pending setup
is ready. Scalar serves the contract with bundled scripts and a response-specific hash CSP. Both documentation routes are always enabled. Detailed limits, configuration and
commands belong in the [server README](../apps/server/README.md).

## Verification boundaries

Protocol/API tests cover secret transformations and the generated public contract. HTTP tests
compose migrated real repositories and application workflows with Node security adapters. Small
unit tests cover admission and proxy interpretation. Disposable PostgreSQL process tests verify
built startup, proof replacement/restart and refusal to bind after preparation failure. Existing
database/application tests retain transaction, audit, locking, expiry and concurrency coverage.
