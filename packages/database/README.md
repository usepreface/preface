# @usepreface/database

Node.js persistence for Preface using Effect SQL and Drizzle. Owns connection setup,
database schemas, relations, migrations, transaction boundaries and typed repositories.
Shared domain contracts belong in [protocol](../protocol/README.md); business workflows,
authorization and transport policy belong in application packages.

The foundation, instance/auth/audit tables, and their repositories are implemented. Migrations
create the `instance`, `auth`, `organization` and `audit` PostgreSQL schemas and their tables.
The `jobs` schema contains the encrypted email outbox, exposed through
`DatabaseRepository.jobs.email`. Claims use token-owned leases and PostgreSQL
`SKIP LOCKED`; completion/rescheduling reject stale or expired leases. The
[emails package](../emails/README.md) owns payload encryption, conflict detection,
delivery policy and provider calls. Enqueueing joins the caller's transaction.
[Application](../application/README.md) implements bootstrap, session and organization workflows on these
repositories. The [server](../../apps/server/README.md) wires migration-gated startup and HTTP.

## Repository API

`DatabaseRepository.layer` composes the existing instance repository with auth and audit
repositories. It requires `Database` and `TransactionService` from the same database composition.
Application code can acquire one service:

```ts
import { Effect } from "effect";

import { DatabaseRepository } from "@usepreface/database";

const loadOwner = Effect.gen(function* () {
  const repository = yield* DatabaseRepository;
  return yield* repository.auth.userEmail.findActiveByEmail("owner@example.com");
});
```

| Group                        | Operations                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `instance`                   | `initialize`, `installation`, `settings`, `owner`, `challenge`                                               |
| `auth.user`                  | `findById`, `findProfileById`, `lockById`, `create`, `updateMetadata`                                        |
| `auth.userEmail`             | `create`, `findById`, `findActiveByEmail`, `findPrimaryByUserId`                                             |
| `auth.verification`          | `create`, `findById`, `lockById`, `retirePendingBySubject`, `recordFailure`, `consume`, `deleteExpiredBatch` |
| `auth.sessionAuthentication` | `create`, `listUsableBySessionId`, `revokeBySessionId`                                                       |
| `auth.session`               | `create`, `findActiveByTokenHash`, `recordActivity`, `listActiveByUserId`, `revoke`, `revokeAllByUserId`     |
| `audit.event`                | `append`                                                                                                     |
| `jobs.email`                 | Durable outbox repository used by the emails package                                                         |

Writes encode the focused protocol input, and every returned row decodes into its protocol model,
including `DateTime.Utc` timestamps and branded identities. Missing lookups and conditional
mutations return `undefined`. Unexpected missing insert results and codec mismatches are defects;
known SQL/Drizzle failures become `DatabaseError`. Individual repository services remain exported.

User creation stores identity/profile independently of email. Create its address explicitly
inside the same transaction when the workflow requires both. `findById` returns the normalized
`User`; both `lockById` methods require an active `TransactionService.run`.
`findProfileById` joins the active primary email into `UserProfile`. Session creation
stores a digest and absolute expiry. Lifecycle timestamps use the same Effect clock.

Active session lookup excludes revoked sessions and expiry at or before the current Effect time.
Activity updates use a conditional write, cannot move activity backwards, and never extend expiry
or update an expired/revoked session. An optional Effect `Duration` idle timeout adds a strict
last-activity cutoff to the conditional write, preventing idle-session revival after an earlier
application check. Revocation requires a matching user ID and an unrevoked row;
it can revoke an expired session, and repeated revocation preserves the original timestamp.
User enablement, idle policy, write throttling, and caller authorization belong to the application.

Audit append validates the typed event/target/metadata relationship and records occurrence time
from the Effect clock. It does not expose updates or deletion. Required audit writes must share
the application's outer `TransactionService.run` with the state change; repositories do not append
business audit events automatically. The aggregate and individual repositories use the same ambient
transaction without accepting raw transaction clients.

User, organization and team rows store typed `metadata` JSONB with an explicit version,
replacing separate descriptive name/image columns. Identity, slugs, authority and lifecycle
stay in relational columns. `organization.team` exposes create/find/list/update/archive;
its nested `member` repository owns direct membership and removal. Team membership must
reference an organization member. Role bindings and invitation assignments carry explicit
scope/team columns with composite tenant/scope foreign keys and separate active uniqueness.

