# @usepreface/database

Node.js persistence for Preface using Effect SQL and Drizzle. Owns connection setup,
database schemas, relations, migrations, transaction boundaries and future repositories.
Shared domain contracts belong in [protocol](../protocol/README.md); business workflows,
authorization and transport policy belong in application packages.

The foundation is implemented. The first generated migration creates the empty `instance`
and `auth` PostgreSQL schemas. There are no domain tables or repositories yet.

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
  `authSchema`. Define tables against the domain's `schema.ts` and export them from its
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

## Testing

`@usepreface/database/testing` exports `TestDatabase`. Its PGlite Layer creates a fresh
in-memory database, applies the real migrations, and provides `Database`, `TransactionService`,
`DatabaseMigration` and `TestDatabase`. The test migration path deliberately omits the
PostgreSQL advisory lock. `reset` truncates tables in the managed schemas and preserves
migration history. Test-only probe tables and migrations live under `tests/fixtures/`.
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
