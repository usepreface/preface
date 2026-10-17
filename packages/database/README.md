# @usepreface/database

Node.js persistence for Preface using Effect SQL and Drizzle. Owns connection setup,
database schemas, relations, migrations, transaction boundaries and typed repositories.
Shared domain contracts belong in [protocol](../protocol/README.md); business workflows,
authorization and transport policy belong in application packages.

The foundation, three instance tables and initial auth/audit storage are implemented. Migrations
create the `instance`, `auth` and `audit` PostgreSQL schemas and their tables. Application/server
workflows are not implemented.

## Instance persistence

`InstanceRepository.layer` groups the installation, settings and owner repositories. It requires
`Database` and `TransactionService`; provide both from the same database composition.
Its `initialize()` atomically creates the singleton installation and default settings, returning
whether the installation was newly created. Repeated or concurrent initialization preserves
the existing installation identity, bootstrap state, and edited settings. Migration execution
creates tables only; initialization is an explicit operation for the future startup workflow.

- `installation` stores the fixed row key `1`, UUIDv7 installation identity, creation time,
  bootstrap completion, and an optional setup-token digest/issuance/expiry tuple. Check constraints
  enforce complete token metadata, expiry ordering, and token removal after completion.
- `settings` references the installation and stores display name, revision, and timestamps.
  `update` requires the expected revision, increments it atomically, and uses the Effect clock
  for `updatedAt`. A missing row or stale revision returns `undefined`.
- `owner` stores UUIDv7 grant IDs, user IDs, grant source/actor/time, and revocation history.
  Partial unique indexes allow one active grant per user and one historical bootstrap grant.
  Regranting creates a new row. Owner-issued grants require an actor; bootstrap and operator
  recovery grants have no Preface actor. Repository mutations serialize on the installation row;
  revocation refuses to remove its last active owner grant.

`installation.issueBootstrapToken` accepts an already-computed digest and future expiry; it never
generates or logs a raw token. Replacement invalidates the previous token. `completeBootstrap`
locks the installation, checks the current digest and fresh Effect time, requires an active owner,
and atomically clears token metadata while closing bootstrap. Invalid, expired, future-issued,
replayed, or replaced tokens return `undefined`. `installation.lock()` requires an active
`TransactionService.run`; use it to coordinate the future full bootstrap workflow.

Owner subjects, granting actors and revoking actors reference `auth.user` with restrictive foreign
keys and typed relations. Storage verifies user existence, not usability.
The last-owner safeguard protects active grants only; future authentication/lifecycle workflows
must also check suspension and other user states. Repositories do not authorize a caller.

Full bootstrap must create the user, password credential, owner grant, session and installation
completion in one outer transaction, with its required audit event. This change does not implement
authentication, recovery commands, authorization, startup token generation/logging,
or HTTP/UI flows. Signup remains invitation-only, and only instance owners may create organizations;
neither policy is a configurable settings column.

## Auth and audit storage

- `auth.user` stores UUIDv7 identity, display name, unique canonical email, nullable email
  verification/disable timestamps and creation/update timestamps. Names are trimmed and 1–120
  characters; canonical email is nonempty, trimmed and lowercase. Address syntax is validated by
  protocol. Changing email must clear verification in the future application workflow.
- `auth.password_credential` has one row per user, an opaque nonempty encoded password hash,
  creation time and password-change time. Password changes cannot precede creation. The future
  crypto service owns Argon2id hashing; no hashing library or authentication behavior is added here.
- `auth.session` stores UUIDv7 session identity, user, unique SHA-256 token digest as 64 lowercase
  hex characters, creation/activity/absolute-expiry timestamps and nullable revocation time.
  Indexes support digest lookup, user history and expiry cleanup. Expiry must follow creation;
  activity/revocation cannot precede it. Idle expiry, periodic activity writes, cookie transport
  and revocation workflows belong to the application/server.
