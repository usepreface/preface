# Preface

Open-source, self-hosted knowledge infrastructure built with TypeScript and Effect.

This repository contains monorepo tooling and these workspace packages and applications:

- [protocol](packages/protocol/README.md): runtime-neutral shared Effect schemas, models and errors.
- [database](packages/database/README.md): Node.js persistence with Effect and Drizzle ORM/Kit.
- [application](packages/application/README.md): transactional instance setup, email sign-in, sessions and organization administration.
- [api](packages/api/README.md): shared Effect HTTP contract and typed client metadata.
- [crypto](packages/crypto/README.md): credential generation, purpose-separated digests and authenticated encryption.
- [emails](packages/emails/README.md): typed durable email jobs and provider adapters;
  operational setup/sign-in rendering and scoped delivery.
- [server](apps/server/README.md): migration-gated backend, setup/session HTTP and operator CLI.
- [template](packages/template/README.md): reusable starter for internal packages.
- [ui](packages/ui/README.md): the design system - Base UI components in the shadcn/ui structure, Preface tokens,
  icons, company logos and brand marks.
- [dashboard](apps/dashboard/README.md): the authenticated dashboard for setup, email/enterprise sign-in and organization administration.
- [landing](apps/landing/README.md): preface.run, the landing page, on TanStack Start for Vercel.
- [uikit](apps/uikit/README.md): Preface UI Kit, the living reference for every component, icon, logo and piece of art in light and dark.

The database package includes connection/transaction services, error mapping, migration tooling,
PGlite/PostgreSQL test layers, and instance, auth and audit tables/repositories grouped in PostgreSQL
schemas. Protocol provides storage models, public bootstrap/session contracts and branded identities.
Application implements first-owner setup, browser-bound email code/link sign-in, sessions and
organization creation, membership, roles and ownership. The server wires
startup preparation, operator links, HTTP handlers and always-available Scalar/OpenAPI
on port 8080. The dashboard defaults to port 3000 and the landing page to port 4000. The dashboard connects setup, sign-in, organizations, teams, roles, invitations and enterprise authentication.

Start with the [architecture index](architecture/README.md) for system boundaries, contracts,
identity flows, storage, runtime and frontend ownership. The [server README](apps/server/README.md)
explains backend configuration and deployment.

## Setup

Use Node.js 24 (the exact development version is in `.node-version`) and pnpm 12.14.0, pinned in
`package.json`. Enable pnpm through Corepack, then install dependencies:

```sh
corepack enable pnpm
pnpm install
```

Installation enables Lefthook's Git hooks. Dependencies shared by multiple workspace packages use
the default catalog in `pnpm-workspace.yaml` through `catalog:`. Dependencies used by only one
package keep their versions in that package's manifest. Catalog mode is `manual` so new package-local
dependencies are not automatically added to the catalog. Workspace packages live under
`apps/*` and `packages/*`. Copy `packages/template` to start an internal package; its README covers setup and
source-first development with the `preface-source` condition.

## Local development

With Docker running and `openssl` available, start from the repository root:

```sh
pnpm services:up
pnpm dev
```

`services:up` starts healthy PostgreSQL and Keycloak containers from `compose.yaml`.
Database name, username and password are all `preface`. Keycloak's admin username and
password are also `preface`. These fixed credentials and loopback ports are for local
use only; the development Compose file does not read the root `.env`.

`pnpm dev` uses Turbo to run the server, dashboard and landing page. The UI kit stays
separate: `pnpm --filter @usepreface/uikit dev`.

| App                     | URL                            |
| ----------------------- | ------------------------------ |
| Dashboard               | http://localhost:3000          |
| Landing page            | http://localhost:4000          |
| Backend / API reference | http://localhost:8080/api/docs |
| Keycloak admin          | https://localhost:8443/admin   |
| PostgreSQL              | `127.0.0.1:5432`               |

Setup generates `.local/development/server.env` with stable random crypto keys and
console email delivery, plus a local Keycloak certificate. No manual `.env` copy or
key generation is required. The server loads those defaults before optional
`apps/server/.env` overrides; existing overrides and keys are never changed. Keep the
generated directory while retaining the database, because it contains encryption keys.

