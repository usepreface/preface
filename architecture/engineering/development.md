# Development and verification

Preface is a pnpm/Turborepo workspace targeting Node.js 24 and pnpm 12.14.0.
Package manifests own their dependencies. The manual default catalog holds shared
versions; package-specific dependencies remain local. Klarity supplies the common
TypeScript, build, formatting, lint and Git-hook presets.

## Source and built boundaries

Backend libraries use unbundled ESM builds with explicit package exports. Development
selects `preface-source` consistently in TypeScript, Node, Vite and Vitest's normal
and SSR resolution. Default exports resolve built artifacts. Internal package imports
use `#/*`; cross-package imports use supported entry points. A global test alias for
`#/*` would incorrectly override the private imports of other packages.

Protocol has root, DTO, input and model entry points. The server executable is its
composition root. Database migrations are runtime assets copied with the package.
Source tests do not prove built resolution: retain smoke checks for exports, CLI
startup, scoped shutdown and migration asset paths.

## Verification lanes

| Boundary      | Current checks                                                                               |
| ------------- | -------------------------------------------------------------------------------------------- |
| Protocol      | Typed audit transformations and safe credential encoding through API tests                   |
| API           | OpenAPI paths/statuses/security and wire/application-input transformations                   |
| Database      | Real migrated repositories, transaction propagation, lifecycle and migration behavior        |
| Application   | Setup concurrency/replay/expiry, audit rollback, session lifecycle and security adapters     |
| Server        | Real HTTP setup/session boundary, request policy, trusted proxy interpretation and admission |
| Built server  | Configuration-free help and opt-in PostgreSQL startup/reissue/restart/failure behavior       |
| Auth journeys | Built server, SMTP delivery, browser cookies, Keycloak OIDC/SAML and recovery                |
| Landing       | Lint/typecheck, production prerender and complete generated-HTML smoke test                  |

Use PGlite for fast persistence tests and disposable PostgreSQL for driver/advisory-lock
behavior. PostgreSQL test configuration pins loopback and the test database/user and
rejects the normal port 5432. Run suites that reset that database sequentially, never
against developer or deployment data. Package READMEs provide the exact commands.

Effect workflows use Effect Vitest and scoped service composition. HTTP fixtures use
live time for real sockets; domain expiry tests use deterministic Effect clocks.
Tests compose actual repositories/application code and substitute external capabilities
at their owning boundary. Keep assertions about meaningful outcomes and durable
effects instead of repeating ordinary database constraints or type checking.

Authentication release verification combines the migrated application/HTTP suites with the built
server PostgreSQL smoke lane. It exercises startup gating, operator-link replacement, restart and
failed-preparation recovery. Cross-organization enrollment races use PostgreSQL; resumable mailbox
verification protects durable failed attempts and a retry after final admission/audit rollback.
The [provider matrix](../identity-access/providers.md) distinguishes real local-provider checks from
SDK fixtures. Controlled browser destinations verify credentialed CORS, HttpOnly session behavior
and logout without introducing dashboard implementation into backend tests.

## Disposable authentication journeys

Root-owned [test fixtures](../../tests/e2e/fixtures) compose infrastructure across package boundaries.
`pnpm test:postgres` owns one PostgreSQL container and runs the database, email, application and server
suites plus available built smoke checks sequentially. Generated credentials reach only the explicit
test configuration. Fast `pnpm test` remains independent of Docker. The runner uses Node 24 native TypeScript
execution, so its direct module import retains the `.ts` extension.

`pnpm test:auth` builds the server graph and runs [Playwright journeys](../../tests/e2e/auth).
A worker owns pinned PostgreSQL, Keycloak and Mailpit containers. Every test receives a fresh
database, browser context and cleared inbox; provider tests also create a fresh Keycloak realm. Execution uses one worker; test order
is not part of the fixture contract. Resources are acquired with scoped cleanup, including partial
startup failure. Container names and host ports are assigned automatically; no persistent volumes,
deployment database configuration or reusable authentication state are used.

The built server runs with migrations, real repositories, crypto adapters and email delivery worker.
Mailpit requires STARTTLS and captures actual SMTP messages. Tests read codes and invitation links
from its API, not the outbox ciphertext or server logs. Only the supported operator setup link comes
from startup output. Local certificates include localhost and 127.0.0.1; Node trusts that generated CA
explicitly. The browser/controller accepts fixture certificates without changing system trust.
Keycloak uses 127.0.0.1 while the API and controlled frontend use localhost. This makes SAML POSTs
cross-site and tests the Lax proof cookie's return on the subsequent same-origin completion GET.

The journeys cover setup, returning email code/link sign-in, direct invited OIDC/SAML admission, implicit
email-first account linking and explicit owner linking, role/team assignment, untrusted-email continuation bound to its browser,
required-SSO gating and offline owner recovery, invitation/connection revocation, assertion replay,
SAML tile login, and staged SP key rollover without losing admitted membership. Aging an invitation's
delivery timestamp in its disposable database models reading an old email without waiting ten minutes.
The IdP's signature, PKCE, nonce and malformed-response failure matrix remains in focused SDK tests;
Keycloak success cannot certify Google, Okta or Entra. These are backend auth journeys, not dashboard
UI or a promise that all possible identity-provider profiles are supported.

[CI](../../.github/workflows/ci.yml) separates fast checks, disposable PostgreSQL and browser journeys.
Failure traces, screenshots and backend output are ignored locally and retained for three days in
CI; they contain only synthetic fixture identities but may include usable test-session credentials.
Do not upload them to public issues without inspection. Root test tooling has a dedicated TypeScript
lane included in `pnpm check`.

`pnpm test:dashboard` builds and serves the real dashboard at the fixture HTTPS origin,
proxies its `/api` requests to the same built backend, and uses the shared disposable
infrastructure with fresh databases/contexts. Its Vite test build disables local environment
files. This separately covers rendered forms, atom loader/hook reuse, successful invalidation,
OIDC/SAML configuration, invitation admission and operational-error versus session-revocation
behavior. See the [dashboard boundary](../interfaces/dashboard.md).

## Extending the foundation

Add the contracts required by a workflow, then persistence, application coordination,
API declarations, server enforcement and finally frontend consumers. Preserve the
single repository/application aggregates. Introduce folders and package exports for
real ownership; avoid scaffolding empty future services.

A major feature is complete when its actual boundaries are wired and verified, its
owning architecture pages describe the resulting state, and any changed usage/configuration
is documented. Update repository guidance when a new ownership or contributor rule
needs to persist. Small changes do not require new architecture documents or routine
`AGENTS.md` rewrites. Correct inaccurate existing docs regardless of change size.

Run focused checks during implementation and `pnpm check` for cross-package work.
The latter runs formatting, lint, typechecking and builds, not the test suite; run
the relevant tests separately. Inspect generated output and Git scope before each
Conventional Commit. Temporary investigation stays in ignored `research/` and is
never an input to runtime code or maintained documentation.

## Source

- [Workspace scripts](../../package.json)
- [Turbo tasks](../../turbo.json)
- [Contributor guidance](../../AGENTS.md)
- [Protocol build](../../packages/protocol/tsdown.config.ts)
- [Database test layers](../../packages/database/src/testing)
- [HTTP fixtures](../../apps/server/tests/fixtures)
- [Disposable PostgreSQL runner](../../tooling/testing/run-postgres.ts)
- [Browser auth configuration](../../playwright.config.ts)
- [Landing artifact test](../../apps/landing/tests/smoke/build.test.mjs)