- `audit.event` stores actor attribution, event/target types and target UUID, object metadata and
  occurrence time. Actor foreign keys are restrictive. Protocol correlates supported events with
  typed targets and metadata; SQL enforces actor attribution and object metadata. Polymorphic
  targets have no foreign key. Indexes support chronology, actor history and target history.
  Audit is append-only by application convention; this migration adds no database immutability
  trigger or privilege policy. Future repositories must expose append/query operations only and
  keep secrets out of event metadata. Organization scoping comes with organization persistence.

All auth user foreign keys use `on delete restrict`; account disabling preserves references and
history. There is no account-disable workflow yet. Auth and audit repositories, public DTOs,
bootstrap/login/logout, password reset and authorization are still pending. Write related lifecycle
timestamps explicitly from the same Effect clock instant, including `createdAt` when checking
against it; do not mix an earlier test/application time with a later database insertion default.
The auth/audit migration deliberately fails if older owner rows reference nonexistent users; it
does not fabricate users or silently remove historical grants.

## Services and composition

- `Database.layer` acquires one scoped PostgreSQL pool and the typed Drizzle database.
  Importing or building the package does not read deployment configuration or connect.
- `TransactionService.layer` depends on `Database`. `run(effect)` uses the underlying
  Effect SQL client's transaction context, so repositories can capture `Database` once
  and query it directly. No separate transaction executor lookup is needed.
- `DatabaseMigration.layer` depends on `Database` and completes only after successful
  migrations. `runDatabaseMigrations()` also supports an explicit release command.

Compose one shared database Layer:

```ts
const PersistenceLive = Layer.mergeAll(TransactionService.layer, DatabaseMigration.layer).pipe(
  Layer.provideMerge(Database.layer),
);
```

HTTP listeners and workers must explicitly require `DatabaseMigration` before acquisition.
Merging their Layers alongside migrations does not establish startup order. There is no
server or worker in this repository yet; their startup gates must be wired when introduced.

Transactions commit on success and roll back on failure, defects or interruption. Nested
`TransactionService.run` calls join the current transaction without a savepoint. Catching
an inner domain failure inside the outer body can therefore commit earlier inner writes;
recover outside `run` when the entire operation must roll back. Do not detach work or
perform external network calls inside a transaction. Automatic transaction retries and
an explicit savepoint API are intentionally deferred until a workflow needs them.

`DatabaseError` and `mapToDatabaseError` normalize known SQL/Drizzle failures while preserving
other typed failures, defects and interruption. The complete original error and structured
Effect SQL reason remain available internally, including unique constraint names and
retryability. The error message is generic; causes/reasons can contain sensitive SQL or
parameters and must never become public DTOs or unfiltered logs. HTTP/domain translation
belongs at the boundary that knows the error's meaning.

## Configuration

Copy [`.env.example`](.env.example) to `packages/database/.env` for local CLI use. The
package does not load `.env` implicitly; the migration/Studio commands load it explicitly.
Applications supply configuration through their Effect `ConfigProvider`.

Required variables: `POSTGRES_HOST`, `POSTGRES_DATABASE`, `POSTGRES_USERNAME`,
`POSTGRES_PASSWORD`. Passwords are loaded as `Redacted`.

Optional variables:

| Variable                   | Default                 |
| -------------------------- | ----------------------- |
| `POSTGRES_PORT`            | `5432`                  |
| `POSTGRES_SSL`             | `false`; enable for TLS |
| `POSTGRES_MAX_CONNECTIONS` | `10`                    |
| `POSTGRES_CONNECT_TIMEOUT` | `10 seconds`            |
| `POSTGRES_IDLE_TIMEOUT`    | `60 seconds`            |

For custom TLS options or other driver configuration, compose `makeDatabase` with an
explicit `PgClient` Layer. Drizzle Kit Studio uses `pg` as a development-only adapter;
application queries use Effect's native PostgreSQL driver.

## Schema conventions

- Group tables by domain: `schema/instance/` uses `instanceSchema`, `schema/auth/` uses
  `authSchema`, and `schema/audit/` uses `auditSchema`. Define tables against the domain's
  `schema.ts` and export them from its
  index and `schema/index.ts`. Add future domains as separate PostgreSQL schemas.
- Use singular snake_case SQL names and camelCase TypeScript properties. Name important
  constraints and indexes explicitly, and choose foreign-key deletion behavior deliberately.