Open the operator link printed by the server to set up the instance. Email codes
appear in the same terminal. Keycloak uses HTTPS to work with Preface's provider
policy; accept its self-signed development certificate in your browser when opening
it locally. The backend trusts only that added certificate, without changing system
trust. Create a Keycloak realm/client when you want to configure an SSO connection.

Stop the app watchers with Ctrl+C, then stop the services:

```sh
pnpm services:down
```

Stopping services preserves database and Keycloak volumes. These persistent local
services are separate from the disposable infrastructure used by automated tests.

## Commands

| Command                | Purpose                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm check`           | Check formatting, lint root configuration, typecheck it with TypeScript 7, and run workspace checks/builds |
| `pnpm check:root`      | Check formatting, lint and typecheck root tooling without workspace tasks                                  |
| `pnpm format`          | Format tracked and unignored files with Oxfmt                                                              |
| `pnpm format:check`    | Check formatting without writing changes                                                                   |
| `pnpm lint`            | Run Oxlint, then workspace lint tasks                                                                      |
| `pnpm lint:fix`        | Apply Oxlint fixes                                                                                         |
| `pnpm typecheck`       | Check root TypeScript configuration files, then workspace typechecks                                       |
| `pnpm build`           | Run workspace builds through Turborepo                                                                     |
| `pnpm test`            | Run workspace tests through Turborepo                                                                      |
| `pnpm test:postgres`   | Run sequential integration and built smoke suites in disposable PostgreSQL                                 |
| `pnpm test:auth`       | Build the backend and run Chromium journeys with PostgreSQL, Keycloak and Mailpit                          |
| `pnpm test:dashboard`  | Build the SPA and run browser workflows against disposable PostgreSQL, Keycloak and Mailpit                |
| `pnpm test:uikit`      | Run Chromium keyboard and pointer regressions against shared components in the UI Kit                      |
| `pnpm typecheck:tests` | Typecheck root infrastructure and browser fixtures                                                         |
| `pnpm services:up`     | Start healthy local PostgreSQL and Keycloak services                                                       |
| `pnpm services:down`   | Stop local services while retaining their data                                                             |
| `pnpm dev`             | Start server, dashboard and landing page through Turborepo                                                 |

Workspace checks and builds run across the workspace. Database tests cover configuration,
error mapping, transactions and migrations with PGlite; an opt-in PostgreSQL lane verifies the
real driver and migration locking. Application tests exercise bootstrap concurrency and proof
lifecycle, audit rollback, session lifecycle and security adapters. See the
[database README](packages/database/README.md) and [application README](packages/application/README.md).
Klarity supplies the strict TypeScript, tsdown, Oxlint, Oxfmt, Conventional Commit and Lefthook presets.
Each package should choose its own environment-appropriate Klarity TypeScript preset; the root config
checks root and workspace tooling files; a separate test configuration checks cross-package fixtures.

Pre-commit hooks format staged files and lint staged JavaScript/TypeScript. Commit messages must use
Conventional Commits, for example `chore: bootstrap repository tooling`. Pre-push runs root checks
alongside Klarity's workspace lint, typecheck and test tasks. GitHub Actions installs the frozen
lockfile under the pinned Node version. Separate jobs run `pnpm check`/`pnpm test`,
`pnpm test:postgres` and `pnpm test:auth`. The latter two require a local Docker-compatible runtime;
auth journeys also need `openssl` and `pnpm exec playwright install chromium`.
That browser job also runs `pnpm test:dashboard` against the built SPA and
`pnpm test:uikit` against its dedicated local UI Kit server.

## VS Code

Install the workspace's recommended extensions for Oxc, TypeScript 7 and YAML. Shared
settings enable Oxfmt formatting and safe Oxlint fixes on save, and point the native TypeScript
language server at the installed TypeScript 7 package. Tool configuration discovery stays enabled so
future package-local overrides work. The CLI and GitHub Actions remain the authoritative checks.

## Effect guidance

Effect 4 is installed as a root development dependency so its version-matched guidance and source are
available before application implementation. Read `node_modules/effect/AGENTS.md` and its relevant
`ai-docs` examples before writing Effect code. Future workspaces that use Effect must declare their
own dependency through `catalog:`; the root installation does not replace package-owned dependencies.

Local research, populated environment files, dependencies and generated artifacts remain Git-ignored.
Sanitized `.env.example` and `.env.*.example` files may be committed.