## Instance persistence

`InstanceRepository.layer` groups the installation, settings and owner repositories. It requires
`Database` and `TransactionService`; provide both from the same database composition.
Its `initialize()` atomically creates the singleton installation and default settings, returning
whether the installation was newly created. Repeated or concurrent initialization preserves
the existing installation identity, bootstrap state, and edited settings. Migration execution
creates tables only; application startup preparation explicitly initializes the installation.

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
`TransactionService.run`; application bootstrap uses it to coordinate the complete workflow.

Owner subjects, granting actors and revoking actors reference `auth.user` with restrictive foreign
keys and typed relations. Storage verifies user existence, not usability.
The last-owner safeguard protects active grants only; future authentication/lifecycle workflows
must also check suspension and other user states. Repositories do not authorize a caller.

Application bootstrap creates the email-verified user, owner grant, session and installation
completion in one outer transaction with required audit events. Application also generates setup
proofs, resolves sessions and coordinates revocation. The server implements setup-proof replacement,
startup logging and HTTP integration; frontend integration remains pending.
Signup remains invitation-only, and only instance owners may create organizations; neither policy is a configurable settings column.

`instance.bootstrap_challenge` holds one pending setup verification per installation,
including bound operator-proof digest, account details, code HMAC, attempts, expiry
and encrypted email job identity. Repositories support replacement, conditional
failure recording and consumption; the application coordinates them under the
installation lock. Codes and email delivery are not repository responsibilities.

## Auth and audit storage

- `auth.user` stores UUIDv7 identity, versioned metadata, disable state and lifecycle timestamps.
- `auth.user_email` owns canonical email, primary designation, verification, login enablement,
  removal history and timestamps. Partial unique indexes protect active email ownership and one
  active primary address per user. Removed addresses cannot remain primary/login-enabled;
  login-enabled addresses must be verified.
- `auth.verification` holds email-sign-in code/link digests, recipient HMAC, browser binding,
  optional eligible user/email/job source, five-attempt budget, context and expiry/terminal state.
  A partial unique index allows one pending purpose/recipient proof. Consumption rechecks expiry;
  cleanup removes at most 500 proofs at least one day past expiry with `SKIP LOCKED`.
- `auth.session_authentication` records method, authentication time, email source, assurance,
  expiry and revocation. Composite foreign keys keep its session and email on the same user.
  Usable-evidence lookup rechecks active verified login-enabled email and evidence expiry.
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
  trigger or privilege policy. Its repository exposes append only; queries can be added with the
  workflows that need them. Keep secrets out of event metadata. Organization scoping comes with
  organization persistence.

All auth user foreign keys use `on delete restrict`; account disabling preserves references and
history. There is no account-disable workflow yet. Public DTOs and application bootstrap/session
workflows are implemented in protocol/application. The server implements cookie authentication;
email sign-in, sessions, invitations and organization administration are implemented; content authorization remains
pending. Write related lifecycle timestamps from the same Effect clock instant.

The development history is one regenerated initial migration containing organization
authority, invitations, direct teams and versioned metadata. Databases using deleted
development history need an explicit reset; no upgrade/backfill is supplied.
Generation and tests do not reset a developer database automatically.

## Organization persistence

`DatabaseRepository.organization` groups `team`, `organization`, `member`, `role`,
`roleBinding`, `authPolicy` and `invitation`. These are storage APIs; application owns authorization,
last-owner checks, admission, permission delegation and required audit.

- `organization` supports creation, ID/slug lookup, transaction-only locking,
  membership-based pagination, updates, archive and restore.
- `member` supports stable membership creation/lookups, paginated profile projections,
  suspension, reinstatement and removal. There is no public direct-admission API.
- `role` supports built-in/custom storage, lookup, pagination, custom updates and
  retirement. Retired keys remain reserved.
- `roleBinding` supports attributed idempotent grants, active member/bulk-member
  lookup, scoped revocation, role/member grant retirement and usable-owner lookup.
- `authPolicy` creates the default email-code/link policy and reads it by organization.

