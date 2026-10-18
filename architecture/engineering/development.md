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

| Boundary     | Current checks                                                                               |
| ------------ | -------------------------------------------------------------------------------------------- |
| Protocol     | Typed audit transformations and safe credential encoding through API tests                   |
| API          | OpenAPI paths/statuses/security and wire/application-input transformations                   |
| Database     | Real migrated repositories, transaction propagation, lifecycle and migration behavior        |
| Application  | Setup concurrency/replay/expiry, audit rollback, session lifecycle and security adapters     |
| Server       | Real HTTP setup/session boundary, request policy, trusted proxy interpretation and admission |
| Built server | Configuration-free help and opt-in PostgreSQL startup/reissue/restart/failure behavior       |
| Landing      | Lint/typecheck, production prerender and complete generated-HTML smoke test                  |

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
- [Landing artifact test](../../apps/landing/tests/smoke/build.test.mjs)