- Use PostgreSQL `uuid` columns with `$defaultFn(generateUuid7)` for application-generated
  identifiers. The shared generator delegates to the `uuid` package's v7 implementation.
  These are application defaults; direct SQL writers must supply identifiers themselves.
- `timestampColumns()` returns fresh `createdAt`/`updatedAt` column builders using
  `timestamptz`, JavaScript `Date` values and database insertion defaults. Repositories
  must explicitly update `updatedAt` from the Effect clock (converting `DateTime` to `Date`)
  when changing a row. There is no hidden wall-clock update hook or database trigger.
- Define typed relations in `relations/`. Repositories should return decoded domain
  models or focused results and map storage failures at their boundary. Shared contracts
  must remain independent of Drizzle.

## Migrations and commands

From the repository root:

```sh
pnpm --filter @usepreface/database db:generate --name=describe-change
pnpm --filter @usepreface/database db:migrate
pnpm --filter @usepreface/database db:studio
pnpm --filter @usepreface/database typecheck
pnpm --filter @usepreface/database lint
pnpm --filter @usepreface/database build
pnpm --filter @usepreface/database test
pnpm --filter @usepreface/database test:built
```

Generation needs no credentials or running database. Inspect generated SQL/snapshots and
preserve migration history. Runtime migrations use a PostgreSQL transaction advisory lock
on the same reserved connection as the migrator, automatically released on completion or
failure. They reject execution inside an existing transaction. Run a coordinated release
command or the startup Layer, never migrations in requests.

Builds emit unbundled ESM, declarations and maps into `dist/`; `migrations/` is included
as a runtime asset. The migration folder resolves relative to the module in both source
and built output. A deployed build can run `node dist/migrations/run.js` from this package.
Consumers use `preface-source` for source development; default exports use built output.
Build workspace dependencies through root `pnpm build` or Turbo when consuming built output;
`test:built` builds the database and protocol dependency graph automatically.

## Testing

`@usepreface/database/testing` exports `TestDatabase`. Its PGlite Layer creates a fresh
in-memory database, applies the real migrations, and provides `Database`, `TransactionService`,
`DatabaseMigration` and `TestDatabase`. The test migration path deliberately omits the
PostgreSQL advisory lock. `reset` truncates tables in `auth`, `instance` and `audit` and preserves
migration history. Tests use real tables and repositories, with shared database Layers and user
fixtures under `tests/fixtures/`. Unit tests cover configuration/error boundaries;
`tests/integration/` groups transaction, migration, auth persistence and instance scenarios by
domain. `tests/smoke/built.test.mjs` checks built exports and packaged migrations. The suite focuses
on rollback, token lifecycle and concurrency; it does not repeat ordinary SQL constraint checks.
PGlite dependencies are development-only and are not imported by the main package entry.

For real driver, migration-lock and transaction coverage, run the same suites against a
disposable PostgreSQL database:

```sh
docker run --detach --rm --name preface-database-test \
  -e POSTGRES_USER=preface_test -e POSTGRES_DB=preface_test \
  -e POSTGRES_HOST_AUTH_METHOD=trust -p 127.0.0.1:55439:5432 postgres:17-alpine
PREFACE_TEST_POSTGRES_PORT=55439 pnpm --filter @usepreface/database test
docker stop preface-database-test
```

Wait for PostgreSQL to become ready before running tests. `TestDatabase.postgresLayer(port)`
pins the host to loopback, database/user to `preface_test`, disables TLS, uses an empty
password, and rejects port 5432. It never falls back to deployment configuration. Files
run serially in this lane because they reset shared tables. Do not run two test processes
against the same database. `test:built` checks built imports and migration asset resolution.

## Drizzle compatibility patch

`patches/drizzle-orm@1.0.0-rc.4.patch` replaces the removed Effect
`Schema.TaggedErrorClass` API with `Schema.TaggedError` in Drizzle's ESM and CommonJS runtime
error definitions. It fixes importing the Effect drivers with Effect 4.0.5. ORM and Kit
stay on matching exact versions; review and remove the patch after an upstream fix.