Composite foreign keys bind roles, members, granting members and policy updaters to
the same organization. Role/member lists default to active records unless history
is requested. Organization discovery can include archived records only for their
owners. Audit adds organization identity without changing global events' null scope.
All write results decode through protocol storage models. Locking and application
mutations use the same ambient transaction.

Relations live in `relations/auth.ts`, `instance.ts`, `organization.ts`, `team.ts` and `audit.ts`.
Each uses `defineRelationsPart` against the schema barrel. The aggregate composes
those parts after the schema-wide empty part, retaining unrelated table inference.

## Services and composition

- `Database.layer` acquires one scoped PostgreSQL pool and the typed Drizzle database.
  Importing or building the package does not read deployment configuration or connect.
- `DatabaseRepository.layer` exposes the instance, auth, and audit repositories without acquiring
  another pool. Its internal services capture the shared database and perform queries at call time.
- `TransactionService.layer` depends on `Database`. `run(effect)` uses the underlying
  Effect SQL client's transaction context, so repositories can capture `Database` once
  and query it directly. No separate transaction executor lookup is needed.
- `checkDatabaseConnection()` probes the same pool with `select 1` and normalizes storage failures.
  The server owns readiness deadlines and HTTP responses.
- `DatabaseMigration.layer` depends on `Database` and completes only after successful
  migrations. `runDatabaseMigrations()` also supports an explicit release command.

Compose one shared database Layer:

```ts
import { Layer } from "effect";

import {
  Database,
  DatabaseMigration,
  DatabaseRepository,
  TransactionService,
} from "@usepreface/database";

const PersistenceLive = Layer.mergeAll(DatabaseRepository.layer, DatabaseMigration.layer).pipe(
  Layer.provideMerge(TransactionService.layer),
  Layer.provide(Database.layer),
);
```

HTTP listeners and workers must explicitly require `DatabaseMigration` before acquisition.
Merging their Layers alongside migrations does not establish startup order. The server requires
completed startup preparation before binding; future workers must establish the same migration gate.

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

## Invitation persistence

`repository.organization.invitation` exposes `create`, `findById`, `locate`, `list`,
`assignments`, `findPendingByEmail`, `replaceCredential`, `revoke` and `accept`.
`create(input, roleIds)` atomically writes invitation and proposed role assignments.
All management writes/lookups are tenant-scoped; `locate(id)` is reserved for token
entry points that need to discover the tenant before verifying credentials.
The application holds the organization lock for every invitation mutation.
`member.readmit(organizationId, memberId)` clears removal only, preserving identity
and join history; invitation workflows authorize it and apply new grants.

Invitation records store token digests and encrypted-email job references. Composite
assignment/inviter foreign keys enforce tenant ownership. Pending recipients are
unique per organization; terminal history is retained. Verification storage supports
separate sign-in and invitation purposes with distinct source/context contracts.
Invitation email proofs have no existing user source and require an email job.
Cleanup handles both proof purposes without deleting invitation history.

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
PostgreSQL advisory lock. `reset` truncates tables in `auth`, `instance`, `organization`, `audit` and `jobs` and preserves
migration history. Tests use real tables and repositories, with shared database Layers and user
fixtures under `tests/fixtures/`. Unit tests cover configuration/error boundaries;
`tests/integration/` groups transaction, migration, auth persistence/session lifecycle and instance
scenarios by domain. `tests/smoke/built.test.mjs` checks the built aggregate and packaged migrations.
The suite focuses on cross-repository rollback, token lifecycle, monotonic session activity,
expiry/revocation and concurrency; it does not repeat ordinary SQL constraint checks.
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

## External identities

`auth.identityConnection`, `auth.account` and `auth.authFlow` extend the same repository aggregate.
Connections persist versioned configuration/encrypted credentials and tested revisions. Account
identity tuples remain unique after unlink. Flow claiming prevents duplicate external exchanges;
consume/revoke clear temporary recoverable context. Cleanup scrubs expired context and deletes
old flow rows in bounded batches. Connection row locks require an ambient transaction.

Session evidence joins its current email source or linked account/active matching connection
revision. Source-specific nullability and composite FKs keep Google evidence tied to its user.
The Google migration extends the existing baseline; generation never changes a developer DB.
Repositories provide persistence/conditional writes; application owns authority and provider calls.
